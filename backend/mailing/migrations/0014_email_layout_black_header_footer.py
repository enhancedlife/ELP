from django.db import migrations

from mailing.layout_config import build_template_from_config, normalize_layout_config

OLD_HEADER_FOOTER = frozenset({"#0a0c0f", "#0A0C0F"})


def refresh_email_layout(apps, schema_editor):
    SystemEmailLayout = apps.get_model("mailing", "SystemEmailLayout")
    for row in SystemEmailLayout.objects.all():
        cfg = normalize_layout_config(row.layout_config or None)
        if cfg["header_bg_color"].lower() in {c.lower() for c in OLD_HEADER_FOOTER}:
            cfg["header_bg_color"] = "#000000"
        if cfg["footer_bg_color"].lower() in {c.lower() for c in OLD_HEADER_FOOTER}:
            cfg["footer_bg_color"] = "#000000"
        row.layout_config = cfg
        row.template_html = build_template_from_config(cfg)
        row.save(update_fields=["layout_config", "template_html"])


class Migration(migrations.Migration):

    dependencies = [
        ("mailing", "0013_broadcast_batch_throttle"),
    ]

    operations = [
        migrations.RunPython(refresh_email_layout, migrations.RunPython.noop),
    ]
