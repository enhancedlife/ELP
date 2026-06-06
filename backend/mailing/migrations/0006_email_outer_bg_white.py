from django.db import migrations

from mailing.layout_config import build_template_from_config, normalize_layout_config


def set_outer_bg_white(apps, schema_editor):
    SystemEmailLayout = apps.get_model("mailing", "SystemEmailLayout")
    for row in SystemEmailLayout.objects.all():
        cfg = normalize_layout_config(row.layout_config or None)
        cfg["outer_bg_color"] = "#ffffff"
        row.layout_config = cfg
        row.template_html = build_template_from_config(cfg)
        row.save(update_fields=["layout_config", "template_html"])


class Migration(migrations.Migration):
    dependencies = [
        ("mailing", "0005_system_email_layout_config"),
    ]

    operations = [
        migrations.RunPython(set_outer_bg_white, migrations.RunPython.noop),
    ]
