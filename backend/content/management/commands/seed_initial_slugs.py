from django.core.management.base import BaseCommand

from content.models import LandingPage


SLUGS = [
    ("home", "Home"),
    ("faq", "FAQ"),
    ("bitcoin-tutorial", "Bitcoin Tutorial"),
    ("peptide-protocol", "Peptide Protocol"),
]


class Command(BaseCommand):
    help = "Create required LandingPage slugs for admin editing (no-op if they already exist)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Update existing rows (title/is_active) if they already exist.",
        )

    def handle(self, *args, **options):
        force = bool(options.get("force"))

        created = 0
        updated = 0

        for slug, title in SLUGS:
            obj, was_created = LandingPage.objects.get_or_create(
                slug=slug,
                defaults={
                    "title": title,
                    "content": "",
                    "sections": [],
                    "is_active": True,
                },
            )
            if was_created:
                created += 1
            elif force:
                obj.title = title
                obj.is_active = True
                if obj.content is None:
                    obj.content = ""
                if obj.sections is None:
                    obj.sections = []
                obj.save(update_fields=["title", "is_active", "content", "sections"])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"LandingPage slugs done. Created={created}, Updated={updated}"))
