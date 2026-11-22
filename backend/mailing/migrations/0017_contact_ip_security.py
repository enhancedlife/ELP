from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mailing", "0016_email_pure_black_header_footer"),
    ]

    operations = [
        migrations.CreateModel(
            name="SecuritySetting",
            fields=[
                ("key", models.CharField(max_length=100, primary_key=True, serialize=False)),
                ("value", models.TextField(blank=True)),
                ("label", models.CharField(blank=True, max_length=200)),
                ("group", models.CharField(blank=True, max_length=64)),
            ],
            options={
                "ordering": ["key"],
            },
        ),
        migrations.CreateModel(
            name="ContactIpBlock",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ip_address", models.CharField(max_length=45, unique=True)),
                ("rejected_count", models.PositiveSmallIntegerField(default=0)),
                ("blocked_at", models.DateTimeField(blank=True, null=True)),
                ("block_expires_at", models.DateTimeField(blank=True, null=True)),
                ("cloudflare_rule_id", models.CharField(blank=True, max_length=64, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-blocked_at"],
            },
        ),
    ]
