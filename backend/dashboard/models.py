from django.conf import settings
from django.db import models
from django.utils import timezone


class DashboardNotification(models.Model):
    """In-app notifications for the staff dashboard (API-driven)."""

    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    category = models.CharField(
        max_length=32,
        default="info",
        help_text="info, success, warning",
    )
    link_url = models.CharField(max_length=512, blank=True)
    is_read = models.BooleanField(default=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="dashboard_notifications",
        help_text="If set, only this user sees the notification; if empty, all staff see it.",
    )
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class DashboardConversation(models.Model):
    """Lightweight message thread for internal dashboard chat."""

    subject = models.CharField(max_length=255)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return self.subject


class DashboardMessage(models.Model):
    conversation = models.ForeignKey(
        DashboardConversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    body = models.TextField()
    author_label = models.CharField(max_length=120, default="Staff")
    author_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dashboard_messages",
    )
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.author_label}: {self.body[:40]}"

    def delete(self, using=None, keep_parents=False):
        """Admin inline and ORM deletes archive instead of removing rows."""
        if self.deleted_at is None:
            self.deleted_at = timezone.now()
            self.save(update_fields=["deleted_at"])
        else:
            super().delete(using=using, keep_parents=keep_parents)


class MemberProfile(models.Model):
    """
    WooCommerce-style billing/shipping from WordPress user export (JSON blobs).
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="member_profile",
    )
    billing = models.JSONField(default=dict, blank=True)
    shipping = models.JSONField(default=dict, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "member profile"
        verbose_name_plural = "member profiles"

    def __str__(self) -> str:
        return f"Profile for user {self.user_id}"


class SiteVisit(models.Model):
    """Public page view recorded from the Next.js site."""

    path = models.CharField(max_length=512, db_index=True)
    visited_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-visited_at"]
        indexes = [
            models.Index(fields=["visited_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.path} @ {self.visited_at:%Y-%m-%d %H:%M}"


class DashboardNotificationPreference(models.Model):
    """Per-user notification channel toggles (stored in DB)."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dashboard_notification_prefs",
    )
    email_product_updates = models.BooleanField(default=True)
    email_security_alerts = models.BooleanField(default=True)
    browser_push = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Notification prefs for {self.user_id}"
