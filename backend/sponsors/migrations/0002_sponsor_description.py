from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sponsors", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="sponsor",
            name="description",
            field=models.TextField(blank=True),
        ),
    ]

