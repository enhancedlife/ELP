# Sync Great Life sponsor body + partners page_body with current dashboard content.
# Safe to run on environments that already applied 0009 with the older seed.

import importlib.util
import json
from pathlib import Path

from django.db import migrations


def _load_seed_from_0009():
    seed_path = Path(__file__).resolve().parent / "0009_sponsor_body_blocks_seed_great_life.py"
    spec = importlib.util.spec_from_file_location("sponsors_seed_0009", seed_path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod.GREAT_LIFE_BODY, mod.SPONSORS_PAGE_BODY


def sync_sponsor_seed(apps, schema_editor):
    great_life_body, page_body = _load_seed_from_0009()

    Sponsor = apps.get_model("sponsors", "Sponsor")
    PartnersPageSettings = apps.get_model("sponsors", "PartnersPageSettings")

    Sponsor.objects.filter(name="Great Life Pharma").update(
        body=json.dumps(great_life_body),
        cta_label="Visit Great Life Pharma",
        is_featured=True,
        website_url="https://greatlifepharma.com",
        category="Featured",
        is_active=True,
        sort_order=0,
    )

    PartnersPageSettings.objects.filter(pk=1).update(
        page_body=json.dumps(page_body),
        hero_title="Trusted Sponsors",
        hero_lead=(
            "Companies we trust and recommend to the Your Enhanced Life community."
        ),
    )


class Migration(migrations.Migration):

    dependencies = [
        ("sponsors", "0009_sponsor_body_blocks_seed_great_life"),
    ]

    operations = [
        migrations.RunPython(sync_sponsor_seed, migrations.RunPython.noop),
    ]
