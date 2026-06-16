"""Detect whether outbound mail is configured for real SMTP delivery."""

from __future__ import annotations

from django.conf import settings

from .models import SmtpProfile
from .smtp_profiles import (
    ResolvedSmtp,
    get_active_smtp_profile,
    resolve_env_smtp,
    resolve_profile_smtp,
)


def _is_console_backend() -> bool:
    backend = (getattr(settings, "EMAIL_BACKEND", None) or "").lower()
    return "console" in backend


def _block_for_resolved(
    resolved: ResolvedSmtp | None,
    *,
    allow_console_in_debug: bool,
    missing_profile_message: str,
) -> str | None:
    if resolved and resolved.host and resolved.username and resolved.password:
        return None

    if _is_console_backend():
        if allow_console_in_debug and getattr(settings, "DEBUG", False):
            return None
        return missing_profile_message

    if not resolved or not resolved.host:
        return missing_profile_message
    if not resolved.username:
        return "SMTP username is missing."
    if not resolved.password:
        return "SMTP password is missing."
    return None


def env_smtp_block_reason(*, allow_console_in_debug: bool = True) -> str | None:
    """Contact form and password reset — requires Zoho (or other) SMTP in backend/.env."""
    return _block_for_resolved(
        resolve_env_smtp(),
        allow_console_in_debug=allow_console_in_debug,
        missing_profile_message=(
            "Transactional email is not configured. Set EMAIL_HOST, EMAIL_HOST_USER, and "
            "EMAIL_HOST_PASSWORD in backend/.env (Zoho SMTP for contact form and password reset)."
        ),
    )


def profile_smtp_block_reason(*, allow_console_in_debug: bool = True) -> str | None:
    """Bulk mail — requires an active SMTP profile from Dashboard → Email → SMTP servers."""
    return _block_for_resolved(
        resolve_profile_smtp(),
        allow_console_in_debug=allow_console_in_debug,
        missing_profile_message=(
            "Bulk email is not configured. Add an SMTP server under Dashboard → Email → "
            "SMTP servers and mark one as active."
        ),
    )


def outbound_smtp_block_reason(*, allow_console_in_debug: bool = True) -> str | None:
    """Default check for bulk mail (dashboard profiles)."""
    return profile_smtp_block_reason(allow_console_in_debug=allow_console_in_debug)


def _resolved_summary(resolved: ResolvedSmtp | None) -> dict:
    if not resolved:
        return {
            "ready": False,
            "source": "none",
            "host": "",
            "port": int(getattr(settings, "EMAIL_PORT", 587)),
            "use_tls": bool(getattr(settings, "EMAIL_USE_TLS", True)),
            "use_ssl": bool(getattr(settings, "EMAIL_USE_SSL", False)),
            "from_email": (getattr(settings, "DEFAULT_FROM_EMAIL", None) or "").strip(),
            "username_set": False,
            "password_set": False,
            "profile_id": None,
            "profile_name": None,
            "message": "Not configured.",
        }
    block = _block_for_resolved(
        resolved,
        allow_console_in_debug=False,
        missing_profile_message="Not configured.",
    )
    return {
        "ready": block is None,
        "source": resolved.source,
        "host": resolved.host,
        "port": resolved.port,
        "use_tls": resolved.use_tls,
        "use_ssl": resolved.use_ssl,
        "from_email": resolved.from_email,
        "username_set": bool(resolved.username),
        "password_set": bool(resolved.password),
        "profile_id": resolved.profile_id,
        "profile_name": resolved.profile_name,
        "message": (
            f"Using SMTP profile “{resolved.profile_name}”."
            if resolved.source == "profile" and resolved.profile_name
            else "Using SMTP from backend/.env (contact form & password reset)."
            if resolved.source == "env"
            else "SMTP is configured."
        ),
    }


def delivery_status_payload() -> dict:
    """Safe summary for dashboard (no secrets)."""
    env = resolve_env_smtp()
    profile = resolve_profile_smtp()
    env_summary = _resolved_summary(env)
    profile_summary = _resolved_summary(profile)
    active = get_active_smtp_profile()
    env_block = env_smtp_block_reason(allow_console_in_debug=False)
    profile_block = profile_smtp_block_reason(allow_console_in_debug=False)

    return {
        "smtp_ready": profile_block is None,
        "bulk_smtp_ready": profile_block is None,
        "transactional_smtp_ready": env_block is None,
        "backend": getattr(settings, "EMAIL_BACKEND", ""),
        "smtp_source": profile_summary["source"] if profile_block is None else env_summary["source"],
        "active_profile_id": active.id if active else None,
        "active_profile_name": active.name if active else None,
        "profiles_count": SmtpProfile.objects.count(),
        "enabled_profiles_count": SmtpProfile.objects.filter(is_enabled=True).count(),
        "email_host": profile_summary["host"] or env_summary["host"],
        "email_port": profile_summary["port"],
        "email_use_tls": profile_summary["use_tls"],
        "email_use_ssl": profile_summary["use_ssl"],
        "default_from_email": profile_summary["from_email"] or env_summary["from_email"],
        "email_host_user_set": profile_summary["username_set"] or env_summary["username_set"],
        "email_host_password_set": profile_summary["password_set"] or env_summary["password_set"],
        "debug_mode": bool(getattr(settings, "DEBUG", False)),
        "message": profile_summary["message"] if profile_block is None else profile_block,
        "bulk_message": profile_summary["message"] if profile_block is None else profile_block,
        "transactional_message": env_summary["message"] if env_block is None else env_block,
        "env_smtp": env_summary,
        "profile_smtp": profile_summary,
    }
