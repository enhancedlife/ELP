import secrets

from django.db import models
from django.utils import timezone


def _new_unsubscribe_token() -> str:
    return secrets.token_urlsafe(32)


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=255, blank=True)
    is_subscribed = models.BooleanField(default=True, db_index=True)
    unsubscribe_token = models.CharField(
        max_length=64, unique=True, db_index=True, editable=False
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.email

    def save(self, *args, **kwargs):
        if not self.unsubscribe_token:
            self.unsubscribe_token = _new_unsubscribe_token()
        super().save(*args, **kwargs)


class SystemEmailLayout(models.Model):
    """
    Singleton-style row: HTML shell for broadcast email.
    layout_config drives header/footer branding; template_html is generated from it.
    Must contain {{email_title}} and {{email_body}}.
    """

    template_html = models.TextField()
    layout_config = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "System email layout"

    def __str__(self):
        return "System email layout"


class EmailBroadcast(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENDING = "sending", "Sending"
        PAUSED = "paused", "Paused"
        STOPPED = "stopped", "Stopped"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    class Audience(models.TextChoices):
        NEWSLETTER = "newsletter", "Newsletter subscribers"
        ALL_SITE_USERS = "all_site_users", "All site users"
        SELECTED_SITE_USERS = "selected_site_users", "Selected site users"
        MANUAL_EMAILS = "manual_emails", "Manual email list"

    subject = models.CharField(max_length=998)
    headline = models.CharField(
        max_length=500,
        blank=True,
        help_text="Main heading inside the HTML template ({{email_title}}). Defaults to subject if empty.",
    )
    body_text = models.TextField()
    body_html = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    audience = models.CharField(
        max_length=32,
        choices=Audience.choices,
        default=Audience.NEWSLETTER,
        blank=True,
    )
    audience_user_ids = models.JSONField(default=list, blank=True)
    audience_emails = models.JSONField(default=list, blank=True)
    recipient_count = models.PositiveIntegerField(default=0)
    sent_ok_count = models.PositiveIntegerField(default=0)
    sent_fail_count = models.PositiveIntegerField(default=0)
    pending_count = models.PositiveIntegerField(default=0)
    skipped_count = models.PositiveIntegerField(default=0)
    error_summary = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.subject


class EmailBroadcastRecipient(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"
        SKIPPED = "skipped", "Skipped"

    broadcast = models.ForeignKey(
        EmailBroadcast,
        on_delete=models.CASCADE,
        related_name="recipients",
    )
    email = models.EmailField(db_index=True)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["id"]
        indexes = [
            models.Index(fields=["broadcast", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.email} ({self.status})"


class SmtpProfile(models.Model):
    """Dashboard-managed SMTP server; one active enabled profile sends all outbound mail."""

    name = models.CharField(max_length=128, help_text="Label shown in the admin UI.")
    host = models.CharField(max_length=255)
    port = models.PositiveIntegerField(default=587)
    username = models.CharField(max_length=255, blank=True, default="")
    password = models.CharField(max_length=255, blank=True, default="")
    use_tls = models.BooleanField(default=True)
    use_ssl = models.BooleanField(default=False)
    from_email = models.EmailField()
    is_enabled = models.BooleanField(
        default=True,
        help_text="Disabled profiles cannot be selected for sending.",
    )
    is_active = models.BooleanField(
        default=False,
        help_text="The active profile is used for all outbound mail.",
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_active", "name"]

    def __str__(self) -> str:
        flags = []
        if self.is_active:
            flags.append("active")
        if not self.is_enabled:
            flags.append("disabled")
        suffix = f" ({', '.join(flags)})" if flags else ""
        return f"{self.name}{suffix}"


class OutboundEmailLog(models.Model):
    """
    One row per SMTP attempt (broadcast recipient, template test, password reset, etc.).
    """

    class Source(models.TextChoices):
        BROADCAST = "broadcast", "Broadcast"
        TEMPLATE_TEST = "template_test", "Template test"
        PASSWORD_RESET = "password_reset", "Password reset"
        CONTACT_FORM = "contact_form", "Contact form"
        SMTP_CLI = "smtp_cli", "CLI test"

    source = models.CharField(max_length=32, choices=Source.choices, db_index=True)
    to_email = models.EmailField(db_index=True)
    subject = models.CharField(max_length=998, blank=True)
    success = models.BooleanField(db_index=True)
    error_message = models.TextField(blank=True)
    error_type = models.CharField(max_length=120, blank=True)
    broadcast = models.ForeignKey(
        EmailBroadcast,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="outbound_logs",
    )
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at", "source"]),
            models.Index(fields=["-created_at", "success"]),
        ]
