"""Blog card/thumbnail image helpers."""

from __future__ import annotations

import os

from django.core.exceptions import ValidationError

ALLOWED_THUMBNAIL_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024  # 5 MB


def validate_thumbnail_upload(uploaded_file) -> None:
    name = (getattr(uploaded_file, "name", None) or "").lower()
    ext = os.path.splitext(name)[1]
    if ext not in ALLOWED_THUMBNAIL_EXTENSIONS:
        raise ValidationError(
            "Unsupported image type. Use JPEG, PNG, WebP, or GIF."
        )
    size = getattr(uploaded_file, "size", None)
    if size is not None and size > MAX_THUMBNAIL_BYTES:
        raise ValidationError("Image must be 5 MB or smaller.")


def blog_post_card_image(post, request=None) -> str:
    """Uploaded thumbnail wins; otherwise the manual image_url field."""
    if getattr(post, "thumbnail", None):
        try:
            if post.thumbnail:
                url = post.thumbnail.url
                if request and url.startswith("/"):
                    return request.build_absolute_uri(url)
                return url
        except (ValueError, OSError):
            pass
    return (post.image_url or "").strip() or "/images/article-default.jpg"
