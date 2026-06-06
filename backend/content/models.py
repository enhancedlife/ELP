from django.db import models
from django.utils import timezone


class LandingPage(models.Model):
    """
    Public informational pages stored in MySQL.
    - `content` can be rendered as HTML (already generated in PurePharma).
    - `sections` is JSON for structured content blocks (FAQ, multi-step tutorials, etc.).
    """

    slug = models.CharField(max_length=255, unique=True)
    title = models.CharField(max_length=255)
    content = models.TextField(null=True, blank=True)
    sections = models.JSONField(null=True, blank=True)

    meta_title = models.CharField(max_length=255, null=True, blank=True)
    meta_description = models.TextField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_faq = models.BooleanField(
        default=False,
        help_text="When true, listed on the public /faq hub and manageable as FAQ content.",
    )
    # Public site header: FAQ dropdown → “Sponsors' FAQ” submenu (managed in dashboard).
    faq_nav_group = models.CharField(
        max_length=32,
        blank=True,
        default="",
        db_index=True,
        help_text="Empty = not in sponsor submenu. 'sponsors' = listed under Sponsors' FAQ in the header.",
    )
    faq_nav_label = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Label in the FAQ menu (defaults to title).",
    )
    faq_nav_order = models.IntegerField(default=0)

    sort_order = models.IntegerField(default=0)

    meta = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active", "sort_order"]),
        ]
        ordering = ["sort_order", "-updated_at"]

    def save(self, *args, **kwargs) -> None:
        g = (self.faq_nav_group or "").strip().lower()
        self.faq_nav_group = "sponsors" if g == "sponsors" else ""
        # Header submenu requires is_faq in the public API; keep in sync so editors don't miss the toggle.
        if self.faq_nav_group == "sponsors":
            self.is_faq = True
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.title} ({self.slug})"
