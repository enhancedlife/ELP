from django.db import migrations

from mailing.layout_config import build_template_from_config, normalize_layout_config


def rebrand_email_layout(apps, schema_editor):
    SystemEmailLayout = apps.get_model("mailing", "SystemEmailLayout")
    for row in SystemEmailLayout.objects.all():
        cfg = normalize_layout_config(row.layout_config or None)
        changed = False
        for key in ("header_heading", "footer_copyright", "footer_disclaimer"):
            val = cfg.get(key, "")
            if "Swole Republic" in val or "theswolerepublic" in val.lower():
                cfg[key] = val.replace("The Swole Republic", "Your Enhanced Life").replace(
                    "theswolerepublic.com", "yourenhancedlife.com"
                )
                changed = True
        if cfg.get("header_heading") in ("", "The Swole Republic"):
            cfg["header_heading"] = "Your Enhanced Life"
            changed = True
        if "Swole Republic" in (row.template_html or ""):
            changed = True
        if changed:
            row.layout_config = cfg
            row.template_html = build_template_from_config(cfg)
            row.save(update_fields=["layout_config", "template_html"])


class Migration(migrations.Migration):

    dependencies = [
        ("mailing", "0009_smtpprofile"),
    ]

    operations = [
        migrations.RunPython(rebrand_email_layout, migrations.RunPython.noop),
    ]
