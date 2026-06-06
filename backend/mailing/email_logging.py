"""Persist outbound email attempts for dashboard troubleshooting."""

from __future__ import annotations

from typing import Any


def record_outbound_email(
    *,
    source: str,
    to_email: str,
    subject: str = "",
    success: bool,
    error_message: str = "",
    error_type: str = "",
    broadcast=None,
    meta: dict[str, Any] | None = None,
    created_at=None,
) -> None:
    from .models import OutboundEmailLog

    kwargs: dict[str, Any] = {
        "source": source,
        "to_email": (to_email or "").strip()[:254],
        "subject": (subject or "")[:998],
        "success": success,
        "error_message": (error_message or "")[:4000],
        "error_type": (error_type or "")[:120],
        "broadcast": broadcast,
        "meta": meta or {},
    }
    if created_at is not None:
        kwargs["created_at"] = created_at
    OutboundEmailLog.objects.create(**kwargs)
