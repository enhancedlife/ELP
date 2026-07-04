from django.db import migrations


def sync_all_post_heroes(apps, schema_editor):
    BlogPost = apps.get_model("blog", "BlogPost")
    from blog.body_utils import sync_post_card_image_fields

    for post in BlogPost.objects.all().iterator():
        changed = sync_post_card_image_fields(post)
        if changed:
            post.save(update_fields=changed)


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0005_blogpost_is_public"),
    ]

    operations = [
        migrations.RunPython(sync_all_post_heroes, migrations.RunPython.noop),
    ]
