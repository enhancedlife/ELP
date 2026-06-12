from rest_framework import serializers

from .models import BlogComment


def _author_display_name(user) -> str:
    full = (user.get_full_name() or "").strip()
    if full:
        return full
    first = (user.first_name or "").strip()
    if first:
        return first
    return (user.username or "Member").strip() or "Member"


class BlogCommentPublicSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = BlogComment
        fields = ["id", "body", "author_name", "created_at", "is_mine"]
        read_only_fields = fields

    def get_author_name(self, obj: BlogComment) -> str:
        return _author_display_name(obj.author)

    def get_is_mine(self, obj: BlogComment) -> bool:
        request = self.context.get("request")
        user = getattr(request, "user", None)
        return (
            user is not None
            and user.is_authenticated
            and obj.author_id == user.id
        )


class BlogCommentDashboardSerializer(serializers.ModelSerializer):
    post_id = serializers.IntegerField(source="post.id", read_only=True)
    post_slug = serializers.CharField(source="post.slug", read_only=True)
    post_title = serializers.CharField(source="post.title", read_only=True)
    author_id = serializers.IntegerField(read_only=True)
    author_name = serializers.SerializerMethodField()
    author_email = serializers.SerializerMethodField()

    class Meta:
        model = BlogComment
        fields = [
            "id",
            "post_id",
            "post_slug",
            "post_title",
            "author_id",
            "author_name",
            "author_email",
            "body",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "post_id",
            "post_slug",
            "post_title",
            "author_id",
            "author_name",
            "author_email",
            "created_at",
            "updated_at",
        ]

    def get_author_name(self, obj: BlogComment) -> str:
        return _author_display_name(obj.author)

    def get_author_email(self, obj: BlogComment) -> str:
        return (obj.author.email or "").strip()
