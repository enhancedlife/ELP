from rest_framework import serializers

from .models import DashboardMessage, DashboardNotification


class DashboardNotificationSerializer(serializers.ModelSerializer):
    recipient_id = serializers.IntegerField(allow_null=True, read_only=True)

    class Meta:
        model = DashboardNotification
        fields = [
            "id",
            "title",
            "body",
            "category",
            "link_url",
            "is_read",
            "recipient_id",
            "created_at",
            "deleted_at",
        ]
        read_only_fields = ["id", "created_at", "recipient_id"]
        extra_kwargs = {
            "deleted_at": {"required": False, "allow_null": True},
        }


class DashboardMessageSerializer(serializers.ModelSerializer):
    author_label = serializers.SerializerMethodField()
    author_user_id = serializers.IntegerField(allow_null=True, read_only=True)

    class Meta:
        model = DashboardMessage
        fields = [
            "id",
            "body",
            "author_label",
            "author_user_id",
            "created_at",
            "deleted_at",
        ]
        read_only_fields = ["id", "body", "author_label", "author_user_id", "created_at"]
        extra_kwargs = {
            "deleted_at": {"required": False, "allow_null": True},
        }

    def get_author_label(self, obj):
        u = obj.author_user
        if u is not None:
            return (u.get_full_name() or u.username or u.email or "Staff").strip()
        return obj.author_label
