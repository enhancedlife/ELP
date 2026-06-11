"""Detect whether outbound mail is configured for real SMTP delivery."""

from __future__ import annotations

from django.conf import settings


def _is_console_backend() -> bool:
    backend = (getattr(settings, "EMAIL_BACKEND", None) or "").lower()
    return "console" in backend


def outbound_smtp_block_reason(*, allow_console_in_debug: bool = True) -> str | None:
    """
    Return an error message when outbound mail cannot reach recipients, else None.
    In DEBUG mode, console backend is allowed (prints to server logs only).
    """
    if _is_console_backend():
        if allow_console_in_debug and getattr(settings, "DEBUG", False):
            return None
        return (
            "Outbound email is not configured on this server (Django console backend). "
            "Docker production uses the root .env next to docker-compose.yml — not backend/.env. "
            "Set EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, and DEFAULT_FROM_EMAIL there, "
            "then restart: docker compose up -d backend"
        )
    host = (getattr(settings, "EMAIL_HOST", None) or "").strip()
    user = (getattr(settings, "EMAIL_HOST_USER", None) or "").strip()
    password = (getattr(settings, "EMAIL_HOST_PASSWORD", None) or "").strip()
    if not host:
        return "EMAIL_HOST is not set in the server environment."
    if not user:
        return "EMAIL_HOST_USER is not set in the server environment."
    if not password:
        return "EMAIL_HOST_PASSWORD is not set in the server environment."
    return None


def delivery_status_payload() -> dict:
    """Safe summary for dashboard (no secrets)."""
    block = outbound_smtp_block_reason(allow_console_in_debug=False)
    return {
        "smtp_ready": block is None,
        "backend": getattr(settings, "EMAIL_BACKEND", ""),
        "email_host": (getattr(settings, "EMAIL_HOST", None) or "").strip(),
        "email_port": int(getattr(settings, "EMAIL_PORT", 587)),
        "email_use_tls": bool(getattr(settings, "EMAIL_USE_TLS", True)),
        "email_use_ssl": bool(getattr(settings, "EMAIL_USE_SSL", False)),
        "default_from_email": (getattr(settings, "DEFAULT_FROM_EMAIL", None) or "").strip(),
        "email_host_user_set": bool((getattr(settings, "EMAIL_HOST_USER", None) or "").strip()),
        "email_host_password_set": bool(
            (getattr(settings, "EMAIL_HOST_PASSWORD", None) or "").strip()
        ),
        "debug_mode": bool(getattr(settings, "DEBUG", False)),
        "message": block
        or "SMTP is configured. Use Email → Send log to verify delivery after a test send.",
    }
