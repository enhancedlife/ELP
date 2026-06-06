# Partners page settings + sponsor category (Mind Pump–style /partners layout).

from django.db import migrations, models


DEFAULT_PILLARS = [
    {
        "title": "Why partner with us?",
        "body": (
            "We only work with brands that share our values—education first, "
            "integrity, and products we’d use ourselves."
        ),
        "icon": "handshake",
    },
    {
        "title": "Build your business",
        "body": (
            "New readers and listeners discover this community every day—"
            "a strong fit for brands that earn trust."
        ),
        "icon": "layers",
    },
    {
        "title": "Unlock new opportunities",
        "body": (
            "Reach people who care about training, health, and doing things the right way."
        ),
        "icon": "sparkles",
    },
]


def seed_partners_page(apps, schema_editor):
    PartnersPageSettings = apps.get_model("sponsors", "PartnersPageSettings")
    if PartnersPageSettings.objects.filter(pk=1).exists():
        return
    PartnersPageSettings.objects.create(
        pk=1,
        banner_image_url="",
        banner_kicker="PARTNERS",
        hero_title="The Swole Republic Partners",
        hero_lead=(
            "Brands we stand behind—resources to help you pursue your training and health goals."
        ),
        intro_heading="The Swole Republic partners",
        intro_body=(
            "Our partners offer something that can help you move forward. "
            "We only highlight brands we believe in and that we think you’ll benefit from."
        ),
        pillars=DEFAULT_PILLARS,
        link_primary_label="",
        link_primary_url="",
        link_secondary_label="",
        link_secondary_url="",
    )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("sponsors", "0003_soft_delete"),
    ]

    operations = [
        migrations.CreateModel(
            name="PartnersPageSettings",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("banner_image_url", models.URLField(blank=True, max_length=1024)),
                (
                    "banner_kicker",
                    models.CharField(
                        blank=True,
                        default="PARTNERS",
                        help_text="Small uppercase line above the hero title on the banner.",
                        max_length=120,
                    ),
                ),
                (
                    "hero_title",
                    models.CharField(
                        default="The Swole Republic Partners", max_length=255
                    ),
                ),
                (
                    "hero_lead",
                    models.TextField(
                        blank=True,
                        help_text="Subtitle under the hero title (on the banner).",
                    ),
                ),
                ("intro_heading", models.CharField(blank=True, max_length=255)),
                ("intro_body", models.TextField(blank=True)),
                (
                    "pillars",
                    models.JSONField(
                        default=list,
                        help_text='List of {"title", "body", "icon"} objects.',
                    ),
                ),
                ("link_primary_label", models.CharField(blank=True, max_length=120)),
                ("link_primary_url", models.URLField(blank=True, max_length=1024)),
                ("link_secondary_label", models.CharField(blank=True, max_length=120)),
                ("link_secondary_url", models.URLField(blank=True, max_length=1024)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Partners page settings",
                "verbose_name_plural": "Partners page settings",
            },
        ),
        migrations.AddField(
            model_name="sponsor",
            name="category",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text='Section heading on the public page, e.g. "Supplements & health".',
                max_length=255,
            ),
        ),
        migrations.AddIndex(
            model_name="sponsor",
            index=models.Index(
                fields=["category", "sort_order"],
                name="sponsors_sp_categor_f1b2_idx",
            ),
        ),
        migrations.RunPython(seed_partners_page, noop_reverse),
    ]
