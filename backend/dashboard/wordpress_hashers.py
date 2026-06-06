"""Verify-only hashers for WordPress-exported passwords (phpass and bcrypt).

On first successful login, Django's default hasher replaces these (see must_update).
"""

import bcrypt
from django.contrib.auth.hashers import BasePasswordHasher, mask_hash
from django.utils.translation import gettext as _
from passlib.hash import phpass as phpass_hasher


class WordPressPhpPassHasher(BasePasswordHasher):
    """WordPress portable hashes: ``$P$...`` / ``$H$...`` (phpass)."""

    algorithm = "wordpress_phpass"

    def decode(self, encoded):
        prefix = f"{self.algorithm}$"
        if not encoded.startswith(prefix):
            raise ValueError("Malformed WordPress phpass password")
        return {
            "algorithm": self.algorithm,
            "hash": encoded[len(prefix) :],
            "salt": "",
        }

    def verify(self, password, encoded):
        try:
            digest = self.decode(encoded)["hash"]
        except ValueError:
            return False
        if not digest.startswith(("$P$", "$H$")):
            return False
        return phpass_hasher.verify(password, digest)

    def safe_summary(self, encoded):
        decoded = self.decode(encoded)
        return {
            _("algorithm"): decoded["algorithm"],
            _("salt"): mask_hash(decoded["salt"], show=2),
            _("hash"): mask_hash(decoded["hash"]),
        }

    def must_update(self, encoded):
        return True

    def harden_runtime(self, password, encoded):
        phpass_hasher.hash(password or "")

    def encode(self, password, salt):
        raise NotImplementedError(
            "WordPress phpass is import-only; use the default hasher for new passwords."
        )


class WordPressBcryptHasher(BasePasswordHasher):
    """WordPress bcrypt: ``$wp$2y$10$...`` or raw ``$2y$...``."""

    algorithm = "wordpress_bcrypt"

    def decode(self, encoded):
        prefix = f"{self.algorithm}$"
        if not encoded.startswith(prefix):
            raise ValueError("Malformed WordPress bcrypt password")
        return {
            "algorithm": self.algorithm,
            "hash": encoded[len(prefix) :],
            "salt": "",
        }

    def verify(self, password, encoded):
        try:
            wp = self.decode(encoded)["hash"]
        except ValueError:
            return False
        if wp.startswith("$wp$"):
            bcrypt_str = wp[4:]
        else:
            bcrypt_str = wp
        if not bcrypt_str.startswith(("$2a$", "$2b$", "$2y$", "$2x$")):
            return False
        try:
            return bcrypt.checkpw(
                password.encode("utf-8"),
                bcrypt_str.encode("ascii"),
            )
        except (ValueError, TypeError):
            return False

    def safe_summary(self, encoded):
        decoded = self.decode(encoded)
        return {
            _("algorithm"): decoded["algorithm"],
            _("salt"): mask_hash(decoded["salt"], show=2),
            _("hash"): mask_hash(decoded["hash"]),
        }

    def must_update(self, encoded):
        return True

    def harden_runtime(self, password, encoded):
        pass

    def encode(self, password, salt):
        raise NotImplementedError(
            "WordPress bcrypt is import-only; use the default hasher for new passwords."
        )
