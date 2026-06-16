import smtplib

from django.conf import settings
from django.core.mail import EmailMessage
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from dashboard.permissions import DashboardAccess
from dashboard.role_utils import is_dashboard_manager
from dashboard.views import require_full_admin

from .email_logging import record_outbound_email
from .models import OutboundEmailLog, SmtpProfile
from .smtp_helpers import smtp_failure_user_message
from .smtp_profile_serializers import SmtpProfileSerializer
from .smtp_profiles import (
    activate_smtp_profile,
    get_outbound_connection,
    resolve_from_email,
    set_smtp_profile_enabled,
)


def _serialize_profile(profile: SmtpProfile, request):
    return SmtpProfileSerializer(profile, context={"request": request}).data


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def smtp_profiles_collection(request):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    if request.method == "GET":
        qs = SmtpProfile.objects.all().order_by("-is_active", "name")
        return Response(
            {
                "profiles": SmtpProfileSerializer(
                    qs, many=True, context={"request": request}
                ).data
            }
        )

    serializer = SmtpProfileSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    profile = serializer.save()
    return Response(_serialize_profile(profile, request), status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def smtp_profile_detail(request, pk: int):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    profile = get_object_or_404(SmtpProfile, pk=pk)
    if request.method == "GET":
        return Response(_serialize_profile(profile, request))
    if request.method == "PATCH":
        serializer = SmtpProfileSerializer(
            profile, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        if "is_enabled" in request.data:
            enabled = bool(request.data.get("is_enabled"))
            profile = set_smtp_profile_enabled(profile, enabled)
        return Response(_serialize_profile(profile, request))
    profile.delete()
    if not SmtpProfile.objects.filter(is_active=True, is_enabled=True).exists():
        next_profile = (
            SmtpProfile.objects.filter(is_enabled=True).order_by("-updated_at").first()
        )
        if next_profile:
            activate_smtp_profile(next_profile)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def smtp_profile_activate(request, pk: int):
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    profile = get_object_or_404(SmtpProfile, pk=pk)
    if not profile.is_enabled:
        return Response(
            {"detail": "Enable this SMTP profile before activating it."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    profile = activate_smtp_profile(profile)
    return Response(_serialize_profile(profile, request))


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def smtp_profile_test_send(request, pk: int):
    if request.user.is_authenticated and is_dashboard_manager(request.user):
        return Response(
            {"detail": "SMTP test sends require a full administrator account."},
            status=status.HTTP_403_FORBIDDEN,
        )
    denied = require_full_admin(request)
    if denied is not None:
        return denied

    profile = get_object_or_404(SmtpProfile, pk=pk)
    to = (request.data.get("to") or request.data.get("email") or "").strip()
    if not to:
        return Response(
            {"detail": "Provide a `to` email address."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    subject = f"SMTP test — {profile.name}"
    body = (
        f"This is a test message from {profile.name}.\n\n"
        f"Host: {profile.host}\n"
        f"Port: {profile.port}\n"
        f"From: {profile.from_email}\n"
    )
    try:
        msg = EmailMessage(
            subject=subject,
            body=body,
            from_email=profile.from_email,
            to=[to],
        )
        msg.connection = get_connection_for_profile(profile)
        msg.send(fail_silently=False)
    except (OSError, smtplib.SMTPException) as e:
        record_outbound_email(
            source=OutboundEmailLog.Source.TEMPLATE_TEST,
            to_email=to,
            subject=subject,
            success=False,
            error_message=smtp_failure_user_message(e),
            error_type=type(e).__name__,
            meta={"smtp_profile_id": profile.id},
        )
        return Response(
            {"detail": smtp_failure_user_message(e)},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    record_outbound_email(
        source=OutboundEmailLog.Source.TEMPLATE_TEST,
        to_email=to,
        subject=subject,
        success=True,
        meta={"smtp_profile_id": profile.id},
    )
    return Response({"detail": f"Test email sent to {to}."})


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def smtp_profiles_import_env(request):
    """Create a profile from EMAIL_* environment variables."""
    denied = require_full_admin(request)
    if denied is not None:
        return denied
    host = (getattr(settings, "EMAIL_HOST", None) or "").strip()
    if not host:
        return Response(
            {"detail": "EMAIL_HOST is not set in the server environment."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    existing = SmtpProfile.objects.filter(host=host).first()
    if existing:
        return Response(_serialize_profile(existing, request))
    profile = SmtpProfile.objects.create(
        name="Environment SMTP",
        host=host,
        port=int(getattr(settings, "EMAIL_PORT", 587)),
        username=(getattr(settings, "EMAIL_HOST_USER", None) or "").strip(),
        password=(getattr(settings, "EMAIL_HOST_PASSWORD", None) or "").strip(),
        use_tls=bool(getattr(settings, "EMAIL_USE_TLS", True)),
        use_ssl=bool(getattr(settings, "EMAIL_USE_SSL", False)),
        from_email=(getattr(settings, "DEFAULT_FROM_EMAIL", None) or "").strip()
        or "noreply@example.com",
        is_enabled=True,
        is_active=not SmtpProfile.objects.filter(is_active=True, is_enabled=True).exists(),
    )
    if profile.is_active:
        activate_smtp_profile(profile)
    return Response(_serialize_profile(profile, request), status=status.HTTP_201_CREATED)
