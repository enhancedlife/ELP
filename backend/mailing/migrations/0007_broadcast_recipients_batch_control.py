# Generated manually for bulk mail batch control

import django.utils.timezone
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("mailing", "0006_email_outer_bg_white"),
    ]

    operations = [
        migrations.AddField(
            model_name="emailbroadcast",
            name="audience",
            field=models.CharField(
                blank=True,
                choices=[
                    ("newsletter", "Newsletter subscribers"),
                    ("all_site_users", "All site users"),
                    ("selected_site_users", "Selected site users"),
                ],
                default="newsletter",
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name="emailbroadcast",
            name="audience_user_ids",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="emailbroadcast",
            name="pending_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="emailbroadcast",
            name="skipped_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="emailbroadcast",
            name="started_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="emailbroadcast",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="emailbroadcast",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("sending", "Sending"),
                    ("paused", "Paused"),
                    ("stopped", "Stopped"),
                    ("sent", "Sent"),
                    ("failed", "Failed"),
                ],
                db_index=True,
                default="draft",
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name="EmailBroadcastRecipient",
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
                ("email", models.EmailField(db_index=True, max_length=254)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("sent", "Sent"),
                            ("failed", "Failed"),
                            ("skipped", "Skipped"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=16,
                    ),
                ),
                ("error_message", models.TextField(blank=True)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("meta", models.JSONField(blank=True, default=dict)),
                (
                    "created_at",
                    models.DateTimeField(default=django.utils.timezone.now),
                ),
                (
                    "broadcast",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recipients",
                        to="mailing.emailbroadcast",
                    ),
                ),
            ],
            options={
                "ordering": ["id"],
                "indexes": [
                    models.Index(
                        fields=["broadcast", "status"],
                        name="mailing_emai_broadca_8a3f2d_idx",
                    ),
                ],
            },
        ),
    ]
