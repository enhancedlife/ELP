from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("mailing", "0008_broadcast_audience_emails"),
    ]

    operations = [
        migrations.CreateModel(
            name="SmtpProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(help_text="Label shown in the admin UI.", max_length=128)),
                ("host", models.CharField(max_length=255)),
                ("port", models.PositiveIntegerField(default=587)),
                ("username", models.CharField(blank=True, default="", max_length=255)),
                ("password", models.CharField(blank=True, default="", max_length=255)),
                ("use_tls", models.BooleanField(default=True)),
                ("use_ssl", models.BooleanField(default=False)),
                ("from_email", models.EmailField(max_length=254)),
                (
                    "is_enabled",
                    models.BooleanField(
                        default=True,
                        help_text="Disabled profiles cannot be selected for sending.",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=False,
                        help_text="The active profile is used for all outbound mail.",
                    ),
                ),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-is_active", "name"],
            },
        ),
    ]
