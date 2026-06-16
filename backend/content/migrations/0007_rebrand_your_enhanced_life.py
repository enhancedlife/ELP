from django.db import migrations


def rebrand_home_landing_title(apps, schema_editor):
    LandingPage = apps.get_model("content", "LandingPage")
    LandingPage.objects.filter(title="The Swole Republic").update(title="Your Enhanced Life")
    LandingPage.objects.filter(meta_title="The Swole Republic").update(meta_title="Your Enhanced Life")


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0006_backfill_faq_nav_sponsors_slug_dash_faq"),
    ]

    operations = [
        migrations.RunPython(rebrand_home_landing_title, migrations.RunPython.noop),
    ]
