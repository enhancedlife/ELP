# Banner kicker + hero title: Partners → Sponsors for public /sponsors hero.

from django.db import migrations, models


def apply_sponsors_branding(apps, schema_editor):
    PartnersPageSettings = apps.get_model("sponsors", "PartnersPageSettings")
    row = PartnersPageSettings.objects.filter(pk=1).first()
    if not row:
        return
    updates = {}
    k = (row.banner_kicker or "").strip().upper()
    if k in ("", "PARTNERS"):
        updates["banner_kicker"] = "SPONSORS"
    title = row.hero_title or ""
    if "Partners" in title:
        updates["hero_title"] = title.replace("Partners", "Sponsors").replace(
            "partners", "sponsors"
        )
    if updates:
        PartnersPageSettings.objects.filter(pk=1).update(**updates)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("sponsors", "0005_align_model_help_text"),
    ]

    operations = [
        migrations.RunPython(apply_sponsors_branding, noop_reverse),
        migrations.AlterField(
            model_name="partnerspagesettings",
            name="banner_kicker",
            field=models.CharField(
                blank=True,
                default="SPONSORS",
                help_text="Small uppercase line above the hero title on the banner.",
                max_length=120,
            ),
        ),
        migrations.AlterField(
            model_name="partnerspagesettings",
            name="hero_title",
            field=models.CharField(
                default="The Swole Republic Sponsors",
                max_length=255,
            ),
        ),
    ]
