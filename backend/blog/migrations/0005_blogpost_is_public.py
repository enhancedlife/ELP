from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0004_blogcomment"),
    ]

    operations = [
        migrations.AddField(
            model_name="blogpost",
            name="is_public",
            field=models.BooleanField(
                default=False,
                help_text="When true, anyone can read the full post and comments without signing in.",
            ),
        ),
    ]
