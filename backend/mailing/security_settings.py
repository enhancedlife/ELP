"""JSON key/value store for contact + Cloudflare security toggles."""

from __future__ import annotations

import json

from mailing.models import SecuritySetting


def get_json(key: str, default):
    row = SecuritySetting.objects.filter(pk=key).first()
    if not row or not row.value:
        return default
    try:
        return json.loads(row.value)
    except json.JSONDecodeError:
        return default


def save_json(key: str, value, label: str, group: str) -> None:
    SecuritySetting.objects.update_or_create(
        key=key,
        defaults={
            "value": json.dumps(value),
            "label": label,
            "group": group,
        },
    )
