"""Plain-text checks for the public contact form."""

from __future__ import annotations

import html
import re
from urllib.parse import unquote

# Only block HTML/script injection markers — normal punctuation (?, !, ', ", &, etc.) is allowed.
_ANGLE = re.compile(r"[<>＜＞]")
_EVENT = re.compile(
    r"\b(onerror|onload|onclick|onmouseover|onfocus|onmouseenter|onpointerdown)\s*=",
    re.IGNORECASE,
)
_JS = re.compile(r"javascript\s*:", re.IGNORECASE)

MARKUP_MESSAGE = "This field cannot include HTML or script text."


def contains_markup(value: str) -> bool:
    if value == "":
        return False
    if "\0" in value:
        return True
    candidates = [value, html.unescape(value)]
    decoded = unquote(value)
    if decoded != value:
        candidates.append(decoded)
        candidates.append(html.unescape(decoded))
    for text in candidates:
        if _ANGLE.search(text) or _EVENT.search(text) or _JS.search(text):
            return True
    return False


def markup_error(*values: str) -> str | None:
    for value in values:
        if contains_markup(value or ""):
            return MARKUP_MESSAGE
    return None
