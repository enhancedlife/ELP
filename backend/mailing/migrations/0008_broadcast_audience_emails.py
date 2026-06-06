from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mailing", "0007_broadcast_recipients_batch_control"),
    ]

    operations = [
        migrations.AddField(
            model_name="emailbroadcast",
            name="audience_emails",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name="emailbroadcast",
            name="audience",
            field=models.CharField(
                blank=True,
                choices=[
                    ("newsletter", "Newsletter subscribers"),
                    ("all_site_users", "All site users"),
                    ("selected_site_users", "Selected site users"),
                    ("manual_emails", "Manual email list"),
                ],
                default="newsletter",
                max_length=32,
            ),
        ),
    ]
