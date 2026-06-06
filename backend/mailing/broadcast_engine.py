"""Chunked broadcast delivery with pause, stop, resume, and per-recipient tracking."""

from __future__ import annotations

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.utils import timezone

from .email_layout import compose_broadcast_html
from .email_logging import record_outbound_email
from .models import EmailBroadcast, EmailBroadcastRecipient, NewsletterSubscriber, OutboundEmailLog

User = get_user_model()

CHUNK_SIZE = 12


def _public_site_base() -> str:
    raw = (getattr(settings, "PUBLIC_SITE_BASE_URL", None) or "").strip().rstrip("/")
    return raw or "http://127.0.0.1:3000"


def _footer_newsletter_text(sub: NewsletterSubscriber) -> str:
    base = _public_site_base()
    url = f"{base}/unsubscribe?token={sub.unsubscribe_token}"
    return f"\n\n—\nUnsubscribe: {url}"


def _footer_newsletter_html(sub: NewsletterSubscriber) -> str:
    base = _public_site_base()
    url = f"{base}/unsubscribe?token={sub.unsubscribe_token}"
    return f'<p style="margin-top:24px;font-size:12px;color:#666;"><a href="{url}">Unsubscribe</a></p>'


def _footer_site_user_text() -> str:
    base = _public_site_base()
    return f"\n\n—\nThe Swole Republic · {base}"


def _footer_site_user_html() -> str:
    base = _public_site_base()
    return (
        f'<p style="margin-top:24px;font-size:12px;color:#666;">'
        f'<a href="{base}">The Swole Republic</a></p>'
    )


def _merge_html_footer(html: str, html_suffix: str) -> str:
    raw = (html or "").strip()
    suf = html_suffix or ""
    if not raw:
        return suf
    lower = raw.lower()
    close_body = lower.rfind("</body>")
    if close_body != -1:
        return raw[:close_body] + suf + raw[close_body:]
    close_html = lower.rfind("</html>")
    if close_html != -1:
        return raw[:close_html] + suf + raw[close_html:]
    return raw + suf


def _dispatch_one(
    broadcast: EmailBroadcast,
    to_email: str,
    *,
    text_suffix: str,
    html_suffix: str,
) -> tuple[bool, str]:
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None) or "noreply@example.com"
    body = broadcast.body_text + text_suffix
    inner_html = (broadcast.body_html or "").strip()
    html = ""
    if inner_html:
        html = compose_broadcast_html(
            headline=broadcast.headline,
            subject=broadcast.subject,
            body_html=inner_html,
        )
    try:
        msg = EmailMultiAlternatives(
            broadcast.subject,
            body,
            from_email,
            [to_email],
        )
        if html:
            msg.attach_alternative(_merge_html_footer(html, html_suffix), "text/html")
        msg.send(fail_silently=False)
        return True, ""
    except Exception as e:  # noqa: BLE001
        return False, str(e)[:500]


def _normalize_audience(raw: str | None) -> str:
    return (raw or "newsletter").strip().lower()


def _resolve_recipient_rows(
    broadcast: EmailBroadcast,
    *,
    audience: str,
    user_ids: list[int] | None,
    manual_emails: list[str] | None = None,
) -> list[tuple[str, dict]]:
    audience = _normalize_audience(audience)
    user_ids = user_ids or []
    manual_emails = manual_emails or []

    if audience == "manual_emails":
        return [(email, {"manual": True}) for email in manual_emails]

    rows: list[tuple[str, dict]] = []

    if audience == "newsletter":
        for sub in NewsletterSubscriber.objects.filter(
            is_subscribed=True,
            deleted_at__isnull=True,
        ).iterator(chunk_size=200):
            rows.append((sub.email.lower(), {"subscriber_id": sub.id}))
    elif audience == "all_site_users":
        for user in User.objects.filter(is_active=True).exclude(email="").iterator(chunk_size=200):
            email = (user.email or "").strip().lower()
            if email:
                rows.append((email, {"user_id": user.id}))
    elif audience == "selected_site_users":
        for user in User.objects.filter(id__in=user_ids, is_active=True).exclude(email=""):
            email = (user.email or "").strip().lower()
            if email:
                rows.append((email, {"user_id": user.id}))

    if manual_emails and audience != "manual_emails":
        existing = {email for email, _ in rows}
        for email in manual_emails:
            if email not in existing:
                rows.append((email, {"manual": True}))
                existing.add(email)

    return rows


def _refresh_broadcast_counts(broadcast: EmailBroadcast) -> None:
    qs = broadcast.recipients.all()
    broadcast.recipient_count = qs.count()
    broadcast.sent_ok_count = qs.filter(
        status=EmailBroadcastRecipient.Status.SENT
    ).count()
    broadcast.sent_fail_count = qs.filter(
        status=EmailBroadcastRecipient.Status.FAILED
    ).count()
    broadcast.pending_count = qs.filter(
        status=EmailBroadcastRecipient.Status.PENDING
    ).count()
    broadcast.skipped_count = qs.filter(
        status=EmailBroadcastRecipient.Status.SKIPPED
    ).count()


def prepare_broadcast_recipients(
    broadcast: EmailBroadcast,
    *,
    audience: str,
    user_ids: list[int] | None = None,
    manual_emails: list[str] | None = None,
) -> EmailBroadcast:
    audience = _normalize_audience(audience)
    user_ids = user_ids if user_ids is not None else list(broadcast.audience_user_ids or [])
    if manual_emails is None:
        manual_emails = list(broadcast.audience_emails or [])

    broadcast.audience = audience
    broadcast.audience_user_ids = user_ids
    broadcast.audience_emails = manual_emails
    broadcast.save(update_fields=["audience", "audience_user_ids", "audience_emails"])

    broadcast.recipients.all().delete()
    rows = _resolve_recipient_rows(
        broadcast,
        audience=audience,
        user_ids=user_ids,
        manual_emails=manual_emails,
    )
    if not rows:
        broadcast.status = EmailBroadcast.Status.FAILED
        broadcast.error_summary = "No recipients matched the selected audience."
        broadcast.save(update_fields=["status", "error_summary"])
        return broadcast

    EmailBroadcastRecipient.objects.bulk_create(
        [
            EmailBroadcastRecipient(
                broadcast=broadcast,
                email=email,
                status=EmailBroadcastRecipient.Status.PENDING,
                meta=meta,
            )
            for email, meta in rows
        ],
        batch_size=500,
    )
    _refresh_broadcast_counts(broadcast)
    broadcast.status = EmailBroadcast.Status.SENDING
    broadcast.started_at = timezone.now()
    broadcast.completed_at = None
    broadcast.sent_at = None
    broadcast.error_summary = ""
    broadcast.save(
        update_fields=[
            "recipient_count",
            "sent_ok_count",
            "sent_fail_count",
            "pending_count",
            "skipped_count",
            "status",
            "started_at",
            "completed_at",
            "sent_at",
            "error_summary",
        ]
    )
    return broadcast


def _finalize_if_complete(broadcast: EmailBroadcast) -> EmailBroadcast:
    _refresh_broadcast_counts(broadcast)
    if broadcast.pending_count > 0:
        broadcast.save(
            update_fields=[
                "recipient_count",
                "sent_ok_count",
                "sent_fail_count",
                "pending_count",
                "skipped_count",
            ]
        )
        return broadcast

    broadcast.completed_at = timezone.now()
    broadcast.sent_at = broadcast.completed_at
    if broadcast.sent_fail_count and broadcast.sent_ok_count == 0:
        broadcast.status = EmailBroadcast.Status.FAILED
    else:
        broadcast.status = EmailBroadcast.Status.SENT
    broadcast.save(
        update_fields=[
            "recipient_count",
            "sent_ok_count",
            "sent_fail_count",
            "pending_count",
            "skipped_count",
            "status",
            "completed_at",
            "sent_at",
        ]
    )
    return broadcast


def process_broadcast_chunk(
    broadcast: EmailBroadcast,
    *,
    limit: int = CHUNK_SIZE,
) -> EmailBroadcast:
    if broadcast.status not in (EmailBroadcast.Status.SENDING,):
        return broadcast

    audience = _normalize_audience(broadcast.audience)
    pending = list(
        broadcast.recipients.filter(status=EmailBroadcastRecipient.Status.PENDING).order_by(
            "id"
        )[:limit]
    )
    if not pending:
        return _finalize_if_complete(broadcast)

    errors: list[str] = []

    for row in pending:
        broadcast.refresh_from_db(fields=["status"])
        if broadcast.status == EmailBroadcast.Status.PAUSED:
            break
        if broadcast.status == EmailBroadcast.Status.STOPPED:
            break

        if audience == "newsletter":
            sub_id = (row.meta or {}).get("subscriber_id")
            sub = (
                NewsletterSubscriber.objects.filter(pk=sub_id).first()
                if sub_id
                else None
            )
            if sub:
                text_suffix = _footer_newsletter_text(sub)
                html_suffix = _footer_newsletter_html(sub)
            else:
                text_suffix = ""
                html_suffix = ""
        else:
            text_suffix = _footer_site_user_text()
            html_suffix = _footer_site_user_html()

        ok, err = _dispatch_one(
            broadcast,
            row.email,
            text_suffix=text_suffix,
            html_suffix=html_suffix,
        )
        now = timezone.now()
        if ok:
            row.status = EmailBroadcastRecipient.Status.SENT
            row.error_message = ""
            row.sent_at = now
            row.save(update_fields=["status", "error_message", "sent_at"])
            record_outbound_email(
                source=OutboundEmailLog.Source.BROADCAST,
                to_email=row.email,
                subject=broadcast.subject,
                success=True,
                broadcast=broadcast,
                meta={"audience": audience},
            )
        else:
            row.status = EmailBroadcastRecipient.Status.FAILED
            row.error_message = err
            row.sent_at = now
            row.save(update_fields=["status", "error_message", "sent_at"])
            errors.append(f"{row.email}: {err}")
            record_outbound_email(
                source=OutboundEmailLog.Source.BROADCAST,
                to_email=row.email,
                subject=broadcast.subject,
                success=False,
                error_message=err,
                broadcast=broadcast,
                meta={"audience": audience},
            )

    _refresh_broadcast_counts(broadcast)
    if errors:
        existing = (broadcast.error_summary or "").strip()
        merged = "\n".join([existing] + errors if existing else errors)
        broadcast.error_summary = merged[:8000]
    broadcast.save(
        update_fields=[
            "recipient_count",
            "sent_ok_count",
            "sent_fail_count",
            "pending_count",
            "skipped_count",
            "error_summary",
        ]
    )
    return _finalize_if_complete(broadcast)


def pause_broadcast(broadcast: EmailBroadcast) -> EmailBroadcast:
    if broadcast.status != EmailBroadcast.Status.SENDING:
        return broadcast
    broadcast.status = EmailBroadcast.Status.PAUSED
    broadcast.save(update_fields=["status"])
    return broadcast


def stop_broadcast(broadcast: EmailBroadcast) -> EmailBroadcast:
    if broadcast.status not in (
        EmailBroadcast.Status.SENDING,
        EmailBroadcast.Status.PAUSED,
    ):
        return broadcast
    with transaction.atomic():
        broadcast.recipients.filter(
            status=EmailBroadcastRecipient.Status.PENDING
        ).update(status=EmailBroadcastRecipient.Status.SKIPPED)
        broadcast.status = EmailBroadcast.Status.STOPPED
        broadcast.completed_at = timezone.now()
        _refresh_broadcast_counts(broadcast)
        broadcast.save(
            update_fields=[
                "status",
                "completed_at",
                "recipient_count",
                "sent_ok_count",
                "sent_fail_count",
                "pending_count",
                "skipped_count",
            ]
        )
    return broadcast


def resume_broadcast(broadcast: EmailBroadcast) -> EmailBroadcast:
    if broadcast.status == EmailBroadcast.Status.STOPPED:
        broadcast.recipients.filter(
            status=EmailBroadcastRecipient.Status.SKIPPED
        ).update(status=EmailBroadcastRecipient.Status.PENDING)
        _refresh_broadcast_counts(broadcast)
    if broadcast.status not in (
        EmailBroadcast.Status.PAUSED,
        EmailBroadcast.Status.STOPPED,
    ):
        return broadcast
    broadcast.status = EmailBroadcast.Status.SENDING
    broadcast.completed_at = None
    _refresh_broadcast_counts(broadcast)
    broadcast.save(
        update_fields=[
            "status",
            "completed_at",
            "pending_count",
            "skipped_count",
        ]
    )
    return broadcast


def send_broadcast(
    broadcast: EmailBroadcast,
    *,
    audience: str = "newsletter",
    user_ids: list | None = None,
    manual_emails: list[str] | None = None,
) -> EmailBroadcast:
    """Legacy synchronous send — prepares all recipients then processes until done."""
    prepare_broadcast_recipients(
        broadcast,
        audience=audience,
        user_ids=user_ids or [],
        manual_emails=manual_emails,
    )
    if broadcast.status == EmailBroadcast.Status.FAILED:
        return broadcast
    while broadcast.status == EmailBroadcast.Status.SENDING:
        process_broadcast_chunk(broadcast, limit=CHUNK_SIZE)
        broadcast.refresh_from_db()
        if broadcast.pending_count == 0:
            break
    return broadcast
