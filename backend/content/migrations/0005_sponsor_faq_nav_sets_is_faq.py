# Generated manually — fix rows where faq_nav_group=sponsors but is_faq was left False.

from django.db import migrations


def forwards(apps, schema_editor):
    LandingPage = apps.get_model("content", "LandingPage")
    LandingPage.objects.filter(faq_nav_group__iexact="sponsors", is_faq=False).update(
        is_faq=True
    )


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0004_landingpage_faq_nav_group_landingpage_faq_nav_label_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
