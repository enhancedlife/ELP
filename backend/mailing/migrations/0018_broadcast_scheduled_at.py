from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mailing", "0017_contact_ip_security"),
    ]

    operations = [
        migrations.AddField(
            model_name="emailbroadcast",
            name="scheduled_at",
            field=models.DateTimeField(
                blank=True,
                help_text="When a delayed send should start. Empty means send as soon as it is started.",
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="emailbroadcast",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("scheduled", "Scheduled"),
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
    ]
