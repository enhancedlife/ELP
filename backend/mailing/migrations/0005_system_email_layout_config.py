from django.db import migrations, models

from mailing.layout_config import (
    DEFAULT_EMAIL_LAYOUT_CONFIG,
    build_template_from_config,
)


def seed_layout_config(apps, schema_editor):
    SystemEmailLayout = apps.get_model("mailing", "SystemEmailLayout")
    for row in SystemEmailLayout.objects.all():
        if row.layout_config:
            continue
        row.layout_config = DEFAULT_EMAIL_LAYOUT_CONFIG
        row.template_html = build_template_from_config(DEFAULT_EMAIL_LAYOUT_CONFIG)
        row.save(update_fields=["layout_config", "template_html"])


class Migration(migrations.Migration):
    dependencies = [
        ("mailing", "0004_rename_mailing_out_created_0a1b2c_idx_mailing_out_created_6f5d79_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="systememaillayout",
            name="layout_config",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.RunPython(seed_layout_config, migrations.RunPython.noop),
    ]
