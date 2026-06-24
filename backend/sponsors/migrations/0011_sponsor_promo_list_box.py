# Merge consecutive promo_code blocks into a single promo_list box on sponsor bodies.

import json

from django.db import migrations


def _promo_code_to_item(block: dict) -> dict:
    return {
        "title": block.get("code") or "",
        "titleColor": block.get("codeColor") or "orange",
        "detail": block.get("description") or "",
    }


def _merge_promo_blocks(blocks: list) -> list:
    merged: list = []
    i = 0
    while i < len(blocks):
        block = blocks[i]
        if block.get("type") != "promo_code":
            merged.append(block)
            i += 1
            continue

        group = []
        box_label = block.get("label") or "Exclusive Community Codes"
        first_id = block.get("id", "promo_list")
        while i < len(blocks) and blocks[i].get("type") == "promo_code":
            if blocks[i].get("label"):
                box_label = blocks[i]["label"]
            group.append(_promo_code_to_item(blocks[i]))
            i += 1

        list_id = "gl_promo_list" if str(first_id).startswith("gl_promo") else first_id
        merged.append(
            {
                "id": list_id,
                "type": "promo_list",
                "boxLabel": box_label,
                "items": group,
            }
        )
    return merged


def convert_sponsor_promos(apps, schema_editor):
    Sponsor = apps.get_model("sponsors", "Sponsor")
    for sponsor in Sponsor.objects.exclude(body=""):
        try:
            doc = json.loads(sponsor.body)
        except (json.JSONDecodeError, TypeError):
            continue
        if not isinstance(doc, dict) or doc.get("format") != "blog-blocks-v1":
            continue
        blocks = doc.get("blocks")
        if not isinstance(blocks, list):
            continue
        if not any(b.get("type") == "promo_code" for b in blocks if isinstance(b, dict)):
            continue
        doc["blocks"] = _merge_promo_blocks(blocks)
        sponsor.body = json.dumps(doc)
        sponsor.save(update_fields=["body"])


class Migration(migrations.Migration):

    dependencies = [
        ("sponsors", "0010_sync_sponsor_page_seed"),
    ]

    operations = [
        migrations.RunPython(convert_sponsor_promos, migrations.RunPython.noop),
    ]
