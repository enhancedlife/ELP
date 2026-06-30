"""Blog card/thumbnail image helpers."""

from __future__ import annotations

import os
import shutil
from pathlib import Path

from django.conf import settings
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


def _to_site_relative_path(url: str) -> str:
    url = (url or "").strip()
    if not url:
        return "/images/article-default.jpg"
    if url.startswith(("http://", "https://")):
        from urllib.parse import urlparse

        path = urlparse(url).path
        return path or url
    if not url.startswith("/"):
        return f"/{url}"
    return url


def blog_post_card_image_path(post) -> str:
    """Site-relative card image (/media/… or /images/…) for public pages."""
    if getattr(post, "thumbnail", None) and post.thumbnail.name:
        try:
            return _to_site_relative_path(post.thumbnail.url)
        except (ValueError, OSError):
            pass
    return _to_site_relative_path(
        (post.image_url or "").strip() or "/images/article-default.jpg",
    )


def blog_post_card_image(post, request=None) -> str:
    """Effective public card image — always site-relative for SSR and browser."""
    return blog_post_card_image_path(post)


def public_images_root() -> Path | None:
    raw = (getattr(settings, "PUBLIC_IMAGES_ROOT", None) or "").strip()
    if not raw:
        return None
    return Path(raw)


def mirror_blog_thumbnail_to_public_images(post) -> str | None:
    """
    Copy uploaded thumbnail to public/images/blog/ on the host (when mounted).
    Returns the site path e.g. /images/blog/my-post.webp, or None if skipped.
    """
    if not post.thumbnail:
        return None
    root = public_images_root()
    if root is None:
        return None
    try:
        src = Path(post.thumbnail.path)
    except (ValueError, OSError):
        return None
    if not src.is_file():
        return None

    dest_dir = root / "blog"
    dest_dir.mkdir(parents=True, exist_ok=True)
    ext = src.suffix.lower() or ".jpg"
    dest = dest_dir / f"{post.slug}{ext}"
    shutil.copy2(src, dest)
    return f"/images/blog/{post.slug}{ext}"


def remove_public_image_mirror(post) -> None:
    root = public_images_root()
    if root is None or not post.slug:
        return
    blog_dir = root / "blog"
    if not blog_dir.is_dir():
        return
    for path in blog_dir.glob(f"{post.slug}.*"):
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass
