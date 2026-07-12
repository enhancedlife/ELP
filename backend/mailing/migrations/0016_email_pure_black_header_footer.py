from django.db import migrations

from mailing.layout_config import (
    EMAIL_HEADER_FOOTER_BG,
    build_template_from_config,
    normalize_layout_config,
)


def force_pure_black_header_footer(apps, schema_editor):
    SystemEmailLayout = apps.get_model("mailing", "SystemEmailLayout")
    for row in SystemEmailLayout.objects.all():
        cfg = normalize_layout_config(row.layout_config or None)
        cfg["header_bg_color"] = EMAIL_HEADER_FOOTER_BG
        cfg["footer_bg_color"] = EMAIL_HEADER_FOOTER_BG
        row.layout_config = cfg
        row.template_html = build_template_from_config(cfg)
        row.save(update_fields=["layout_config", "template_html"])


class Migration(migrations.Migration):

    dependencies = [
        ("mailing", "0015_email_body_text_color_fix"),
    ]

    operations = [
        migrations.RunPython(force_pure_black_header_footer, migrations.RunPython.noop),
    ]
