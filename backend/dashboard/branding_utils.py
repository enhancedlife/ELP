"""Site logo and favicon upload validation."""

from __future__ import annotations

import io
import os

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile

ALLOWED_LOGO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
ALLOWED_FAVICON_EXTENSIONS = {".ico", ".png", ".webp", ".svg", ".jpg", ".jpeg", ".gif"}
MAX_LOGO_BYTES = 5 * 1024 * 1024
MAX_FAVICON_BYTES = 2 * 1024 * 1024
FAVICON_OUTPUT_PX = 192
# Zoom cropped art before the final square so the mark fills more of the tab slot.
FAVICON_ZOOM = 1.35


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


def _square_crop_box(width: int, height: int) -> tuple[int, int, int, int]:
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    return left, top, left + side, top + side


def prepare_favicon_file(uploaded_file):
    """
    Normalize raster favicons: center square crop, resize to 192×192 PNG.
    Fills the canvas so the mark reads larger in fixed-size browser tabs.
    SVG/ICO are stored as uploaded.
    """
    name = (getattr(uploaded_file, "name", None) or "favicon.png").lower()
    ext = os.path.splitext(name)[1]
    if ext in {".svg", ".ico"}:
        uploaded_file.seek(0)
        return uploaded_file

    try:
        from PIL import Image
    except ImportError:
        uploaded_file.seek(0)
        return uploaded_file

    uploaded_file.seek(0)
    try:
        with Image.open(uploaded_file) as img:
            img.load()
            if img.mode != "RGBA":
                img = img.convert("RGBA")

            left, top, right, bottom = _square_crop_box(*img.size)
            img = img.crop((left, top, right, bottom))
            zoomed = max(FAVICON_OUTPUT_PX, int(FAVICON_OUTPUT_PX * FAVICON_ZOOM))
            img = img.resize((zoomed, zoomed), Image.Resampling.LANCZOS)
            inset = (zoomed - FAVICON_OUTPUT_PX) // 2
            img = img.crop(
                (inset, inset, inset + FAVICON_OUTPUT_PX, inset + FAVICON_OUTPUT_PX)
            )

            out = io.BytesIO()
            img.save(out, format="PNG", optimize=True)
            out.seek(0)
            base = os.path.splitext(os.path.basename(name))[0] or "favicon"
            return ContentFile(out.read(), name=f"{base}-tab.png")
    except Exception as exc:
        raise ValidationError(f"Could not process favicon image: {exc}") from exc


from dashboard.url_utils import public_absolute_url


def branding_file_url(field, request=None) -> str:
    if not field:
        return ""
    try:
        url = field.url
    except (ValueError, OSError):
        return ""
    if url.startswith("/"):
        return public_absolute_url(request, url)
    return url
