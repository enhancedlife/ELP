from django.db import migrations, models


REPLACEMENTS = (
    ("The Swole Republic Sponsors", "Your Enhanced Life Sponsors"),
    ("The Swole Republic Partners", "Your Enhanced Life Sponsors"),
    ("The Swole Republic partners", "Your Enhanced Life partners"),
)


def rebrand_partners_page(apps, schema_editor):
    PartnersPageSettings = apps.get_model("sponsors", "PartnersPageSettings")
    for row in PartnersPageSettings.objects.all():
        changed = False
        for old, new in REPLACEMENTS:
            if getattr(row, "hero_title", "") == old:
                row.hero_title = new
                changed = True
            if getattr(row, "intro_heading", "") == old:
                row.intro_heading = new
                changed = True
        if changed:
            row.save(update_fields=["hero_title", "intro_heading"])


class Migration(migrations.Migration):

    dependencies = [
        ("sponsors", "0007_rename_sponsors_sp_categor_f1b2_idx_sponsors_sp_categor_880d67_idx"),
    ]

    operations = [
        migrations.AlterField(
            model_name="partnerspagesettings",
            name="hero_title",
            field=models.CharField(default="Your Enhanced Life Sponsors", max_length=255),
        ),
        migrations.RunPython(rebrand_partners_page, migrations.RunPython.noop),
    ]
