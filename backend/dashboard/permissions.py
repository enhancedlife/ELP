import secrets

from django.conf import settings
from rest_framework import permissions


def _request_from_loopback(request) -> bool:
    """True when Django sees the client as local (typical Next dev → 127.0.0.1:8000)."""
    addr = (request.META.get("REMOTE_ADDR") or "").strip()
    if addr in ("127.0.0.1", "::1"):
        return True
    if addr.startswith("::ffff:") and addr.removeprefix("::ffff:") == "127.0.0.1":
        return True
    return False


class DashboardAccess(permissions.BasePermission):
    """
    Allow dashboard API when any of these hold:

    1. Valid X-Dashboard-Secret matches DASHBOARD_SERVER_SECRET (non-empty), or
    2. Secret is empty and (DEBUG or request from loopback) — local BFF without a secret, or
    3. Authenticated active user with Token auth: superuser if DASHBOARD_REQUIRES_SUPERUSER
       (default), else staff.

    In production, set DASHBOARD_SERVER_SECRET on Django and Next.js. Browser calls use
    superuser tokens by default; set DASHBOARD_REQUIRES_SUPERUSER=0 to allow staff tokens.
    """

    def has_permission(self, request, view):
        expected = (getattr(settings, "DASHBOARD_SERVER_SECRET", None) or "").strip()
        got = (request.headers.get("X-Dashboard-Secret") or "").strip()
        if expected:
            if got and secrets.compare_digest(got, expected):
                return True
        else:
            if getattr(settings, "DEBUG", False) or _request_from_loopback(request):
                return True

        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated and user.is_active:
            if getattr(settings, "DASHBOARD_REQUIRES_SUPERUSER", True):
                if bool(getattr(user, "is_superuser", False)):
                    return True
                if (
                    getattr(settings, "DASHBOARD_ALLOW_STAFF_MANAGERS", True)
                    and bool(getattr(user, "is_staff", False))
                ):
                    return True
                return False
            return bool(getattr(user, "is_staff", False))
        return False


# Backward-compatible alias
HasDashboardSecret = DashboardAccess
