from rest_framework import serializers

from dashboard.url_utils import public_absolute_url

from .image_utils import blog_post_card_image
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
    image = serializers.SerializerMethodField()

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

    def get_image(self, obj: BlogPost) -> str:
        return blog_post_card_image(obj, self.context.get("request"))


class BlogPostDetailSerializer(BlogPostPublicSerializer):
    is_public = serializers.BooleanField(read_only=True)
    is_published = serializers.BooleanField(read_only=True)
    published_at = serializers.DateTimeField()

    class Meta(BlogPostPublicSerializer.Meta):
        fields = BlogPostPublicSerializer.Meta.fields + [
            "body",
            "published_at",
            "is_public",
            "is_published",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        is_superuser = (
            user
            and getattr(user, "is_authenticated", False)
            and getattr(user, "is_active", False)
            and getattr(user, "is_superuser", False)
        )
        if is_superuser:
            return data

        if not instance.is_public:
            if not user or not getattr(user, "is_authenticated", False) or not user.is_active:
                data["body"] = ""
        return data


class BlogPostDashboardSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()
    card_image_url = serializers.SerializerMethodField()

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
            "thumbnail_url",
            "card_image_url",
            "body",
            "published_at",
            "is_featured",
            "is_published",
            "is_public",
            "sort_order",
            "deleted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "thumbnail_url",
            "card_image_url",
        ]
        extra_kwargs = {
            "deleted_at": {"required": False, "allow_null": True},
        }

    def get_thumbnail_url(self, obj: BlogPost) -> str | None:
        if not obj.thumbnail:
            return None
        request = self.context.get("request")
        url = obj.thumbnail.url
        if url.startswith("/"):
            return public_absolute_url(request, url)
        return url

    def get_card_image_url(self, obj: BlogPost) -> str:
        return blog_post_card_image(obj, self.context.get("request"))
