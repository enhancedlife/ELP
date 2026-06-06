"""Parse and normalize email address lists for bulk mail."""

from __future__ import annotations

import re

from django.core.exceptions import ValidationError
from django.core.validators import validate_email


def normalize_email_list(raw: list | str | None) -> list[str]:
    """Split comma/newline/semicolon-separated input, validate, dedupe (case-insensitive)."""
    if raw is None:
        return []
    parts: list[str] = []
    if isinstance(raw, str):
        parts = re.split(r"[\n,;]+", raw)
    elif isinstance(raw, list):
        parts = [str(x) for x in raw]
    else:
        return []

    seen: set[str] = set()
    out: list[str] = []
    for part in parts:
        email = part.strip().lower()
        if not email:
            continue
        validate_email(email)
        if email in seen:
            continue
        seen.add(email)
        out.append(email)
    return out


def normalize_email_list_lenient(raw: list | str | None) -> tuple[list[str], list[str]]:
    """Like normalize_email_list but returns (valid, invalid) instead of raising."""
    if raw is None:
        return [], []
    parts: list[str] = []
    if isinstance(raw, str):
        parts = re.split(r"[\n,;]+", raw)
    elif isinstance(raw, list):
        parts = [str(x) for x in raw]
    else:
        return [], []

    seen: set[str] = set()
    valid: list[str] = []
    invalid: list[str] = []
    for part in parts:
        email = part.strip().lower()
        if not email:
            continue
        try:
            validate_email(email)
        except ValidationError:
            invalid.append(part.strip())
            continue
        if email in seen:
            continue
        seen.add(email)
        valid.append(email)
    return valid, invalid
