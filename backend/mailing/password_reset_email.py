"""Backward-compatible re-exports; use mailing.transactional_email."""

from .transactional_email import (
    build_member_password_reset_bodies,
    build_password_reset_notice_bodies,
)

__all__ = [
    "build_member_password_reset_bodies",
    "build_password_reset_notice_bodies",
]
