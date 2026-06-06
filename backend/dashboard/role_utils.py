"""
Dashboard roles: full admin = Django superuser; manager = staff and not superuser.
Used to restrict write APIs and hide superuser accounts from manager listing.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response

MANAGER_FORBIDDEN_DETAIL = (
    "This area isn’t available in your current access. "
    "Contact the development team if you need a change."
)
MANAGER_READ_ONLY_USER_DETAIL = (
    "We couldn’t open this account. If you need help, contact the development team."
)


def is_dashboard_manager(user) -> bool:
    if user is None or not getattr(user, "is_authenticated", False):
        return False
    return bool(user.is_staff) and not bool(getattr(user, "is_superuser", False))


def request_is_manager(request: Request) -> bool:
    return is_dashboard_manager(getattr(request, "user", None))


def require_full_admin(request: Request) -> Response | None:
    """For managers, block entire endpoint; server-secret / unauthenticated BFF is allowed."""
    if not request.user.is_authenticated:
        return None
    if request_is_manager(request):
        return Response({"detail": MANAGER_FORBIDDEN_DETAIL}, status=status.HTTP_403_FORBIDDEN)
    return None
