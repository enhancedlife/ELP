"""User-facing messages for SMTP failures (Elastic Email trial limits, auth, etc.)."""

from __future__ import annotations

import smtplib


def smtp_failure_user_message(exc: BaseException) -> str:
    """Short message for API responses when send_mail / EmailMessage.send fails."""
    default = (
        "We could not send email right now. "
        "Verify EMAIL_HOST and credentials in the server environment, then try again."
    )
    if not isinstance(exc, smtplib.SMTPException):
        return default

    code = getattr(exc, "smtp_code", None)
    err_raw = getattr(exc, "smtp_error", b"") or b""
    err_s = err_raw.decode("utf-8", "replace") if isinstance(err_raw, (bytes, bytearray)) else str(err_raw)
    low = err_s.lower()

    if code == 421 and any(
        x in low for x in ("testing purposes", "purchase", "trial", "upgrade", "intended recipients")
    ):
        return (
            "Your SMTP provider accepted the connection but refused this recipient: "
            "Elastic Email trial/sandbox plans often allow only the email address used to register "
            "the account. Upgrade the plan at Elastic Email or use another SMTP provider to reach "
            "arbitrary addresses."
        )

    if code == 530 or ("5.5.1" in err_s and "authentication" in low):
        return (
            "Zoho (and many hosts) returned 530 / Authentication Required: the server did not accept your "
            "SMTP login. Fix: (1) Use the real mailbox password for admin@yourenhancedlife.com, or create an "
            "Application-Specific Password in Zoho Mail → Settings → Security (required if 2FA is on). "
            "(2) EMAIL_HOST_USER must be the full email address. "
            "(3) If 587 + TLS fails, try port 465 with EMAIL_USE_SSL=1 and EMAIL_USE_TLS=0. "
            "(4) Confirm outbound SMTP is allowed for this account in Zoho admin."
        )

    if code in (535, 534, 432):
        return (
            "SMTP authentication failed. Check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD "
            "(Zoho: mailbox or app-specific password; Elastic Email: SMTP credentials from the dashboard)."
        )

    if code == 550:
        return "The mail provider rejected the recipient or sender address. Verify the address and domain verification in your email provider."

    return default
