from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from common.soft_delete import soft_delete, soft_restore

from content.models import LandingPage
from content.serializers import LandingPageDashboardSerializer
from sponsors.models import PartnersPageSettings, Sponsor
from sponsors.serializers import PartnersPageSettingsSerializer, SponsorSerializer

from .models import (
    DashboardConversation,
    DashboardMessage,
    DashboardNotification,
    DashboardNotificationPreference,
    MemberProfile,
    SiteVisit,
)
from .permissions import DashboardAccess
from .role_utils import (
    MANAGER_READ_ONLY_USER_DETAIL,
    is_dashboard_manager,
    request_is_manager,
    require_full_admin,
    require_superuser,
)
from .serializers_messaging import DashboardMessageSerializer, DashboardNotificationSerializer
from .serializers_prefs import NotificationPreferenceSerializer

User = get_user_model()


def _notification_visible(request, n: DashboardNotification) -> bool:
    """Who may read or mutate a notification row (including soft-deleted), by recipient rules."""
    user = getattr(request, "user", None)
    if user is not None and user.is_authenticated:
        return n.recipient_id is None or n.recipient_id == user.id
    # Server secret / anonymous dashboard access: same as list-all behavior.
    return True


def _notification_queryset(request):
    user = getattr(request, "user", None)
    base = DashboardNotification.objects.filter(deleted_at__isnull=True)
    if user is not None and user.is_authenticated:
        return base.filter(Q(recipient__isnull=True) | Q(recipient_id=user.id))
    return base


def _truthy_query_param(raw) -> bool:
    if raw is None:
        return False
    return str(raw).strip().lower() in ("1", "true", "yes", "on")


def _alive_sponsors_queryset(request):
    qs = Sponsor.objects.all().order_by("sort_order", "-updated_at")
    if _truthy_query_param(request.query_params.get("include_deleted")):
        return qs
    return qs.filter(deleted_at__isnull=True)


def _alive_users_queryset(request):
    qs = User.objects.order_by("-date_joined", "-last_login", "id")
    if request.user.is_authenticated and request_is_manager(request):
        qs = qs.filter(is_superuser=False)
    return qs.filter(Q(member_profile__deleted_at__isnull=True) | Q(member_profile__isnull=True))


def _trashed_users_queryset(request):
    qs = User.objects.order_by("-member_profile__deleted_at", "-id")
    if request.user.is_authenticated and request_is_manager(request):
        qs = qs.filter(is_superuser=False)
    return qs.filter(member_profile__deleted_at__isnull=False)


def _ensure_member_profile(user) -> MemberProfile:
    profile, _ = MemberProfile.objects.get_or_create(
        user=user,
        defaults={"billing": {}, "shipping": {}},
    )
    return profile


def _user_is_trashed(user) -> bool:
    try:
        return user.member_profile.deleted_at is not None
    except MemberProfile.DoesNotExist:
        return False


def _soft_delete_user(user) -> None:
    profile = _ensure_member_profile(user)
    soft_delete(profile)
    if user.is_active:
        user.is_active = False
        user.save(update_fields=["is_active"])
    Token.objects.filter(user=user).delete()


def _restore_user(user) -> None:
    profile = _ensure_member_profile(user)
    soft_restore(profile)
    if not user.is_active:
        user.is_active = True
        user.save(update_fields=["is_active"])


def _permanent_delete_user(user) -> None:
    user.delete()


def _user_mutation_blocked(request, target) -> Response | None:
    if request.user.is_authenticated and request.user.id == target.id:
        return Response(
            {"detail": "You cannot modify your own account here."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if request.user.is_authenticated and request_is_manager(request) and target.is_superuser:
        return Response(
            {"detail": MANAGER_READ_ONLY_USER_DETAIL},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


def _user_row(u):
    role = "Admin" if u.is_superuser else ("Manager" if u.is_staff else "User")
    st = "Active" if u.is_active else "Inactive"
    deleted_at = None
    try:
        if u.member_profile.deleted_at is not None:
            deleted_at = u.member_profile.deleted_at.isoformat()
    except MemberProfile.DoesNotExist:
        pass
    if deleted_at:
        st = "Deleted"
    return {
        "id": u.id,
        "name": (u.get_full_name() or u.username or u.email or "User").strip(),
        "email": u.email or "—",
        "role": role,
        "status": st,
        "avatar": "",
        "lastSeen": _relative_time(u.last_login),
        "deletedAt": deleted_at,
    }


def _user_admin_detail(u):
    """Full user record for dashboard detail view (no secrets)."""
    row = _user_row(u)
    try:
        mp = u.member_profile
        member_profile = {
            "billing": dict(mp.billing or {}),
            "shipping": dict(mp.shipping or {}),
        }
    except MemberProfile.DoesNotExist:
        member_profile = None
    row.update(
        {
            "username": u.username,
            "first_name": (u.first_name or "").strip(),
            "last_name": (u.last_name or "").strip(),
            "is_superuser": bool(u.is_superuser),
            "is_staff": bool(u.is_staff),
            "is_active": bool(u.is_active),
            "date_joined": u.date_joined.isoformat() if u.date_joined else None,
            "last_login_iso": u.last_login.isoformat() if u.last_login else None,
            "member_profile": member_profile,
        }
    )
    return row


def backend_root(request):
    """Browser-friendly landing when someone opens the API origin (e.g. http://127.0.0.1:8000/)."""
    html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Your Enhanced Life — API</title>
</head>
<body style="font-family:system-ui,sans-serif;max-width:42rem;margin:2rem auto;padding:0 1rem;line-height:1.55;color:#111">
  <h1 style="font-size:1.35rem">Django backend</h1>
  <p>This server exposes the <strong>REST API</strong> and <strong>Django Admin</strong>. The public website is the Next.js app (typically <code>http://localhost:3000</code> in dev).</p>
  <ul>
    <li><a href="/admin/">Django Admin</a></li>
    <li><a href="/api/health"><code>/api/health</code></a></li>
    <li><a href="/api/sponsors"><code>/api/sponsors</code></a></li>
    <li><code>/api/landing-pages/&lt;slug&gt;</code> — e.g. <code>home</code>, <code>faq</code></li>
  </ul>
</body>
</html>"""
    return HttpResponse(html, content_type="text/html; charset=utf-8")


def _relative_time(dt):
    if not dt:
        return "—"
    now = timezone.now()
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    delta = now - dt
    if delta < timedelta(minutes=1):
        return "just now"
    if delta < timedelta(hours=1):
        m = int(delta.total_seconds() // 60)
        return f"{m} min ago"
    if delta < timedelta(days=1):
        h = int(delta.total_seconds() // 3600)
        return f"{h} hour{'s' if h != 1 else ''} ago"
    d = delta.days
    if d < 14:
        return f"{d} day{'s' if d != 1 else ''} ago"
    return dt.strftime("%Y-%m-%d")


@api_view(["GET"])
@permission_classes([AllowAny])
def health(_request):
    return Response({"status": "ok"})


def _landing_base_qs():
    return LandingPage.objects.filter(deleted_at__isnull=True)


def _start_of_week(dt=None):
    now = dt or timezone.now()
    start = now - timedelta(days=now.weekday())
    return start.replace(hour=0, minute=0, second=0, microsecond=0)


def _start_of_month(dt=None):
    now = dt or timezone.now()
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _trackable_visit_path(raw) -> str | None:
    path = (raw or "").strip()
    if not path or not path.startswith("/") or len(path) > 500:
        return None
    lower = path.lower()
    if lower.startswith("/dashboard") or lower.startswith("/auth/admin"):
        return None
    if lower.startswith("/api/") or lower.startswith("/_next/"):
        return None
    return path


def _metric_trend(current: int, previous: int) -> str:
    if current > previous:
        return "up"
    if current < previous:
        return "down"
    return "neutral"


def _site_summary_metrics(request):
    now = timezone.now()
    week_start = _start_of_week(now)
    month_start = _start_of_month(now)
    prev_week_start = week_start - timedelta(days=7)
    prev_month_start = (month_start - timedelta(days=1)).replace(day=1)

    alive_users = _alive_users_queryset(request)
    registered_count = alive_users.count()
    new_users_week = alive_users.filter(date_joined__gte=week_start).count()
    new_users_month = alive_users.filter(date_joined__gte=month_start).count()
    prev_week_users = alive_users.filter(
        date_joined__gte=prev_week_start,
        date_joined__lt=week_start,
    ).count()
    prev_month_users = alive_users.filter(
        date_joined__gte=prev_month_start,
        date_joined__lt=month_start,
    ).count()

    site_visits_total = SiteVisit.objects.count()
    site_visits_week = SiteVisit.objects.filter(visited_at__gte=week_start).count()
    prev_week_visits = SiteVisit.objects.filter(
        visited_at__gte=prev_week_start,
        visited_at__lt=week_start,
    ).count()

    return [
        {
            "title": "Site visits",
            "value": str(site_visits_total),
            "change": f"{site_visits_week} this week",
            "trend": _metric_trend(site_visits_week, prev_week_visits),
            "iconKey": "visits",
        },
        {
            "title": "New users this week",
            "value": str(new_users_week),
            "change": f"{prev_week_users} prior week",
            "trend": _metric_trend(new_users_week, prev_week_users),
            "iconKey": "users_week",
        },
        {
            "title": "New users this month",
            "value": str(new_users_month),
            "change": f"{prev_month_users} prior month",
            "trend": _metric_trend(new_users_month, prev_month_users),
            "iconKey": "users_month",
        },
        {
            "title": "Registered users",
            "value": str(registered_count),
            "change": "active accounts",
            "trend": "neutral",
            "iconKey": "users",
        },
    ]


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def overview(request):
    base = _landing_base_qs()

    recent = []
    for lp in base.order_by("-updated_at")[:5]:
        recent.append(
            {
                "kind": "landing_page",
                "label": f"Page “{lp.title}” updated",
                "detail": lp.slug,
                "relativeTime": _relative_time(lp.updated_at),
            }
        )

    stats = [
        {
            "title": m["title"],
            "value": m["value"],
            "description": m["change"],
            "trend": m["trend"],
            "iconKey": m["iconKey"],
        }
        for m in _site_summary_metrics(request)
    ]

    return Response({"stats": stats, "activities": recent})


@api_view(["POST"])
@permission_classes([AllowAny])
def record_site_visit(request):
    path = _trackable_visit_path(request.data.get("path"))
    if path is None:
        return Response({"detail": "Invalid path"}, status=status.HTTP_400_BAD_REQUEST)
    SiteVisit.objects.create(path=path[:512])
    return Response({"ok": True}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def analytics(request):
    base = _landing_base_qs()
    metrics = [
        {
            "title": m["title"],
            "value": m["value"],
            "change": m["change"],
            "trend": m["trend"],
            "iconKey": m["iconKey"],
        }
        for m in _site_summary_metrics(request)
    ]

    total_lp = base.count() or 1
    active_ct = base.filter(is_active=True).count()
    draft_ct = base.filter(is_active=False).count()
    top_sources = [
        {
            "name": "Published pages",
            "value": min(100, int(round(100 * active_ct / total_lp))),
            "count": str(active_ct),
        },
        {
            "name": "Draft pages",
            "value": min(100, int(round(100 * draft_ct / total_lp))),
            "count": str(draft_ct),
        },
        {
            "name": "Sponsors",
            "value": min(
                100,
                int(
                    round(
                        100
                        * Sponsor.objects.filter(
                            is_active=True,
                            deleted_at__isnull=True,
                        ).count()
                        / max(
                            Sponsor.objects.filter(deleted_at__isnull=True).count(),
                            1,
                        )
                    )
                ),
            ),
            "count": str(
                Sponsor.objects.filter(
                    is_active=True,
                    deleted_at__isnull=True,
                ).count()
            ),
        },
    ]

    top_pages = []
    for lp in base.filter(is_active=True).order_by("sort_order", "-updated_at")[:8]:
        top_pages.append(
            {
                "id": lp.id,
                "slug": lp.slug,
                "title": lp.title,
                "page": f"/{lp.slug}",
                "views": "—",
                "bounce": "—",
                "time": _relative_time(lp.updated_at),
            }
        )

    return Response(
        {
            "metrics": metrics,
            "topSources": top_sources,
            "topPages": top_pages,
            "chartNote": "Site visits are recorded from public pages on the Next.js site.",
        }
    )


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def users_collection(request):
    if request.method == "GET":
        try:
            limit = int(request.query_params.get("limit", "500"))
        except (TypeError, ValueError):
            limit = 500
        limit = max(1, min(limit, 5000))
        if _truthy_query_param(request.query_params.get("trash")):
            qs = _trashed_users_queryset(request)
        else:
            qs = _alive_users_queryset(request)
        rows = [_user_row(u) for u in qs[:limit]]
        return Response({"users": rows})
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    name = (request.data.get("name") or "").strip()
    wants_super = bool(request.data.get("is_superuser"))
    if request.user.is_authenticated and is_dashboard_manager(request.user):
        if wants_super:
            return Response(
                {
                    "detail": "That type of account is created through the development team.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        is_staff = bool(request.data.get("is_staff"))
    elif request.user.is_authenticated and not request.user.is_superuser and wants_super:
        return Response(
            {"detail": "That type of account is created through the development team."},
            status=status.HTTP_403_FORBIDDEN,
        )
    else:
        is_staff = bool(request.data.get("is_staff", wants_super)) or wants_super
    if not email or not password:
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"detail": "An account with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    username_base = email.replace("@", "_").replace(".", "_")[:140]
    username = username_base
    n = 0
    while User.objects.filter(username=username).exists():
        n += 1
        username = f"{username_base[:130]}_{n}"
    first_name = ""
    last_name = ""
    if name:
        parts = name.split(None, 1)
        first_name = parts[0][:150]
        last_name = (parts[1] if len(parts) > 1 else "")[:150]
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        is_staff=bool(is_staff or wants_super),
        is_active=True,
    )
    if wants_super:
        user.is_superuser = True
        user.is_staff = True
        user.save(update_fields=["is_superuser", "is_staff"])
    return Response(_user_row(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def users_bulk(request):
    """
    Bulk user trash operations.
    action: soft_delete | restore | permanent_delete
    ids: list of user primary keys
    """
    action = (request.data.get("action") or "").strip().lower()
    raw_ids = request.data.get("ids")
    if action not in ("soft_delete", "restore", "permanent_delete"):
        return Response(
            {"detail": "action must be soft_delete, restore, or permanent_delete."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not isinstance(raw_ids, list) or not raw_ids:
        return Response(
            {"detail": "ids must be a non-empty list of user ids."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if action == "permanent_delete":
        denied = require_superuser(request)
        if denied is not None:
            return denied

    parsed_ids: list[int] = []
    for raw in raw_ids:
        try:
            parsed_ids.append(int(raw))
        except (TypeError, ValueError):
            return Response(
                {"detail": "Each id must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    unique_ids = list(dict.fromkeys(parsed_ids))

    ok: list[int] = []
    failed: list[dict] = []
    for pk in unique_ids:
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            failed.append({"id": pk, "detail": "User not found."})
            continue

        blocked = _user_mutation_blocked(request, target)
        if blocked is not None:
            failed.append({"id": pk, "detail": blocked.data.get("detail", "Forbidden.")})
            continue

        if action == "soft_delete":
            if _user_is_trashed(target):
                failed.append({"id": pk, "detail": "Already in trash."})
                continue
            _soft_delete_user(target)
            ok.append(pk)
        elif action == "restore":
            if not _user_is_trashed(target):
                failed.append({"id": pk, "detail": "User is not in trash."})
                continue
            _restore_user(target)
            ok.append(pk)
        elif action == "permanent_delete":
            if not _user_is_trashed(target):
                failed.append({"id": pk, "detail": "Soft-delete the user before permanent delete."})
                continue
            _permanent_delete_user(target)
            ok.append(pk)

    return Response({"ok": ok, "failed": failed})


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def projects_list(request):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    items = []
    base = _landing_base_qs().order_by("sort_order", "-updated_at")
    for lp in base[:50]:
        status = "Published" if lp.is_active else "Draft"
        items.append(
            {
                "id": lp.id,
                "name": lp.title,
                "description": (lp.meta_description or lp.content or "")[:200]
                or "—",
                "progress": 100 if lp.is_active else 40,
                "status": status,
                "team": [],
                "dueDate": lp.updated_at.strftime("%Y-%m-%d") if lp.updated_at else "",
                "priority": "High" if lp.is_active else "Medium",
                "slug": lp.slug,
            }
        )
    return Response({"projects": items})


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def sponsors_collection(request):
    """List (GET) or create (POST) sponsors for the Next.js dashboard."""
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    if request.method == "GET":
        qs = _alive_sponsors_queryset(request)
        return Response({"sponsors": SponsorSerializer(qs, many=True).data})
    serializer = SponsorSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def sponsor_detail(request, pk):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    sponsor = get_object_or_404(Sponsor, pk=pk)
    if request.method == "GET":
        return Response(SponsorSerializer(sponsor).data)
    if request.method == "PATCH":
        serializer = SponsorSerializer(sponsor, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    soft_delete(sponsor)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "PATCH"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def partners_page_settings(request):
    """Singleton partners / sponsors landing copy + banner (pk=1)."""
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    obj, _ = PartnersPageSettings.objects.get_or_create(
        pk=1,
        defaults={
            "banner_kicker": "SPONSORS",
            "hero_title": "Your Enhanced Life Sponsors",
        },
    )
    if request.method == "GET":
        return Response(PartnersPageSettingsSerializer(obj).data)
    serializer = PartnersPageSettingsSerializer(obj, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


def _touch_conversation(conv: DashboardConversation) -> None:
    DashboardConversation.objects.filter(pk=conv.pk).update(updated_at=timezone.now())


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def messages_inbox(request):
    """List conversations (GET) or start one with an initial message (POST)."""
    if request.method == "GET":
        qs = (
            DashboardConversation.objects.filter(deleted_at__isnull=True)
            .order_by("-updated_at")[:100]
        )
        conversations = []
        for c in qs:
            alive = c.messages.filter(deleted_at__isnull=True)
            last = alive.order_by("-created_at").first()
            preview = ""
            if last:
                preview = (
                    last.body if len(last.body) <= 160 else last.body[:157] + "..."
                )
            conversations.append(
                {
                    "id": c.id,
                    "subject": c.subject,
                    "updated_at": c.updated_at.isoformat(),
                    "preview": preview,
                    "message_count": alive.count(),
                }
            )
        return Response({"conversations": conversations, "notice": None})

    subject = (request.data.get("subject") or "").strip() or "New conversation"
    body = (request.data.get("body") or "").strip()
    author = (request.data.get("author_label") or "You").strip()[:120] or "You"
    if not body:
        return Response(
            {"detail": "body is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    c = DashboardConversation.objects.create(subject=subject)
    author_user = None
    if request.user.is_authenticated:
        author_user = request.user
        author = (request.user.get_full_name() or request.user.username or author)[
            :120
        ]
    DashboardMessage.objects.create(
        conversation=c,
        body=body,
        author_label=author,
        author_user=author_user,
    )
    return Response(
        {"id": c.id, "subject": c.subject},
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "POST", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def conversation_detail(request, pk):
    """Messages in a thread (GET), append a reply (POST), or soft-delete thread (DELETE)."""
    conv = get_object_or_404(
        DashboardConversation,
        pk=pk,
        deleted_at__isnull=True,
    )
    if request.method == "GET":
        msgs = conv.messages.filter(deleted_at__isnull=True).order_by("created_at")
        return Response(
            {
                "conversation": {"id": conv.id, "subject": conv.subject},
                "messages": DashboardMessageSerializer(msgs, many=True).data,
            }
        )

    if request.method == "DELETE":
        soft_delete(conv)
        return Response(status=status.HTTP_204_NO_CONTENT)

    body = (request.data.get("body") or "").strip()
    author = (request.data.get("author_label") or "You").strip()[:120] or "You"
    if not body:
        return Response(
            {"detail": "body is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    author_user = None
    if request.user.is_authenticated:
        author_user = request.user
        author = (request.user.get_full_name() or request.user.username or author)[
            :120
        ]
    DashboardMessage.objects.create(
        conversation=conv,
        body=body,
        author_label=author,
        author_user=author_user,
    )
    _touch_conversation(conv)
    msgs = conv.messages.filter(deleted_at__isnull=True).order_by("created_at")
    return Response(
        {
            "conversation": {"id": conv.id, "subject": conv.subject},
            "messages": DashboardMessageSerializer(msgs, many=True).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE", "PATCH"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def conversation_message_detail(request, pk, msg_id):
    """Soft-delete (DELETE) or restore (PATCH deleted_at=null) a single message."""
    conv = get_object_or_404(
        DashboardConversation,
        pk=pk,
        deleted_at__isnull=True,
    )
    msg = get_object_or_404(
        DashboardMessage,
        pk=msg_id,
        conversation=conv,
    )
    if request.method == "DELETE":
        if msg.deleted_at is not None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        soft_delete(msg)
        _touch_conversation(conv)
        return Response(status=status.HTTP_204_NO_CONTENT)
    serializer = DashboardMessageSerializer(msg, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    _touch_conversation(conv)
    return Response(serializer.data)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def notifications_collection(request):
    if request.method == "GET":
        base = _notification_queryset(request).order_by("-created_at")
        qs = base[:100]
        unread = base.filter(is_read=False).count()
        return Response(
            {
                "notifications": DashboardNotificationSerializer(qs, many=True).data,
                "unread_count": unread,
            }
        )
    title = (request.data.get("title") or "").strip()
    if not title:
        return Response(
            {"detail": "title is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    body = (request.data.get("body") or "").strip()
    category = (request.data.get("category") or "info").strip()[:32] or "info"
    link_url = (request.data.get("link_url") or "").strip()[:512]
    recipient = None
    rid = request.data.get("recipient_id")
    if rid is not None and str(rid).strip() != "":
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Only staff can target a recipient."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        recipient = get_object_or_404(User, pk=int(rid))
    n = DashboardNotification.objects.create(
        title=title,
        body=body,
        category=category,
        link_url=link_url,
        recipient=recipient,
    )
    return Response(
        DashboardNotificationSerializer(n).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "PATCH", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def notification_detail(request, pk):
    if request.method == "GET":
        n = get_object_or_404(_notification_queryset(request), pk=pk)
        return Response(DashboardNotificationSerializer(n).data)
    if request.method == "DELETE":
        n = get_object_or_404(_notification_queryset(request), pk=pk)
        soft_delete(n)
        return Response(status=status.HTTP_204_NO_CONTENT)
    n = get_object_or_404(DashboardNotification, pk=pk)
    if not _notification_visible(request, n):
        return Response(status=status.HTTP_404_NOT_FOUND)
    if n.deleted_at is not None:
        restoring = "deleted_at" in request.data and request.data.get("deleted_at") is None
        if not restoring:
            return Response(
                {
                    "detail": "Archived notification; send deleted_at: null to restore, or leave it archived.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
    serializer = DashboardNotificationSerializer(n, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET", "PATCH", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def user_detail(request, pk):
    target = get_object_or_404(User, pk=pk)
    if request.user.is_authenticated and request_is_manager(request) and target.is_superuser:
        if request.method == "GET":
            return Response(
                {"detail": MANAGER_READ_ONLY_USER_DETAIL},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            {"detail": MANAGER_READ_ONLY_USER_DETAIL},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        return Response(_user_admin_detail(target))
    if request.method == "DELETE":
        blocked = _user_mutation_blocked(request, target)
        if blocked is not None:
            return blocked
        if _user_is_trashed(target):
            return Response(
                {"detail": "User is already in trash. Restore or permanently delete from the trash page."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        _soft_delete_user(target)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PATCH
    data = request.data
    if request.user.is_authenticated and is_dashboard_manager(request.user):
        if "is_superuser" in data:
            return Response(
                {
                    "detail": "That change needs to be done through the development team.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )
    update_fields = []

    password = data.get("password")
    password_confirmation = data.get("password_confirmation")
    if password is not None or password_confirmation is not None:
        if password != password_confirmation:
            return Response(
                {"detail": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not password:
            return Response(
                {"detail": "Password cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            validate_password(password, user=target)
        except ValidationError as e:
            return Response(
                {"detail": " ".join(e.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        target.set_password(password)
        update_fields.append("password")
        Token.objects.filter(user=target).delete()

    if "is_active" in data:
        target.is_active = bool(data.get("is_active"))
        update_fields.append("is_active")
    if "is_staff" in data:
        target.is_staff = bool(data.get("is_staff"))
        update_fields.append("is_staff")
    if "is_superuser" in data:
        if request.user.is_authenticated and not request.user.is_superuser:
            return Response(
                {"detail": "That change is handled through the development team."},
                status=status.HTTP_403_FORBIDDEN,
            )
        target.is_superuser = bool(data.get("is_superuser"))
        update_fields.append("is_superuser")

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    if first_name is not None:
        target.first_name = str(first_name).strip()[:150]
        update_fields.append("first_name")
    if last_name is not None:
        target.last_name = str(last_name).strip()[:150]
        update_fields.append("last_name")

    if update_fields:
        target.save(update_fields=list(dict.fromkeys(update_fields)))

    return Response(_user_admin_detail(target))


@api_view(["GET", "PATCH"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def notification_preferences(request):
    if not request.user.is_authenticated:
        return Response(
            {
                "detail": "Sign in through the dashboard to load notification preferences.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    pref, _ = DashboardNotificationPreference.objects.get_or_create(user=request.user)
    if request.method == "GET":
        return Response(NotificationPreferenceSerializer(pref).data)
    ser = NotificationPreferenceSerializer(pref, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(ser.data)


def _landing_dashboard_qs(request):
    qs = LandingPage.objects.all().order_by("sort_order", "-updated_at")
    if _truthy_query_param(request.query_params.get("include_deleted")):
        return qs
    return qs.filter(deleted_at__isnull=True)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def landing_pages_collection(request):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    if request.method == "GET":
        qs = _landing_dashboard_qs(request)
        if _truthy_query_param(request.query_params.get("faq")):
            qs = qs.filter(is_faq=True)
        return Response(
            {"pages": LandingPageDashboardSerializer(qs, many=True).data}
        )
    serializer = LandingPageDashboardSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def landing_page_detail(request, pk):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    page = get_object_or_404(LandingPage, pk=pk)
    if request.method == "GET":
        return Response(LandingPageDashboardSerializer(page).data)
    if request.method == "PATCH":
        serializer = LandingPageDashboardSerializer(
            page, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    soft_delete(page)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def calendar_placeholder(request):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    return Response(
        {
            "events": [],
            "notice": "No calendar integration. Content deadlines can be tracked via page updated dates.",
        }
    )
