from django.db import models
from django.utils import timezone


class BlogPost(models.Model):
    """Public blog articles — fields mirror the ELP frontend listing and post views."""

    slug = models.SlugField(max_length=255, unique=True)
    title = models.CharField(max_length=255)
    excerpt = models.TextField()
    category = models.CharField(max_length=64, default="General")
    read_time_minutes = models.PositiveSmallIntegerField(default=5)
    image_url = models.CharField(
        max_length=512,
        default="/images/article-default.jpg",
        help_text="Path or URL for the card hero image (e.g. /images/article-estradiol.jpg).",
    )
    body = models.TextField(
        blank=True,
        default="",
        help_text="HTML body shown on the article page (inside the member gate).",
    )
    published_at = models.DateTimeField(default=timezone.now)
    is_featured = models.BooleanField(
        default=False,
        help_text="When true, shown on the main /blog grid (up to 6, by sort order and date).",
    )
    is_published = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-published_at", "sort_order"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_published", "is_featured", "-published_at"]),
        ]

    def __str__(self) -> str:
        return self.title
