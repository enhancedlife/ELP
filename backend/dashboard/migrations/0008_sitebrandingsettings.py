from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dashboard", "0007_sitevisit"),
    ]

    operations = [
        migrations.CreateModel(
            name="SiteBrandingSettings",
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
                (
                    "site_name",
                    models.CharField(default="Your Enhanced Life", max_length=255),
                ),
                (
                    "logo",
                    models.ImageField(blank=True, null=True, upload_to="branding/logo/"),
                ),
                (
                    "favicon",
                    models.ImageField(
                        blank=True, null=True, upload_to="branding/favicon/"
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Site branding",
                "verbose_name_plural": "Site branding",
            },
        ),
    ]
