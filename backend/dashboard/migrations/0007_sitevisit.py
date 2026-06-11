from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("dashboard", "0006_memberprofile_deleted_at"),
    ]

    operations = [
        migrations.CreateModel(
            name="SiteVisit",
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
                ("path", models.CharField(db_index=True, max_length=512)),
                (
                    "visited_at",
                    models.DateTimeField(
                        db_index=True, default=django.utils.timezone.now
                    ),
                ),
            ],
            options={
                "ordering": ["-visited_at"],
                "indexes": [
                    models.Index(fields=["visited_at"], name="dashboard_s_visited_6e0f0d_idx"),
                ],
            },
        ),
    ]
