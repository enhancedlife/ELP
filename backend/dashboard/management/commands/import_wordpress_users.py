import csv
import re
from datetime import datetime, timezone as dt_timezone
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from dashboard.models import MemberProfile

User = get_user_model()

# WordPress roles treated as portal customers (not staff).
DEFAULT_IMPORT_ROLES = frozenset({"customer", "subscriber"})

# Never import these as plain members (staff-capable or full admin).
SKIP_ROLES = frozenset(
    {
        "administrator",
        "shop_manager",
        "editor",
        "author",
        "contributor",
    }
)

_WOO_SUFFIXES = (
    "first_name",
    "last_name",
    "company",
    "email",
    "phone",
    "address_1",
    "address_2",
    "postcode",
    "city",
    "state",
    "country",
)


def _woo_block(row: dict, prefix: str) -> dict:
    """Build {suffix: value} from CSV columns like billing_address_1."""
    out: dict[str, str] = {}
    for s in _WOO_SUFFIXES:
        col = f"{prefix}_{s}"
        val = (row.get(col) or "").strip()
        if val:
            out[s] = val
    return out


def _wrap_wordpress_password(user_pass: str) -> str | None:
    h = (user_pass or "").strip()
    if not h or h.startswith("*"):
        return None
    if h.startswith(("$P$", "$H$")):
        return f"wordpress_phpass${h}"
    if h.startswith("$wp$"):
        return f"wordpress_bcrypt${h}"
    if h.startswith(("$2a$", "$2b$", "$2y$", "$2x$")):
        return f"wordpress_bcrypt${h}"
    return None


def _normalize_username(raw_login: str, wp_id: str) -> str:
    s = (raw_login or "").strip().strip("'\"").strip()
    s = re.sub(r"\s+", "_", s)
    if not s:
        s = f"wpuser_{wp_id}"
    s = re.sub(r"[^\w.@+-]+", "_", s, flags=re.UNICODE)
    s = re.sub(r"_+", "_", s).strip("_")
    if not s:
        s = f"wpuser_{wp_id}"
    return s[:150]


def _unique_username(base: str, reserved: set[str]) -> str:
    candidate = base[:150]
    n = 2
    while (
        candidate in reserved or User.objects.filter(username=candidate).exists()
    ):
        suffix = f"_{n}"
        candidate = f"{base[: 150 - len(suffix)]}{suffix}"
        n += 1
    reserved.add(candidate)
    return candidate


def _parse_registered(value: str):
    value = (value or "").strip()
    if not value:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(value, fmt)
            if timezone.is_naive(dt):
                return timezone.make_aware(dt, dt_timezone.utc)
            return dt
        except ValueError:
            continue
    return None


def _parse_roles_cell(roles_cell: str) -> set[str]:
    text = (roles_cell or "").strip().lower()
    if not text:
        return set()
    parts = re.split(r"[,|;]+", text)
    return {p.strip() for p in parts if p.strip()}


def _names_from_row(row: dict) -> tuple[str, str]:
    """Prefer profile first/last; fall back to WooCommerce billing names."""
    fn = (row.get("first_name") or "").strip()
    ln = (row.get("last_name") or "").strip()
    if not fn:
        fn = (row.get("billing_first_name") or "").strip()
    if not ln:
        ln = (row.get("billing_last_name") or "").strip()
    return fn[:150], ln[:150]


class Command(BaseCommand):
    help = (
        "Import WordPress-exported users from CSV as portal customers, "
        "preserving WordPress password hashes (phpass / bcrypt), plus "
        "WooCommerce billing/shipping when columns are present."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--csv",
            dest="csv_path",
            required=True,
            help="Path to WordPress user export CSV.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and report only; do not write to the database.",
        )
        parser.add_argument(
            "--update-existing",
            action="store_true",
            help="If a user with the same email exists, update password, names, and profile.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Import at most this many matching rows (after filters).",
        )
        parser.add_argument(
            "--roles",
            default=",".join(sorted(DEFAULT_IMPORT_ROLES)),
            help=(
                "Comma-separated WordPress roles to include "
                f"(default: {','.join(sorted(DEFAULT_IMPORT_ROLES))})."
            ),
        )

    def handle(self, *args, **options):
        csv_path = Path(options["csv_path"]).expanduser()
        if not csv_path.is_file():
            raise CommandError(f"CSV not found: {csv_path}")

        include_roles = {
            r.strip().lower()
            for r in (options["roles"] or "").split(",")
            if r.strip()
        }
        if not include_roles:
            include_roles = set(DEFAULT_IMPORT_ROLES)

        dry_run = options["dry_run"]
        update_existing = options["update_existing"]
        limit = options["limit"]

        stats = {
            "rows": 0,
            "skipped_role": 0,
            "skipped_email": 0,
            "skipped_password": 0,
            "skipped_duplicate": 0,
            "created": 0,
            "updated": 0,
            "profiles_written": 0,
        }

        to_create: list[User] = []
        # (template User with email set, billing dict, shipping dict) — same order as to_create
        profile_for_create: list[tuple[dict, dict]] = []
        updates: list[
            tuple[User, str, dict, dict, dict]
        ] = []  # user, encoded_pw, field_updates, billing, shipping
        reserved_usernames: set[str] = set()

        with csv_path.open(newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                stats["rows"] += 1
                wp_id = (row.get("ID") or "").strip()
                roles = _parse_roles_cell(row.get("roles") or "")
                if roles & SKIP_ROLES:
                    stats["skipped_role"] += 1
                    continue
                if not roles & include_roles:
                    stats["skipped_role"] += 1
                    continue

                email = (row.get("user_email") or "").strip()
                if not email:
                    stats["skipped_email"] += 1
                    continue

                encoded_pw = _wrap_wordpress_password(row.get("user_pass") or "")
                if not encoded_pw:
                    stats["skipped_password"] += 1
                    self.stderr.write(
                        self.style.WARNING(
                            f"Skip ID {wp_id} ({email}): unknown or empty password hash"
                        )
                    )
                    continue
                if len(encoded_pw) > 128:
                    stats["skipped_password"] += 1
                    self.stderr.write(
                        self.style.WARNING(
                            f"Skip ID {wp_id} ({email}): hash longer than 128 chars"
                        )
                    )
                    continue

                first_name, last_name = _names_from_row(row)
                billing = _woo_block(row, "billing")
                shipping = _woo_block(row, "shipping")
                date_joined = _parse_registered(row.get("user_registered") or "")

                status_raw = (row.get("user_status") or "").strip()
                is_active = status_raw in ("", "0")

                existing = User.objects.filter(email__iexact=email).first()
                if existing:
                    if not update_existing:
                        stats["skipped_duplicate"] += 1
                        continue
                    field_updates = {
                        "first_name": first_name or existing.first_name,
                        "last_name": last_name or existing.last_name,
                        "is_active": is_active,
                        "is_staff": False,
                        "is_superuser": False,
                    }
                    if date_joined:
                        field_updates["date_joined"] = date_joined
                    updates.append(
                        (existing, encoded_pw, field_updates, billing, shipping)
                    )
                    continue

                if limit is not None and len(to_create) >= limit:
                    continue

                base_username = _normalize_username(row.get("user_login") or "", wp_id)
                username = _unique_username(base_username, reserved_usernames)
                user = User(
                    username=username,
                    email=User.objects.normalize_email(email),
                    first_name=first_name,
                    last_name=last_name,
                    is_staff=False,
                    is_superuser=False,
                    is_active=is_active,
                )
                if date_joined:
                    user.date_joined = date_joined
                user.password = encoded_pw
                to_create.append(user)
                profile_for_create.append((billing, shipping))

        stats["created"] = len(to_create)
        stats["updated"] = len(updates)

        if dry_run:
            cr_prof = sum(1 for b, s in profile_for_create if b or s)
            up_prof = sum(1 for t in updates if t[3] or t[4])
            self.stdout.write(
                self.style.NOTICE(
                    f"Dry run: would create {len(to_create)} users, "
                    f"update {len(updates)}; "
                    f"would set address profile on ~{cr_prof + up_prof} rows; "
                    f"skipped role={stats['skipped_role']}, "
                    f"no email={stats['skipped_email']}, "
                    f"bad hash={stats['skipped_password']}, "
                    f"duplicate email={stats['skipped_duplicate']}"
                )
            )
            return

        try:
            with transaction.atomic():
                if to_create:
                    User.objects.bulk_create(to_create)
                    norm_emails = [
                        User.objects.normalize_email(u.email) for u in to_create
                    ]
                    fetched = User.objects.filter(email__in=norm_emails)
                    by_email = {
                        User.objects.normalize_email(u.email): u for u in fetched
                    }
                    profiles: list[MemberProfile] = []
                    for u_tpl, (bill, ship) in zip(
                        to_create, profile_for_create, strict=True
                    ):
                        key = User.objects.normalize_email(u_tpl.email)
                        real = by_email.get(key)
                        if real and (bill or ship):
                            profiles.append(
                                MemberProfile(
                                    user=real, billing=bill or {}, shipping=ship or {}
                                )
                            )
                    if profiles:
                        MemberProfile.objects.bulk_create(profiles)
                        stats["profiles_written"] += len(profiles)

                for user, encoded_pw, field_updates, billing, shipping in updates:
                    User.objects.filter(pk=user.pk).update(
                        password=encoded_pw, **field_updates
                    )
                    if billing or shipping:
                        MemberProfile.objects.update_or_create(
                            user=user,
                            defaults={
                                "billing": billing or {},
                                "shipping": shipping or {},
                            },
                        )
                        stats["profiles_written"] += 1
        except Exception as exc:
            raise CommandError(f"Database error: {exc}") from exc

        total_users = User.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Created {stats['created']} users, updated {stats['updated']}. "
                f"Member profiles written: {stats['profiles_written']}. "
                f"Skipped: role={stats['skipped_role']}, "
                f"no email={stats['skipped_email']}, "
                f"bad hash={stats['skipped_password']}, "
                f"duplicate email={stats['skipped_duplicate']}. "
                f"Total users in database now: {total_users}."
            )
        )
        if stats["created"] == 0 and stats["updated"] == 0:
            self.stdout.write(
                self.style.WARNING(
                    "No rows were imported. If you expected new users, use the same "
                    "database as this Django project (check DB_NAME / sqlite file), "
                    "and add --update-existing to refresh accounts that already exist by email. "
                    "If users landed in db.sqlite3 but you use MySQL now, run: "
                    "python manage.py mirror_sqlite_users --wipe-target-users"
                )
            )
