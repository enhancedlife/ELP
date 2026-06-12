"""Site logo and favicon upload validation."""

from __future__ import annotations

import os

from django.core.exceptions import ValidationError

ALLOWED_LOGO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
ALLOWED_FAVICON_EXTENSIONS = {".ico", ".png", ".webp", ".svg", ".jpg", ".jpeg", ".gif"}
MAX_LOGO_BYTES = 5 * 1024 * 1024
MAX_FAVICON_BYTES = 2 * 1024 * 1024


def _validate_image_upload(uploaded_file, allowed_extensions: set[str], max_bytes: int, label: str) -> None:
    name = (getattr(uploaded_file, "name", None) or "").lower()
    ext = os.path.splitext(name)[1]
    if ext not in allowed_extensions:
        raise ValidationError(
            f"Unsupported {label} type. Allowed: {', '.join(sorted(allowed_extensions))}."
        )
    size = getattr(uploaded_file, "size", None)
    if size is not None and size > max_bytes:
        mb = max_bytes // (1024 * 1024)
        raise ValidationError(f"{label.capitalize()} must be {mb} MB or smaller.")


def validate_logo_upload(uploaded_file) -> None:
    _validate_image_upload(uploaded_file, ALLOWED_LOGO_EXTENSIONS, MAX_LOGO_BYTES, "logo")


def validate_favicon_upload(uploaded_file) -> None:
    _validate_image_upload(uploaded_file, ALLOWED_FAVICON_EXTENSIONS, MAX_FAVICON_BYTES, "favicon")


def branding_file_url(field, request=None) -> str:
    if not field:
        return ""
    try:
        url = field.url
    except (ValueError, OSError):
        return ""
    if request and url.startswith("/"):
        return request.build_absolute_uri(url)
    return url
