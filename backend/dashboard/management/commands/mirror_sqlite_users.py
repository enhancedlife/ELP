"""
Copy auth users (and related rows) from backend/db.sqlite3 into the default database (e.g. MySQL).

Use when a large import (e.g. import_wordpress_users) ran while Django was on SQLite, then you
switched DB_NAME to MySQL — the new rows stayed in db.sqlite3.

  python manage.py mirror_sqlite_users --dry-run
  python manage.py mirror_sqlite_users --wipe-target-users
"""

from __future__ import annotations

from pathlib import Path

from django.conf import settings
from django.contrib.admin.models import LogEntry
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.core.management.base import BaseCommand, CommandError
from django.db import connections, transaction
from dashboard.models import (
    DashboardMessage,
    DashboardNotification,
    MemberProfile,
)

User = get_user_model()

SQLITE_ALIAS = "sqlite_source"


def _register_sqlite_alias(sqlite_path: Path) -> None:
    if not sqlite_path.is_file():
        raise CommandError(f"SQLite file not found: {sqlite_path}")
    base = {k: v for k, v in settings.DATABASES["default"].items()}
    base["ENGINE"] = "django.db.backends.sqlite3"
    base["NAME"] = str(sqlite_path.resolve())
    settings.DATABASES[SQLITE_ALIAS] = base
    connections.close_all()


class Command(BaseCommand):
    help = (
        "Copy users, member profiles, and auth tokens from a SQLite db into the default DB. "
        "Use --wipe-target-users to remove existing users on MySQL before copy (see warning)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--sqlite",
            dest="sqlite_path",
            default=None,
            help="Path to db.sqlite3 (default: BASE_DIR / db.sqlite3)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show counts only; do not write to the default database.",
        )
        parser.add_argument(
            "--wipe-target-users",
            action="store_true",
            help=(
                "DELETE all users (and dependent rows) on the default database before copying. "
                "Required when MySQL already has users with conflicting primary keys. "
                "You will need to run createsuperuser again for staff access."
            ),
        )
        parser.add_argument(
            "--skip-m2m",
            action="store_true",
            help="Do not copy auth groups / user_permissions (avoids FK errors if auth_group differs).",
        )

    def handle(self, *args, **options):
        sqlite_path = Path(
            options["sqlite_path"] or (settings.BASE_DIR / "db.sqlite3")
        ).expanduser()
        dry_run = options["dry_run"]
        wipe = options["wipe_target_users"]
        skip_m2m = options["skip_m2m"]

        if settings.DATABASES["default"]["ENGINE"].endswith("sqlite3"):
            raise CommandError(
                "Default database is SQLite. Set DB_NAME in backend/.env to use MySQL first, "
                "then run this command to copy from db.sqlite3."
            )

        _register_sqlite_alias(sqlite_path)

        src_count = User.objects.using(SQLITE_ALIAS).count()
        dst_count_before = User.objects.count()
        prof_src = MemberProfile.objects.using(SQLITE_ALIAS).count()

        self.stdout.write(
            f"SQLite ({sqlite_path.name}): {src_count} users, {prof_src} member profiles."
        )
        self.stdout.write(f"Default DB: {dst_count_before} users (before).")

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run — no changes made."))
            return

        if src_count == 0:
            raise CommandError("No users in SQLite; nothing to copy.")

        if not wipe and dst_count_before > 0:
            self.stdout.write(
                self.style.WARNING(
                    "Default DB already has users. Any matching primary keys will be skipped, so you "
                    "may not get a full copy. For a full mirror from SQLite, stop and re-run with "
                    "--wipe-target-users (back up MySQL first)."
                )
            )

        with transaction.atomic():
            if wipe:
                self.stdout.write(
                    self.style.WARNING(
                        "Wiping all users and related rows on default database…"
                    )
                )
                try:
                    from rest_framework.authtoken.models import Token

                    Token.objects.all().delete()
                except Exception:  # noqa: BLE001
                    pass
                LogEntry.objects.all().delete()
                Session.objects.all().delete()
                DashboardMessage.objects.all().update(author_user=None)
                DashboardNotification.objects.all().update(recipient=None)
                MemberProfile.objects.all().delete()
                User.objects.all().delete()

            created = 0
            updated_m2m = 0
            for u in (
                User.objects.using(SQLITE_ALIAS)
                .order_by("pk")
                .iterator(chunk_size=500)
            ):
                if User.objects.filter(pk=u.pk).exists():
                    continue
                nu = User(
                    pk=u.pk,
                    password=u.password,
                    last_login=u.last_login,
                    is_superuser=u.is_superuser,
                    username=u.username,
                    first_name=u.first_name,
                    last_name=u.last_name,
                    email=u.email,
                    is_staff=u.is_staff,
                    is_active=u.is_active,
                    date_joined=u.date_joined,
                )
                nu.save(using="default", force_insert=True)
                created += 1

                if not skip_m2m:
                    src_full = (
                        User.objects.using(SQLITE_ALIAS)
                        .prefetch_related("groups", "user_permissions")
                        .get(pk=u.pk)
                    )
                    dest = User.objects.get(pk=u.pk)
                    try:
                        dest.groups.set(src_full.groups.all())
                        dest.user_permissions.set(src_full.user_permissions.all())
                        updated_m2m += 1
                    except Exception as exc:  # noqa: BLE001
                        self.stdout.write(
                            self.style.WARNING(
                                f"Skipping M2M for pk={u.pk} ({exc}); use --skip-m2m if this persists."
                            )
                        )

            profiles = 0
            for p in (
                MemberProfile.objects.using(SQLITE_ALIAS)
                .select_related("user")
                .iterator(chunk_size=500)
            ):
                if not User.objects.filter(pk=p.user_id).exists():
                    continue
                MemberProfile.objects.update_or_create(
                    user_id=p.user_id,
                    defaults={"billing": p.billing, "shipping": p.shipping},
                )
                profiles += 1

            tokens = 0
            try:
                from rest_framework.authtoken.models import Token

                for t in Token.objects.using(SQLITE_ALIAS).iterator():
                    if not User.objects.filter(pk=t.user_id).exists():
                        continue
                    Token.objects.update_or_create(
                        user_id=t.user_id, defaults={"key": t.key}
                    )
                    tokens += 1
            except Exception:  # noqa: BLE001
                pass

        self._fix_mysql_autoincrement()

        dst_after = User.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Users inserted: {created}. Member profiles synced: {profiles}. "
                f"API tokens synced: {tokens}. M2M rows updated for {updated_m2m} users. "
                f"Default DB users now: {dst_after}."
            )
        )
        if wipe:
            self.stdout.write(
                self.style.WARNING(
                    "You wiped all users on the target DB. Create staff with: "
                    "python manage.py createsuperuser"
                )
            )

    def _fix_mysql_autoincrement(self) -> None:
        engine = settings.DATABASES["default"]["ENGINE"]
        if "mysql" not in engine:
            return
        with connections["default"].cursor() as cursor:
            cursor.execute("SELECT COALESCE(MAX(id), 0) FROM auth_user")
            max_id = cursor.fetchone()[0] or 0
            cursor.execute(
                "ALTER TABLE auth_user AUTO_INCREMENT = %s", [max_id + 1]
            )
