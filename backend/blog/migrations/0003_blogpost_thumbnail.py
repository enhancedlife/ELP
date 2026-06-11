from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0002_seed_featured_posts"),
    ]

    operations = [
        migrations.AddField(
            model_name="blogpost",
            name="thumbnail",
            field=models.ImageField(
                blank=True,
                help_text="Uploaded card image; overrides image_url on the public site when set.",
                null=True,
                upload_to="blog/thumbnails/%Y/%m/",
            ),
        ),
    ]
