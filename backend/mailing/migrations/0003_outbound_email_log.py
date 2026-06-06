import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


def copy_delivery_logs(apps, schema_editor):
    OutboundEmailLog = apps.get_model("mailing", "OutboundEmailLog")
    EmailDeliveryLog = apps.get_model("mailing", "EmailDeliveryLog")
    for row in EmailDeliveryLog.objects.all().iterator(chunk_size=500):
        OutboundEmailLog.objects.create(
            source="broadcast",
            to_email=row.email,
            subject="",
            success=row.success,
            error_message=(row.error or "")[:4000],
            error_type="",
            broadcast_id=row.broadcast_id,
            meta={},
            created_at=row.created_at,
        )


class Migration(migrations.Migration):
    dependencies = [
        ("mailing", "0002_system_email_layout_and_headline"),
    ]

    operations = [
        migrations.CreateModel(
            name="OutboundEmailLog",
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
                    "source",
                    models.CharField(
                        choices=[
                            ("broadcast", "Broadcast"),
                            ("template_test", "Template test"),
                            ("password_reset", "Password reset"),
                            ("contact_form", "Contact form"),
                            ("smtp_cli", "CLI test"),
                        ],
                        db_index=True,
                        max_length=32,
                    ),
                ),
                ("to_email", models.EmailField(db_index=True, max_length=254)),
                ("subject", models.CharField(blank=True, max_length=998)),
                ("success", models.BooleanField(db_index=True)),
                ("error_message", models.TextField(blank=True)),
                ("error_type", models.CharField(blank=True, max_length=120)),
                ("meta", models.JSONField(blank=True, default=dict)),
                (
                    "created_at",
                    models.DateTimeField(
                        db_index=True, default=django.utils.timezone.now
                    ),
                ),
                (
                    "broadcast",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="outbound_logs",
                        to="mailing.emailbroadcast",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="outboundemaillog",
            index=models.Index(
                fields=["-created_at", "source"],
                name="mailing_out_created_0a1b2c_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="outboundemaillog",
            index=models.Index(
                fields=["-created_at", "success"],
                name="mailing_out_created_0d3e4f_idx",
            ),
        ),
        migrations.RunPython(copy_delivery_logs, migrations.RunPython.noop),
        migrations.DeleteModel(
            name="EmailDeliveryLog",
        ),
    ]
