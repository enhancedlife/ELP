"""Import article body blocks from static app/blog/<slug>/page.tsx files."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

from django.core.management.base import BaseCommand

from blog.body_utils import sync_post_card_image_fields
from blog.models import BlogPost


class Command(BaseCommand):
    help = "Parse legacy app/blog/*/page.tsx files and store block JSON on matching posts."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Replace body even when the post already has block JSON.",
        )
        parser.add_argument(
            "--regenerate",
            action="store_true",
            help="Re-run the TSX parser script before importing.",
        )

    def handle(self, *args, **options):
        root = Path(__file__).resolve().parents[4]
        data_path = root / "backend" / "blog" / "data" / "legacy_imports.json"

        if options["regenerate"]:
            script = root / "scripts" / "import-legacy-blog-posts.mts"
            self.stdout.write(f"Regenerating {data_path} from TSX files…")
            subprocess.run(
                ["npx", "tsx", str(script), "--write", str(data_path)],
                cwd=root,
                check=True,
            )

        if not data_path.is_file():
            self.stderr.write(
                self.style.ERROR(
                    f"Missing {data_path}. Run with --regenerate or: "
                    "npx tsx scripts/import-legacy-blog-posts.mts --write backend/blog/data/legacy_imports.json"
                )
            )
            return

        rows = json.loads(data_path.read_text(encoding="utf-8"))
        updated = 0
        skipped = 0

        for row in rows:
            slug = row.get("slug")
            body = (row.get("body") or "").strip()
            if not slug or not body:
                continue
            try:
                post = BlogPost.objects.get(slug=slug)
            except BlogPost.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"Skip {slug}: no DB row"))
                skipped += 1
                continue

        existing = (post.body or "").strip()
        if existing.startswith("{") and not options["force"]:
            from blog.body_utils import body_needs_legacy_import

            if not body_needs_legacy_import(post.body):
                self.stdout.write(f"Skip {slug}: already has block body")
                skipped += 1
                continue

            post.body = body
            imported_url = (row.get("image_url") or "").strip()
            if imported_url and (not (post.image_url or "").strip() or options["force"]):
                post.image_url = imported_url

            changed = ["body", "image_url"]
            sync_changed = sync_post_card_image_fields(post)
            post.save(update_fields=list(dict.fromkeys([*changed, *sync_changed])))
            self.stdout.write(self.style.SUCCESS(f"Imported {slug}"))
            updated += 1

        self.stdout.write(self.style.SUCCESS(f"Done. Updated {updated}, skipped {skipped}."))
