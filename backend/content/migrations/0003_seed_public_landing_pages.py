# Placeholder landing pages so the public site has content before CMS data exists.

from django.db import migrations


def seed_pages(apps, schema_editor):
    LandingPage = apps.get_model("content", "LandingPage")
    pages = [
        {
            "slug": "home",
            "title": "The Swole Republic",
            "content": (
                "<p>Welcome. This is placeholder copy until you publish real content "
                "from the admin dashboard.</p>"
            ),
            "is_faq": False,
            "sort_order": 0,
        },
        {
            "slug": "faq",
            "title": "FAQ",
            "content": (
                "<p>Frequently asked questions will appear here. Add FAQ entries "
                "from the dashboard.</p>"
            ),
            "is_faq": True,
            "sort_order": 10,
        },
        {
            "slug": "peptide-protocol",
            "title": "Peptide protocol",
            "content": "<p>Protocol content is managed in the dashboard.</p>",
            "is_faq": False,
            "sort_order": 20,
        },
        {
            "slug": "bitcoin-tutorial",
            "title": "Bitcoin tutorial",
            "content": "<p>Tutorial content is managed in the dashboard.</p>",
            "is_faq": False,
            "sort_order": 30,
        },
    ]
    for row in pages:
        slug = row["slug"]
        LandingPage.objects.get_or_create(
            slug=slug,
            defaults={k: v for k, v in row.items() if k != "slug"},
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0002_faq_and_newsletter"),
    ]

    operations = [
        migrations.RunPython(seed_pages, noop_reverse),
    ]
