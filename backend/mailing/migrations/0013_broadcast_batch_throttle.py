# Bulk mail: emails-per-wave and minutes-between-waves throttling

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mailing", "0012_email_footer_text_only"),
    ]

    operations = [
        migrations.AddField(
            model_name="emailbroadcast",
            name="batch_email_count",
            field=models.PositiveIntegerField(
                default=20,
                help_text="How many emails to send per wave before waiting for the interval.",
            ),
        ),
        migrations.AddField(
            model_name="emailbroadcast",
            name="batch_interval_minutes",
            field=models.PositiveIntegerField(
                default=5,
                help_text="Minutes to wait between waves (0 = send next wave as soon as processing runs).",
            ),
        ),
        migrations.AddField(
            model_name="emailbroadcast",
            name="last_batch_at",
            field=models.DateTimeField(
                blank=True,
                help_text="When the most recent wave finished; used to schedule the next wave.",
                null=True,
            ),
        ),
    ]
