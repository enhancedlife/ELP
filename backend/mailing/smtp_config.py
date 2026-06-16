"""Detect whether outbound mail is configured for real SMTP delivery."""

from __future__ import annotations

from django.conf import settings

from .models import SmtpProfile
from .smtp_profiles import get_active_smtp_profile, resolve_smtp


def _is_console_backend() -> bool:
    backend = (getattr(settings, "EMAIL_BACKEND", None) or "").lower()
    return "console" in backend


def outbound_smtp_block_reason(*, allow_console_in_debug: bool = True) -> str | None:
    """
    Return an error message when outbound mail cannot reach recipients, else None.
    In DEBUG mode, console backend is allowed (prints to server logs only) when no DB profile.
    """
    resolved = resolve_smtp()
    if resolved and resolved.host and resolved.username and resolved.password:
        return None

    if _is_console_backend():
        if allow_console_in_debug and getattr(settings, "DEBUG", False):
            return None
        return (
            "Outbound email is not configured. Add an SMTP profile under Dashboard → Email → "
            "SMTP servers, or set EMAIL_HOST, EMAIL_HOST_USER, and EMAIL_HOST_PASSWORD in the "
            "server environment."
        )
    if not resolved or not resolved.host:
        return "No SMTP host configured. Add an SMTP profile or set EMAIL_HOST."
    if not resolved.username:
        return "SMTP username is missing on the active profile or in EMAIL_HOST_USER."
    if not resolved.password:
        return "SMTP password is missing on the active profile or in EMAIL_HOST_PASSWORD."
    return None


def delivery_status_payload() -> dict:
    """Safe summary for dashboard (no secrets)."""
    block = outbound_smtp_block_reason(allow_console_in_debug=False)
    resolved = resolve_smtp()
    active = get_active_smtp_profile()
    return {
        "smtp_ready": block is None,
        "backend": getattr(settings, "EMAIL_BACKEND", ""),
        "smtp_source": (resolved.source if resolved else "none"),
        "active_profile_id": active.id if active else None,
        "active_profile_name": active.name if active else None,
        "profiles_count": SmtpProfile.objects.count(),
        "enabled_profiles_count": SmtpProfile.objects.filter(is_enabled=True).count(),
        "email_host": resolved.host if resolved else "",
        "email_port": resolved.port if resolved else int(getattr(settings, "EMAIL_PORT", 587)),
        "email_use_tls": resolved.use_tls if resolved else bool(getattr(settings, "EMAIL_USE_TLS", True)),
        "email_use_ssl": resolved.use_ssl if resolved else bool(getattr(settings, "EMAIL_USE_SSL", False)),
        "default_from_email": resolved.from_email if resolved else (getattr(settings, "DEFAULT_FROM_EMAIL", None) or "").strip(),
        "email_host_user_set": bool(resolved.username if resolved else (getattr(settings, "EMAIL_HOST_USER", None) or "").strip()),
        "email_host_password_set": bool(resolved.password if resolved else (getattr(settings, "EMAIL_HOST_PASSWORD", None) or "").strip()),
        "debug_mode": bool(getattr(settings, "DEBUG", False)),
        "message": block
        or (
            f"Using SMTP profile “{active.name}”."
            if active
            else "Using SMTP settings from the server environment."
            if resolved and resolved.source == "env"
            else "SMTP is configured."
        ),
    }
