import logging
import smtplib

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from sponsors.models import Sponsor

from mailing.email_logging import record_outbound_email
from mailing.models import OutboundEmailLog
from mailing.smtp_config import env_smtp_block_reason
from mailing.smtp_helpers import smtp_failure_user_message
from mailing.smtp_profiles import resolve_from_email, send_outbound_mail
from mailing.transactional_email import build_contact_form_bodies

logger = logging.getLogger(__name__)

ISSUE_LABELS = {
    "order_issue": "Order issue",
    "account": "Account/sign-in issue",
    "website_technical": "Website or technical issue",
    "partnership": "Sponsorship/business inquiry",
    "other": "Other",
}

ISSUES_NEED_SPONSOR = frozenset({"order_issue", "account", "website_technical"})
ISSUES_NEED_RELATED_USERNAME = frozenset({"order_issue", "account"})

PRESET_SPONSOR_LABELS = {
    "aquila_anabolics": "Aquila Anabolics",
    "hvy_research": "Hvy Research",
    "other": "Other",
}


def _contact_recipient() -> str:
    return (getattr(settings, "CONTACT_FORM_TO", None) or "").strip() or getattr(
        settings, "SERVER_EMAIL", settings.DEFAULT_FROM_EMAIL
    )


def _sponsor_line_from_selection(sponsor_selection) -> str:
    """Human-readable sponsor line for the email body; empty if nothing selected."""
    raw = (sponsor_selection if sponsor_selection is not None else "").strip()
    if not raw:
        return ""
    if raw in PRESET_SPONSOR_LABELS:
        label = PRESET_SPONSOR_LABELS[raw]
        if raw == "other":
            return f"Sponsor: {label} — details may appear in the message below."
        return f"Sponsor: {label}"
    if raw == "unsure":
        return "Sponsor: Not sure / not listed yet"
    if raw.isdigit():
        sid = int(raw)
        sp = Sponsor.objects.filter(
            id=sid, is_active=True, deleted_at__isnull=True
        ).first()
        if sp:
            return f"Sponsor: {sp.name} (id {sid})"
        return f"Sponsor: id {sid} (no longer listed — verify in dashboard)"
    return f"Sponsor: (unrecognized selection: {raw})"


@api_view(["POST"])
@permission_classes([AllowAny])
def contact_submit(request):
    """
    Public contact form: sends a structured email to CONTACT_FORM_TO (or SERVER_EMAIL).
    """
    name = (request.data.get("name") or "").strip()[:200]
    email = (request.data.get("email") or "").strip().lower()[:254]
    issue_type = (request.data.get("issue_type") or "").strip()
    sponsor_selection = request.data.get("sponsor_selection")
    related_username = (request.data.get("related_username") or "").strip()[:200]
    message = (request.data.get("message") or "").strip()

    if not email or not message:
        return Response(
            {"detail": "Email and message are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not name:
        return Response(
            {"detail": "Name is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        validate_email(email)
    except ValidationError:
        return Response(
            {"detail": "Invalid email address."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if issue_type not in ISSUE_LABELS:
        return Response(
            {"detail": "Invalid issue type."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(message) > 8000:
        return Response(
            {"detail": "Message is too long (8000 characters max)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if issue_type in ISSUES_NEED_SPONSOR:
        sel = (sponsor_selection if sponsor_selection is not None else "").strip()
        if not sel:
            return Response(
                {"detail": "Please select which sponsor."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    if issue_type in ISSUES_NEED_RELATED_USERNAME and not related_username:
        return Response(
            {"detail": "Please enter the username tied to this issue."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    issue_label = ISSUE_LABELS[issue_type]
    sponsor_block = _sponsor_line_from_selection(sponsor_selection)
    body, html_body = build_contact_form_bodies(
        issue_label=issue_label,
        name=name,
        email=email,
        message=message,
        sponsor_line=sponsor_block,
        related_username=related_username,
    )

    subject = f"[YEL Contact] {issue_label} — {name}"

    to_addr = _contact_recipient()
    smtp_block = env_smtp_block_reason()
    if smtp_block:
        return Response(
            {"detail": smtp_block},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    try:
        send_outbound_mail(
            subject[:989],
            body,
            resolve_from_email(settings.DEFAULT_FROM_EMAIL, smtp_source="env"),
            [to_addr],
            html_message=html_body,
            smtp_source="env",
            reply_to=[email],
            fail_silently=False,
        )
    except (OSError, smtplib.SMTPException) as e:
        logger.exception("contact form EmailMessage.send failed")
        record_outbound_email(
            source=OutboundEmailLog.Source.CONTACT_FORM,
            to_email=to_addr,
            subject=subject[:989],
            success=False,
            error_message=smtp_failure_user_message(e),
            error_type=type(e).__name__,
            meta={"visitor_email": email},
        )
        return Response(
            {"detail": smtp_failure_user_message(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if getattr(settings, "EMAIL_BACKEND", "") == "django.core.mail.backends.console.EmailBackend":
        record_outbound_email(
            source=OutboundEmailLog.Source.CONTACT_FORM,
            to_email=to_addr,
            subject=subject[:989],
            success=True,
            meta={"visitor_email": email, "delivery": "console"},
        )
        return Response(
            {
                "detail": (
                    "Mail is not configured (EMAIL_HOST is unset). Your message was not emailed — "
                    "it may appear only in server logs. Configure SMTP in backend/.env or the environment."
                ),
                "ok": True,
                "email_delivery": "console",
            },
            status=status.HTTP_200_OK,
        )

    record_outbound_email(
        source=OutboundEmailLog.Source.CONTACT_FORM,
        to_email=to_addr,
        subject=subject[:989],
        success=True,
        meta={"visitor_email": email},
    )
    return Response({"detail": "Thanks — your message was sent.", "ok": True})
