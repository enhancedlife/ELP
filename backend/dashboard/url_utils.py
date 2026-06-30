"""Build public-facing absolute URLs behind Docker / reverse proxies."""

from __future__ import annotations

from django.conf import settings

_INTERNAL_HOST_PREFIXES = (
    "backend",
    "frontend",
    "localhost",
    "127.0.0.1",
)


def _host_is_internal(host: str) -> bool:
    h = (host or "").strip().lower()
    if not h:
        return True
    return any(h == prefix or h.startswith(f"{prefix}.") for prefix in _INTERNAL_HOST_PREFIXES)


def public_absolute_url(request, path: str) -> str:
    """Prefer the public site origin when Django sees an internal Host header."""
    path = (path or "").strip()
    if not path:
        return path
    if path.startswith(("http://", "https://")):
        return path
    if not path.startswith("/"):
        path = f"/{path}"

    base = getattr(settings, "PUBLIC_SITE_BASE_URL", "").rstrip("/")
    if request is not None:
        host = (request.get_host() or "").split(":")[0]
        if not _host_is_internal(host):
            try:
                return request.build_absolute_uri(path)
            except Exception:
                pass

    if base:
        return f"{base}{path}"
    return path
