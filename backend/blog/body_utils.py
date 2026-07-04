"""Sync blog body block JSON (hero image, etc.)."""

from __future__ import annotations

import json
import re
import secrets

from .image_utils import blog_post_card_image_path

BLOG_BODY_FORMAT = "blog-blocks-v1"

_LEGACY_HERO_HTML = re.compile(
    r"aspect-\[2/1\]|aspect-\[2\/1\]",
    re.IGNORECASE,
)


def body_needs_legacy_import(raw: str | None) -> bool:
    """True when body is empty, legacy HTML, or only auto-managed hero blocks."""
    trimmed = (raw or "").strip()
    if not trimmed:
        return True
    if not trimmed.startswith("{"):
        return True
    blocks = parse_blog_body(raw)
    if blocks is None:
        return True
    content_blocks = [
        block
        for block in blocks
        if block.get("type") != "hero_image"
        and not (
            block.get("type") == "raw_html"
            and _LEGACY_HERO_HTML.search(str(block.get("html") or ""))
            and "<img" in str(block.get("html") or "").lower()
        )
    ]
    return len(content_blocks) == 0


def parse_blog_body(raw: str | None) -> list[dict] | None:
    trimmed = (raw or "").strip()
    if not trimmed.startswith("{"):
        return None
    try:
        data = json.loads(trimmed)
    except json.JSONDecodeError:
        return None
    if data.get("format") != BLOG_BODY_FORMAT or not isinstance(data.get("blocks"), list):
        return None
    return data["blocks"]


def serialize_blog_body(blocks: list[dict]) -> str:
    return json.dumps({"format": BLOG_BODY_FORMAT, "blocks": blocks})


def _new_block_id() -> str:
    return f"b_{secrets.token_hex(4)}"


def _strip_hero_blocks(blocks: list[dict]) -> list[dict]:
    cleaned: list[dict] = []
    for block in blocks:
        if block.get("type") == "hero_image":
            continue
        if block.get("type") == "raw_html":
            html = str(block.get("html") or "")
            if _LEGACY_HERO_HTML.search(html) and "<img" in html.lower():
                continue
        cleaned.append(block)
    return cleaned


def upsert_hero_image_block(blocks: list[dict], src: str, alt: str = "") -> list[dict]:
    src = (src or "").strip()
    if not src:
        return _strip_hero_blocks(blocks)
    without = _strip_hero_blocks(blocks)
    hero = {
        "id": _new_block_id(),
        "type": "hero_image",
        "src": src,
        "alt": (alt or "").strip(),
    }
    return [hero, *without]


def sync_post_hero_block(post) -> bool:
    """Ensure body JSON starts with a hero_image block using the card/thumbnail URL."""
    src = blog_post_card_image_path(post)
    if not src:
        return False
    blocks = parse_blog_body(post.body)
    if blocks is None:
        blocks = []
    updated = upsert_hero_image_block(blocks, src, post.title or "")
    new_body = serialize_blog_body(updated)
    if new_body == (post.body or ""):
        return False
    post.body = new_body
    return True


def sync_post_card_image_fields(post) -> list[str]:
    """Keep image_url aligned with thumbnail; returns changed field names."""
    from .image_utils import mirror_blog_thumbnail_to_public_images

    changed: list[str] = []
    if post.thumbnail and post.thumbnail.name:
        mirrored = mirror_blog_thumbnail_to_public_images(post)
        next_url = mirrored or blog_post_card_image_path(post)
    else:
        next_url = blog_post_card_image_path(post)
    if post.image_url != next_url:
        post.image_url = next_url
        changed.append("image_url")
    if sync_post_hero_block(post):
        changed.append("body")
    return changed
