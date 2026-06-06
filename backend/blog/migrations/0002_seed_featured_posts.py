from datetime import datetime

from django.db import migrations
from django.utils import timezone


def _dt(y, m, d):
    return timezone.make_aware(datetime(y, m, d, 12, 0, 0))


def seed_posts(apps, schema_editor):
    BlogPost = apps.get_model("blog", "BlogPost")
    rows = [
        {
            "slug": "understanding-estradiol-on-trt",
            "title": "Understanding Estradiol on TRT",
            "excerpt": "A comprehensive guide to managing estrogen levels while on testosterone replacement therapy.",
            "category": "TRT / HRT",
            "read_time_minutes": 8,
            "image_url": "/images/article-estradiol.jpg",
            "is_featured": True,
            "sort_order": 1,
            "published_at": _dt(2024, 1, 15),
        },
        {
            "slug": "recovery-peptides-explained",
            "title": "Recovery Peptides Explained",
            "excerpt": "An overview of the most popular peptides for healing, recovery, and tissue repair.",
            "category": "Peptides",
            "read_time_minutes": 10,
            "image_url": "/images/article-recovery-peptides.jpg",
            "is_featured": True,
            "sort_order": 2,
            "published_at": _dt(2024, 1, 10),
        },
        {
            "slug": "sleep-optimization-for-enhanced-athletes",
            "title": "Sleep Optimization for Enhanced Athletes",
            "excerpt": "Why sleep is the ultimate performance enhancer and how to optimize it.",
            "category": "Recovery",
            "read_time_minutes": 7,
            "image_url": "/images/article-sleep.jpg",
            "is_featured": True,
            "sort_order": 3,
            "published_at": _dt(2024, 1, 5),
        },
        {
            "slug": "beginners-guide-to-bpc-157",
            "title": "Beginner's Guide to BPC-157",
            "excerpt": "Everything you need to know about this popular healing peptide.",
            "category": "Peptides",
            "read_time_minutes": 9,
            "image_url": "/images/article-bpc157.jpg",
            "is_featured": True,
            "sort_order": 4,
            "published_at": _dt(2023, 12, 28),
        },
        {
            "slug": "hematocrit-management-on-trt",
            "title": "Hematocrit Management on TRT",
            "excerpt": "Understanding and managing elevated hematocrit while on testosterone therapy.",
            "category": "TRT / HRT",
            "read_time_minutes": 6,
            "image_url": "/images/article-hematocrit.jpg",
            "is_featured": True,
            "sort_order": 5,
            "published_at": _dt(2023, 12, 20),
        },
        {
            "slug": "the-science-of-growth-hormone-secretagogues",
            "title": "The Science of Growth Hormone Secretagogues",
            "excerpt": "How GH secretagogues work and what the research says about their effects.",
            "category": "Peptides",
            "read_time_minutes": 12,
            "image_url": "/images/article-gh-secretagogues.jpg",
            "is_featured": True,
            "sort_order": 6,
            "published_at": _dt(2023, 12, 15),
        },
    ]
    for row in rows:
        BlogPost.objects.update_or_create(slug=row["slug"], defaults={**row, "body": "", "is_published": True})


def unseed(apps, schema_editor):
    BlogPost = apps.get_model("blog", "BlogPost")
    slugs = [
        "understanding-estradiol-on-trt",
        "recovery-peptides-explained",
        "sleep-optimization-for-enhanced-athletes",
        "beginners-guide-to-bpc-157",
        "hematocrit-management-on-trt",
        "the-science-of-growth-hormone-secretagogues",
    ]
    BlogPost.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_posts, unseed),
    ]
