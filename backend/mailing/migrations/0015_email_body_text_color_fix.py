from django.db import migrations

from mailing.layout_config import build_template_from_config, normalize_layout_config

DARK_TEXT_ON_DARK = frozenset(
    {
        "#000000",
        "#000",
        "#111111",
        "#111827",
        "#0a0c0f",
        "#0c0a0f",
        "#030712",
        "#1f2937",
    }
)


def fix_body_text_colors(apps, schema_editor):
    SystemEmailLayout = apps.get_model("mailing", "SystemEmailLayout")
    for row in SystemEmailLayout.objects.all():
        cfg = normalize_layout_config(row.layout_config or None)
        if cfg["body_text_color"].lower() in {c.lower() for c in DARK_TEXT_ON_DARK}:
            cfg["body_text_color"] = "#d1d5db"
        if cfg["title_text_color"].lower() in {c.lower() for c in DARK_TEXT_ON_DARK}:
            cfg["title_text_color"] = "#f9fafb"
        row.layout_config = cfg
        row.template_html = build_template_from_config(cfg)
        row.save(update_fields=["layout_config", "template_html"])

class Migration(migrations.Migration):

    dependencies = [
        ("mailing", "0014_email_layout_black_header_footer"),
    ]

    operations = [
        migrations.RunPython(fix_body_text_colors, migrations.RunPython.noop),
    ]
