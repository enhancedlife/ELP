# Sponsor block bodies + seed Great Life Pharma; reset sparse sponsor rows.

import json

from django.db import migrations, models


BLOG_BLOCKS_FORMAT = "blog-blocks-v1"

GREAT_LIFE_BODY = {
    "format": BLOG_BLOCKS_FORMAT,
    "blocks": [
        {
            "id": "gl_intro",
            "type": "paragraph",
            "text": (
                "Premium peptides, wellness products, recovery support, and performance-focused "
                "solutions. Great Life Pharma is our trusted source for high-quality research compounds."
            ),
        },
        {
            "id": "gl_features",
            "type": "three_column",
            "columns": [
                {
                    "title": "Quality Tested",
                    "titleColor": "green",
                    "body": "Third-party testing on all products for purity and potency",
                },
                {
                    "title": "Fast Shipping",
                    "titleColor": "green",
                    "body": "Quick domestic shipping with discreet packaging",
                },
                {
                    "title": "Customer Support",
                    "titleColor": "green",
                    "body": "Responsive support team to answer your questions",
                },
            ],
        },
        {
            "id": "gl_promo_list",
            "type": "promo_list",
            "boxLabel": "Exclusive Community Codes",
            "items": [
                {
                    "title": "FREETEST",
                    "titleColor": "orange",
                    "detail": "Orders over $450 receive 2 free Testosterone Cypionate 250mg/ml",
                },
                {
                    "title": "GLSAVINGS10",
                    "titleColor": "orange",
                    "detail": "Orders over $250 get 10% off",
                },
                {
                    "title": "GREATLIFE50",
                    "titleColor": "orange",
                    "detail": "Save $50 on your order (one-time use per customer)",
                },
            ],
        },
    ],
}

SPONSORS_PAGE_BODY = {
    "format": BLOG_BLOCKS_FORMAT,
    "blocks": [
        {
            "id": "pg_standards_h",
            "type": "heading2",
            "text": "Our Sponsor Standards",
        },
        {
            "id": "pg_standards_a",
            "type": "two_column",
            "columns": [
                {
                    "title": "Quality First",
                    "titleColor": "green",
                    "body": (
                        "We only partner with companies that prioritize product quality, "
                        "testing, and transparency in their manufacturing processes."
                    ),
                },
                {
                    "title": "Community Aligned",
                    "titleColor": "green",
                    "body": (
                        "Our sponsors understand and support the performance optimization "
                        "community. They share our values around education and harm reduction."
                    ),
                },
            ],
        },
        {
            "id": "pg_standards_b",
            "type": "two_column",
            "columns": [
                {
                    "title": "Verified by Use",
                    "titleColor": "green",
                    "body": (
                        "We personally use and verify products before recommending them. "
                        "Our reputation depends on honest recommendations."
                    ),
                },
                {
                    "title": "Customer Service",
                    "titleColor": "green",
                    "body": (
                        "We value sponsors who take care of their customers with responsive "
                        "support, fair policies, and reliable delivery."
                    ),
                },
            ],
        },
        {
            "id": "pg_become_h",
            "type": "heading2",
            "text": "Become A Sponsor",
        },
        {
            "id": "pg_become_p",
            "type": "paragraph",
            "text": (
                "Interested in partnering with Your Enhanced Life? We are always looking "
                "for quality companies that align with our community values and can provide "
                "value to our audience."
            ),
        },
        {
            "id": "pg_become_h3",
            "type": "heading3",
            "text": "What We Look For:",
            "color": "green",
        },
        {
            "id": "pg_become_list",
            "type": "bullet_list",
            "items": [
                "High-quality products with third-party testing",
                "Excellent customer service reputation",
                "Alignment with our educational mission",
                "Exclusive offers for our community",
            ],
        },
        {
            "id": "pg_become_cta",
            "type": "cta_link",
            "label": "Contact Us About Sponsorship",
            "href": "/contact",
            "variant": "outline",
        },
        {
            "id": "pg_disclosure",
            "type": "disclaimer",
            "title": "Sponsorship Disclosure",
            "text": (
                "Your Enhanced Life receives compensation from sponsors. However, we only "
                "partner with companies we genuinely trust and would use ourselves. Our "
                "editorial content remains independent of sponsor influence."
            ),
        },
    ],
}


def seed_sponsors(apps, schema_editor):
    Sponsor = apps.get_model("sponsors", "Sponsor")
    PartnersPageSettings = apps.get_model("sponsors", "PartnersPageSettings")

    Sponsor.objects.all().delete()

    Sponsor.objects.create(
        name="Great Life Pharma",
        website_url="https://greatlifepharma.com",
        logo_url="",
        description="",
        body=json.dumps(GREAT_LIFE_BODY),
        is_featured=True,
        cta_label="Visit Great Life Pharma",
        category="Featured",
        is_active=True,
        sort_order=0,
    )

    PartnersPageSettings.objects.update_or_create(
        pk=1,
        defaults={
            "banner_kicker": "",
            "hero_title": "Trusted Sponsors",
            "hero_lead": (
                "Companies we trust and recommend to the Your Enhanced Life community."
            ),
            "intro_heading": "",
            "intro_body": "",
            "pillars": [],
            "link_primary_label": "",
            "link_primary_url": "",
            "link_secondary_label": "",
            "link_secondary_url": "",
            "page_body": json.dumps(SPONSORS_PAGE_BODY),
        },
    )


def unseed_sponsors(apps, schema_editor):
    Sponsor = apps.get_model("sponsors", "Sponsor")
    PartnersPageSettings = apps.get_model("sponsors", "PartnersPageSettings")
    Sponsor.objects.filter(name="Great Life Pharma").delete()
    PartnersPageSettings.objects.filter(pk=1).update(page_body="")


class Migration(migrations.Migration):

    dependencies = [
        ("sponsors", "0008_rebrand_your_enhanced_life"),
    ]

    operations = [
        migrations.AddField(
            model_name="sponsor",
            name="body",
            field=models.TextField(
                blank=True,
                help_text="Block JSON (blog-blocks-v1) for rich sponsor layout on the public page.",
            ),
        ),
        migrations.AddField(
            model_name="sponsor",
            name="cta_label",
            field=models.CharField(
                blank=True,
                help_text='Button label, e.g. "Visit Great Life Pharma". Defaults to "Visit sponsor".',
                max_length=120,
            ),
        ),
        migrations.AddField(
            model_name="sponsor",
            name="is_featured",
            field=models.BooleanField(
                default=False,
                help_text="Featured sponsors render in the large hero card on /sponsors and the homepage.",
            ),
        ),
        migrations.AddField(
            model_name="partnerspagesettings",
            name="page_body",
            field=models.TextField(
                blank=True,
                help_text="Block JSON for page sections below sponsors (standards, disclosure, etc.).",
            ),
        ),
        migrations.RunPython(seed_sponsors, unseed_sponsors),
    ]
