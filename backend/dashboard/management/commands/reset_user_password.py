"""
Reset a user's Django password (auth_user) by email or username.

Examples:

  python manage.py reset_user_password admin@admin.com
  python manage.py reset_user_password admin@admin.com --password 'YourNewPassw0rd!'

If --password is omitted, a random password is generated and printed once (copy it immediately).
"""

from __future__ import annotations

import secrets

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = "Set a new password for a user identified by email or username."

    def add_arguments(self, parser):
        parser.add_argument(
            "identifier",
            help="User email (case-insensitive) or username",
        )
        parser.add_argument(
            "--password",
            dest="password",
            default=None,
            help="New password. If omitted, a random password is generated and printed.",
        )

    def handle(self, *args, **options):
        raw = (options["identifier"] or "").strip()
        if not raw:
            raise CommandError("identifier is required.")

        user = User.objects.filter(email__iexact=raw).first()
        if user is None:
            user = User.objects.filter(username__iexact=raw).first()
        if user is None:
            raise CommandError(
                f"No user with email or username matching {raw!r}. "
                "Check auth_user in your database."
            )

        password = options["password"]
        if not password:
            password = secrets.token_urlsafe(18)
            self.stdout.write(
                self.style.WARNING(
                    "No --password given; using a one-time random password (copy it now):"
                )
            )

        try:
            validate_password(password, user=user)
        except ValidationError as e:
            raise CommandError("; ".join(e.messages)) from e

        user.set_password(password)
        user.save(update_fields=["password"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Password updated for user id={user.pk} username={user.username!r} email={user.email!r}"
            )
        )
        if options["password"] is None:
            self.stdout.write(password)
