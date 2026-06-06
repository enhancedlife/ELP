from rest_framework import serializers

from .models import BlogPost


def _format_read_time(minutes: int) -> str:
    m = max(1, int(minutes or 1))
    return f"{m} min read"


def _format_date(dt) -> str:
    if not dt:
        return ""
    return dt.strftime("%B %d, %Y")


class BlogPostPublicSerializer(serializers.ModelSerializer):
    read_time = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    image = serializers.CharField(source="image_url")

    class Meta:
        model = BlogPost
        fields = [
            "slug",
            "title",
            "excerpt",
            "category",
            "read_time",
            "date",
            "image",
        ]

    def get_read_time(self, obj: BlogPost) -> str:
        return _format_read_time(obj.read_time_minutes)

    def get_date(self, obj: BlogPost) -> str:
        return _format_date(obj.published_at)


class BlogPostDetailSerializer(BlogPostPublicSerializer):
    published_at = serializers.DateTimeField()

    class Meta(BlogPostPublicSerializer.Meta):
        fields = BlogPostPublicSerializer.Meta.fields + ["body", "published_at"]


class BlogPostDashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = [
            "id",
            "slug",
            "title",
            "excerpt",
            "category",
            "read_time_minutes",
            "image_url",
            "body",
            "published_at",
            "is_featured",
            "is_published",
            "sort_order",
            "deleted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "deleted_at": {"required": False, "allow_null": True},
        }
