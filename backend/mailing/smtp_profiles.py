"""Resolve and use dashboard SMTP profiles for outbound mail."""

from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings
from django.core.mail import get_connection
from django.db import transaction

from .models import SmtpProfile


@dataclass(frozen=True)
class ResolvedSmtp:
    host: str
    port: int
    username: str
    password: str
    use_tls: bool
    use_ssl: bool
    from_email: str
    source: str  # "profile" | "env"
    profile_id: int | None = None
    profile_name: str | None = None


def get_active_smtp_profile() -> SmtpProfile | None:
    return SmtpProfile.objects.filter(is_active=True, is_enabled=True).first()


def resolve_smtp() -> ResolvedSmtp | None:
    profile = get_active_smtp_profile()
    if profile:
        return ResolvedSmtp(
            host=profile.host.strip(),
            port=int(profile.port or 587),
            username=(profile.username or "").strip(),
            password=profile.password or "",
            use_tls=bool(profile.use_tls),
            use_ssl=bool(profile.use_ssl),
            from_email=(profile.from_email or "").strip(),
            source="profile",
            profile_id=profile.id,
            profile_name=profile.name,
        )

    host = (getattr(settings, "EMAIL_HOST", None) or "").strip()
    if not host:
        return None
    return ResolvedSmtp(
        host=host,
        port=int(getattr(settings, "EMAIL_PORT", 587)),
        username=(getattr(settings, "EMAIL_HOST_USER", None) or "").strip(),
        password=(getattr(settings, "EMAIL_HOST_PASSWORD", None) or "").strip(),
        use_tls=bool(getattr(settings, "EMAIL_USE_TLS", True)),
        use_ssl=bool(getattr(settings, "EMAIL_USE_SSL", False)),
        from_email=(getattr(settings, "DEFAULT_FROM_EMAIL", None) or "").strip(),
        source="env",
    )


def get_outbound_connection():
    resolved = resolve_smtp()
    if not resolved or not resolved.host:
        return get_connection()
    return get_connection(
        backend="django.core.mail.backends.smtp.EmailBackend",
        host=resolved.host,
        port=resolved.port,
        username=resolved.username,
        password=resolved.password,
        use_tls=resolved.use_tls,
        use_ssl=resolved.use_ssl,
        timeout=int(getattr(settings, "EMAIL_TIMEOUT", 30)),
    )


def resolve_from_email(override: str | None = None) -> str:
    if override and str(override).strip():
        return str(override).strip()
    resolved = resolve_smtp()
    if resolved and resolved.from_email:
        return resolved.from_email
    return (getattr(settings, "DEFAULT_FROM_EMAIL", None) or "").strip()


def get_connection_for_profile(profile: SmtpProfile):
    return get_connection(
        backend="django.core.mail.backends.smtp.EmailBackend",
        host=profile.host.strip(),
        port=int(profile.port or 587),
        username=(profile.username or "").strip(),
        password=profile.password or "",
        use_tls=bool(profile.use_tls),
        use_ssl=bool(profile.use_ssl),
        timeout=int(getattr(settings, "EMAIL_TIMEOUT", 30)),
    )


def prepare_outbound_message(msg):
    """Attach the active SMTP connection and default from address to a message."""
    msg.connection = get_outbound_connection()
    if not getattr(msg, "from_email", None):
        msg.from_email = resolve_from_email()
    elif not str(msg.from_email).strip():
        msg.from_email = resolve_from_email()
    return msg


def send_outbound_mail(
    subject: str,
    message: str,
    from_email: str | None,
    recipient_list,
    *,
    html_message: str | None = None,
    **kwargs,
):
    """
    Send plain text mail, or multipart plain + HTML when html_message is provided.
    """
    from django.core.mail import EmailMultiAlternatives, send_mail

    connection = get_outbound_connection()
    resolved_from = resolve_from_email(from_email)
    fail_silently = kwargs.pop("fail_silently", False)

    if html_message:
        msg = EmailMultiAlternatives(
            subject,
            message,
            resolved_from,
            recipient_list,
            connection=connection,
        )
        msg.attach_alternative(html_message, "text/html")
        prepare_outbound_message(msg)
        return msg.send(fail_silently=fail_silently)

    return send_mail(
        subject,
        message,
        resolved_from,
        recipient_list,
        connection=connection,
        fail_silently=fail_silently,
        **kwargs,
    )


@transaction.atomic
def activate_smtp_profile(profile: SmtpProfile) -> SmtpProfile:
    if not profile.is_enabled:
        profile.is_enabled = True
    SmtpProfile.objects.exclude(pk=profile.pk).update(is_active=False)
    profile.is_active = True
    profile.save(update_fields=["is_enabled", "is_active", "updated_at"])
    return profile


@transaction.atomic
def set_smtp_profile_enabled(profile: SmtpProfile, enabled: bool) -> SmtpProfile:
    profile.is_enabled = enabled
    if not enabled and profile.is_active:
        profile.is_active = False
    profile.save(update_fields=["is_enabled", "is_active", "updated_at"])
    if enabled and not SmtpProfile.objects.filter(is_active=True, is_enabled=True).exists():
        activate_smtp_profile(profile)
    return profile
