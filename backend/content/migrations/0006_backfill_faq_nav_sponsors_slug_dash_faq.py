# Backfill faq_nav_group for pages whose slug ends with -faq (see _sponsor_faq_header_filter).

from django.db import migrations


def forwards(apps, schema_editor):
    LandingPage = apps.get_model("content", "LandingPage")
    qs = (
        LandingPage.objects.filter(is_faq=True, faq_nav_group="")
        .filter(slug__iendswith="-faq")
        .exclude(slug__iexact="faq")
    )
    qs.update(faq_nav_group="sponsors")


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0005_sponsor_faq_nav_sets_is_faq"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
