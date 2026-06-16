from django.db import migrations

from mailing.layout_config import build_template_from_config, normalize_layout_config


def strip_footer_links(apps, schema_editor):
    SystemEmailLayout = apps.get_model("mailing", "SystemEmailLayout")
    for row in SystemEmailLayout.objects.all():
        cfg = normalize_layout_config(row.layout_config or None)
        cfg["footer_site_url"] = ""
        row.layout_config = cfg
        row.template_html = build_template_from_config(cfg)
        row.save(update_fields=["layout_config", "template_html"])


class Migration(migrations.Migration):

    dependencies = [
        ("mailing", "0011_email_header_logo_only"),
    ]

    operations = [
        migrations.RunPython(strip_footer_links, migrations.RunPython.noop),
    ]
