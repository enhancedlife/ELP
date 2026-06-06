from django.db import models
from django.utils import timezone


class PartnersPageSettings(models.Model):
    """
    Singleton-style row (use pk=1): hero banner + copy for the public /sponsors page.
    Managed via dashboard API; mirrors a “partners” landing layout (banner, pillars, intro).
    """

    banner_image_url = models.URLField(max_length=1024, blank=True)
    banner_kicker = models.CharField(
        max_length=120,
        blank=True,
        default="SPONSORS",
        help_text="Small uppercase line above the hero title on the banner.",
    )
    hero_title = models.CharField(
        max_length=255,
        default="The Swole Republic Sponsors",
    )
    hero_lead = models.TextField(
        blank=True,
        help_text="Subtitle under the hero title (on the banner).",
    )
    intro_heading = models.CharField(max_length=255, blank=True)
    intro_body = models.TextField(blank=True)
    pillars = models.JSONField(
        default=list,
        help_text='List of {"title": str, "body": str, "icon": "handshake"|"layers"|"sparkles"|"trending-up"}',
    )
    link_primary_label = models.CharField(max_length=120, blank=True)
    link_primary_url = models.URLField(max_length=1024, blank=True)
    link_secondary_label = models.CharField(max_length=120, blank=True)
    link_secondary_url = models.URLField(max_length=1024, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Partners page settings"
        verbose_name_plural = "Partners page settings"

    def __str__(self) -> str:
        return "Partners page"


class Sponsor(models.Model):
    name = models.CharField(max_length=255)
    website_url = models.URLField(max_length=1024, blank=True)
    logo_url = models.URLField(max_length=1024, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=255,
        blank=True,
        db_index=True,
        help_text='Section heading on the public page, e.g. "Supplements & health", "Lifestyle".',
    )

    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["is_active", "sort_order"]),
            models.Index(fields=["category", "sort_order"]),
        ]
        ordering = ["sort_order", "-updated_at"]

    def __str__(self) -> str:
        return self.name
