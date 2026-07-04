import json
from pathlib import Path

from django.db import migrations


def _imports_path():
    return Path(__file__).resolve().parent.parent / "data" / "legacy_imports.json"


def import_legacy_bodies(apps, schema_editor):
    BlogPost = apps.get_model("blog", "BlogPost")
    path = _imports_path()
    if not path.is_file():
        return

    from blog.body_utils import body_needs_legacy_import, sync_post_card_image_fields

    rows = json.loads(path.read_text(encoding="utf-8"))
    for row in rows:
        slug = row.get("slug")
        body = (row.get("body") or "").strip()
        if not slug or not body:
            continue
        try:
            post = BlogPost.objects.get(slug=slug)
        except BlogPost.DoesNotExist:
            continue
        if not body_needs_legacy_import(post.body):
            continue
        post.body = body
        imported_url = (row.get("image_url") or "").strip()
        if imported_url and not (post.image_url or "").strip():
            post.image_url = imported_url
        changed = ["body"]
        if imported_url and post.image_url == imported_url:
            changed.append("image_url")
        sync_changed = sync_post_card_image_fields(post)
        post.save(update_fields=list(dict.fromkeys([*changed, *sync_changed])))


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0012_sync_post_hero_images"),
    ]

    operations = [
        migrations.RunPython(import_legacy_bodies, migrations.RunPython.noop),
    ]
