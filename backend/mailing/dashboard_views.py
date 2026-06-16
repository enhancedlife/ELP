import smtplib

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from common.soft_delete import soft_delete
from dashboard.permissions import DashboardAccess
from dashboard.role_utils import is_dashboard_manager

from .layout_config import DEFAULT_EMAIL_LAYOUT_CONFIG, build_template_from_config
from .email_layout import compose_broadcast_html
from .email_logging import record_outbound_email
from .email_list import normalize_email_list
from .broadcast_engine import (
    CHUNK_SIZE,
    pause_broadcast,
    prepare_broadcast_recipients,
    process_broadcast_chunk,
    resume_broadcast,
    stop_broadcast,
)
from .models import EmailBroadcast, NewsletterSubscriber, OutboundEmailLog, SystemEmailLayout
from .serializers import (
    EmailBroadcastRecipientSerializer,
    EmailBroadcastSerializer,
    NewsletterSubscriberSerializer,
    OutboundEmailLogSerializer,
    SystemEmailLayoutSerializer,
)
from .smtp_helpers import smtp_failure_user_message
from .smtp_config import delivery_status_payload, outbound_smtp_block_reason
from .smtp_profiles import prepare_outbound_message, resolve_from_email


def _parse_audience_payload(
    request,
) -> tuple[str | None, list[int] | None, list[str] | None, Response | None]:
    """Returns (audience, user_ids, manual_emails, error). None values = use broadcast saved fields."""
    from django.core.exceptions import ValidationError as DjangoValidationError

    audience_raw = request.data.get("audience")
    audience = str(audience_raw).strip().lower() if audience_raw is not None else None

    user_ids: list[int] | None = None
    if "user_ids" in request.data:
        raw_ids = request.data.get("user_ids")
        user_ids = []
        if raw_ids is not None:
            if not isinstance(raw_ids, list):
                return None, None, None, Response(
                    {"detail": "user_ids must be a list of integers."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            for x in raw_ids:
                try:
                    user_ids.append(int(x))
                except (TypeError, ValueError):
                    return None, None, None, Response(
                        {"detail": "user_ids must be integers."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

    manual_emails: list[str] | None = None
    if "audience_emails" in request.data:
        raw_emails = request.data.get("audience_emails")
        try:
            manual_emails = normalize_email_list(raw_emails)
        except DjangoValidationError as e:
            return None, None, None, Response(
                {"detail": f"Invalid email in audience_emails: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if audience is not None and audience not in (
        "newsletter",
        "all_site_users",
        "selected_site_users",
        "manual_emails",
    ):
        return None, None, None, Response(
            {
                "detail": "audience must be newsletter, all_site_users, selected_site_users, or manual_emails."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return audience, user_ids, manual_emails, None


def _validate_recipient_selection(
    audience: str,
    user_ids: list[int],
    manual_emails: list[str],
) -> Response | None:
    if audience == "manual_emails" and not manual_emails:
        return Response(
            {"detail": "At least one email is required for manual_emails audience."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if audience == "selected_site_users" and not user_ids and not manual_emails:
        return Response(
            {
                "detail": "Select at least one user or add manual email addresses."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None


def _broadcast_response(broadcast: EmailBroadcast, *, http_status=status.HTTP_200_OK):
    broadcast.refresh_from_db()
    data = EmailBroadcastSerializer(broadcast).data
    if broadcast.status == EmailBroadcast.Status.FAILED and (
        broadcast.recipient_count > 0 and broadcast.sent_ok_count == 0
    ):
        summary = (broadcast.error_summary or "").strip() or "All recipients failed (check SMTP and logs)."
        return Response(
            {"detail": summary[:4000], "broadcast": data},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    out = dict(data)
    if broadcast.sent_fail_count > 0 and broadcast.error_summary:
        out["send_warning"] = (broadcast.error_summary or "")[:4000]
    smtp_block = outbound_smtp_block_reason()
    if smtp_block:
        out["delivery_warning"] = smtp_block
    return Response(out, status=http_status)


def _require_outbound_smtp() -> Response | None:
    reason = outbound_smtp_block_reason()
    if reason:
        return Response({"detail": reason}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return None


def _truthy_query_param(raw) -> bool:
    if raw is None:
        return False
    return str(raw).strip().lower() in ("1", "true", "yes", "on")


def _system_email_layout_row():
    row = SystemEmailLayout.objects.order_by("pk").first()
    if row:
        return row
    return SystemEmailLayout.objects.create(
        template_html=build_template_from_config(DEFAULT_EMAIL_LAYOUT_CONFIG),
        layout_config=DEFAULT_EMAIL_LAYOUT_CONFIG,
    )


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def email_delivery_status(request):
    """Whether real SMTP is configured (Docker root .env vs console backend)."""
    return Response(delivery_status_payload())


@api_view(["GET", "PATCH"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def system_email_layout(request):
    row = _system_email_layout_row()
    if request.method == "GET":
        return Response(SystemEmailLayoutSerializer(row).data)
    if request.user.is_authenticated and is_dashboard_manager(request.user):
        return Response(
            {
                "detail": "Layout changes for this page go through the development team.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    ser = SystemEmailLayoutSerializer(row, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(ser.data)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def system_email_layout_test_send(request):
    if request.user.is_authenticated and is_dashboard_manager(request.user):
        return Response(
            {
                "detail": "This test is set up on request through the development team.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    smtp_err = _require_outbound_smtp()
    if smtp_err is not None:
        return smtp_err
    to = (request.data.get("to") or request.data.get("email") or "").strip()
    if not to:
        return Response(
            {"detail": "Recipient address `to` is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    subject = (request.data.get("subject") or "Test — Your Enhanced Life").strip()
    headline = (request.data.get("headline") or "Test headline").strip()
    body_html = (
        request.data.get("body_html")
        or "<p>This is a test message from the email template page.</p>"
    ).strip()
    body_text = (request.data.get("body_text") or "").strip()
    if not body_text:
        body_text = "This is a test message from the email template page."

    full_html = compose_broadcast_html(
        headline=headline,
        subject=subject,
        body_html=body_html,
    )
    from_email = resolve_from_email(getattr(settings, "DEFAULT_FROM_EMAIL", None))
    try:
        msg = EmailMultiAlternatives(subject, body_text, from_email, [to])
        if full_html:
            msg.attach_alternative(full_html, "text/html")
        prepare_outbound_message(msg)
        msg.send(fail_silently=False)
    except Exception as e:  # noqa: BLE001
        raw = str(e)[:3500]
        if isinstance(e, smtplib.SMTPException):
            hint = smtp_failure_user_message(e)
            detail = f"{hint}\n\nTechnical: {raw}"[:4000]
        else:
            detail = raw[:4000]
        record_outbound_email(
            source=OutboundEmailLog.Source.TEMPLATE_TEST,
            to_email=to,
            subject=subject,
            success=False,
            error_message=detail,
            error_type=type(e).__name__,
        )
        return Response(
            {"detail": detail, "error_type": type(e).__name__},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    record_outbound_email(
        source=OutboundEmailLog.Source.TEMPLATE_TEST,
        to_email=to,
        subject=subject,
        success=True,
    )
    return Response({"ok": True, "to": to})


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def email_send_logs_collection(request):
    qs = OutboundEmailLog.objects.all().order_by("-created_at")
    src = (request.query_params.get("source") or "").strip()
    if src:
        qs = qs.filter(source=src)
    succ = (request.query_params.get("success") or "").strip().lower()
    if succ in ("0", "false", "no"):
        qs = qs.filter(success=False)
    elif succ in ("1", "true", "yes"):
        qs = qs.filter(success=True)
    total = qs.count()
    try:
        limit = min(max(int(request.query_params.get("limit", 100)), 1), 500)
        offset = max(int(request.query_params.get("offset", 0)), 0)
    except ValueError:
        return Response(
            {"detail": "Invalid limit or offset."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    rows = qs[offset : offset + limit]
    return Response(
        {
            "total": total,
            "limit": limit,
            "offset": offset,
            "logs": OutboundEmailLogSerializer(rows, many=True).data,
        }
    )


def _subscriber_qs(request):
    qs = NewsletterSubscriber.objects.all().order_by("-created_at")
    if _truthy_query_param(request.query_params.get("include_deleted")):
        return qs
    return qs.filter(deleted_at__isnull=True)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def newsletter_subscribers_collection(request):
    if request.method == "GET":
        qs = _subscriber_qs(request)
        return Response(
            {"subscribers": NewsletterSubscriberSerializer(qs[:500], many=True).data}
        )
    serializer = NewsletterSubscriberSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def newsletter_subscriber_detail(request, pk):
    sub = get_object_or_404(NewsletterSubscriber, pk=pk)
    if request.method == "GET":
        return Response(NewsletterSubscriberSerializer(sub).data)
    if request.method == "PATCH":
        ser = NewsletterSubscriberSerializer(sub, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)
    soft_delete(sub)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def email_broadcasts_collection(request):
    if request.method == "GET":
        qs = EmailBroadcast.objects.order_by("-created_at")[:100]
        return Response({"broadcasts": EmailBroadcastSerializer(qs, many=True).data})
    serializer = EmailBroadcastSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def email_broadcast_detail(request, pk):
    broadcast = get_object_or_404(EmailBroadcast, pk=pk)
    if request.method == "GET":
        return Response(EmailBroadcastSerializer(broadcast).data)
    if broadcast.status != EmailBroadcast.Status.DRAFT:
        return Response(
            {"detail": "Only draft broadcasts can be edited."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    ser = EmailBroadcastSerializer(broadcast, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(ser.data)


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def email_broadcast_recipients(request, pk):
    broadcast = get_object_or_404(EmailBroadcast, pk=pk)
    qs = broadcast.recipients.all().order_by("id")
    status_filter = (request.query_params.get("status") or "").strip().lower()
    if status_filter:
        qs = qs.filter(status=status_filter)
    total = qs.count()
    try:
        limit = min(max(int(request.query_params.get("limit", 100)), 1), 500)
        offset = max(int(request.query_params.get("offset", 0)), 0)
    except ValueError:
        return Response(
            {"detail": "Invalid limit or offset."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    rows = qs[offset : offset + limit]
    return Response(
        {
            "total": total,
            "limit": limit,
            "offset": offset,
            "recipients": EmailBroadcastRecipientSerializer(rows, many=True).data,
        }
    )


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def email_broadcast_send(request, pk):
    broadcast = get_object_or_404(EmailBroadcast, pk=pk)
    smtp_err = _require_outbound_smtp()
    if smtp_err is not None:
        return smtp_err
    audience, user_ids, manual_emails, err = _parse_audience_payload(request)

    if broadcast.status == EmailBroadcast.Status.DRAFT:
        use_audience = audience or broadcast.audience or "newsletter"
        use_ids = user_ids if user_ids is not None else list(broadcast.audience_user_ids or [])
        use_emails = (
            manual_emails if manual_emails is not None else list(broadcast.audience_emails or [])
        )
        if err:
            return err
        selection_err = _validate_recipient_selection(use_audience, use_ids, use_emails)
        if selection_err:
            return selection_err
        prepare_broadcast_recipients(
            broadcast,
            audience=use_audience,
            user_ids=use_ids,
            manual_emails=use_emails,
        )
        if broadcast.status == EmailBroadcast.Status.FAILED:
            return _broadcast_response(broadcast)
    elif broadcast.status in (
        EmailBroadcast.Status.PAUSED,
        EmailBroadcast.Status.STOPPED,
    ):
        resume_broadcast(broadcast)
    elif broadcast.status == EmailBroadcast.Status.SENDING:
        pass
    else:
        return Response(
            {"detail": "This broadcast cannot be sent or resumed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if broadcast.status == EmailBroadcast.Status.SENDING:
        process_broadcast_chunk(broadcast, limit=CHUNK_SIZE)

    return _broadcast_response(broadcast)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def email_broadcast_process(request, pk):
    broadcast = get_object_or_404(EmailBroadcast, pk=pk)
    if broadcast.status != EmailBroadcast.Status.SENDING:
        return Response(
            {"detail": "Only active sending batches can be processed."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    process_broadcast_chunk(broadcast, limit=CHUNK_SIZE)
    return _broadcast_response(broadcast)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def email_broadcast_pause(request, pk):
    broadcast = get_object_or_404(EmailBroadcast, pk=pk)
    pause_broadcast(broadcast)
    return Response(EmailBroadcastSerializer(broadcast).data)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def email_broadcast_resume(request, pk):
    broadcast = get_object_or_404(EmailBroadcast, pk=pk)
    if broadcast.status not in (
        EmailBroadcast.Status.PAUSED,
        EmailBroadcast.Status.STOPPED,
    ):
        return Response(
            {"detail": "Only paused or stopped batches can be resumed."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    resume_broadcast(broadcast)
    process_broadcast_chunk(broadcast, limit=CHUNK_SIZE)
    return _broadcast_response(broadcast)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([DashboardAccess])
def email_broadcast_stop(request, pk):
    broadcast = get_object_or_404(EmailBroadcast, pk=pk)
    stop_broadcast(broadcast)
    return Response(EmailBroadcastSerializer(broadcast).data)
