from django.db import migrations, models


def seed_layout(apps, schema_editor):
    SystemEmailLayout = apps.get_model("mailing", "SystemEmailLayout")
    if SystemEmailLayout.objects.exists():
        return
    from mailing.default_layout import DEFAULT_SYSTEM_EMAIL_TEMPLATE

    SystemEmailLayout.objects.create(template_html=DEFAULT_SYSTEM_EMAIL_TEMPLATE)


class Migration(migrations.Migration):
    dependencies = [
        ("mailing", "0001_faq_and_newsletter"),
    ]

    operations = [
        migrations.CreateModel(
            name="SystemEmailLayout",
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
                ("template_html", models.TextField()),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "System email layout",
            },
        ),
        migrations.AddField(
            model_name="emailbroadcast",
            name="headline",
            field=models.CharField(
                blank=True,
                help_text="Main heading inside the HTML template ({{email_title}}). Defaults to subject if empty.",
                max_length=500,
            ),
        ),
        migrations.RunPython(seed_layout, migrations.RunPython.noop),
    ]
