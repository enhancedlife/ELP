from django.db import migrations

from mailing.layout_config import build_template_from_config, normalize_layout_config

DEFAULT_LOGO_URL = "https://yourenhancedlife.com/logoYEL.png"
DEFAULT_SITE_URL = "https://yourenhancedlife.com"


def apply_header_logo(apps, schema_editor):
    SystemEmailLayout = apps.get_model("mailing", "SystemEmailLayout")
    for row in SystemEmailLayout.objects.all():
        cfg = normalize_layout_config(row.layout_config or None)
        if not cfg.get("header_logo_url", "").strip():
            cfg["header_logo_url"] = DEFAULT_LOGO_URL
        if not cfg.get("footer_site_url", "").strip():
            cfg["footer_site_url"] = DEFAULT_SITE_URL
        row.layout_config = cfg
        row.template_html = build_template_from_config(cfg)
        row.save(update_fields=["layout_config", "template_html"])


class Migration(migrations.Migration):

    dependencies = [
        ("mailing", "0010_rebrand_your_enhanced_life"),
    ]

    operations = [
        migrations.RunPython(apply_header_logo, migrations.RunPython.noop),
    ]
