from rest_framework import serializers

from .models import LandingPage


class LandingPageSerializer(serializers.ModelSerializer):
    """Public read by slug (active, non-deleted)."""

    class Meta:
        model = LandingPage
        fields = [
            "slug",
            "title",
            "content",
            "sections",
            "meta_title",
            "meta_description",
            "is_active",
            "sort_order",
            "meta",
        ]


class LandingPageSummarySerializer(serializers.ModelSerializer):
    """Public list entries (nav / FAQ hub)."""

    class Meta:
        model = LandingPage
        fields = [
            "slug",
            "title",
            "sort_order",
            "is_faq",
            "faq_nav_group",
            "faq_nav_label",
            "faq_nav_order",
        ]


class LandingPageDashboardSerializer(serializers.ModelSerializer):
    """Dashboard CRUD (includes id and archive fields)."""

    class Meta:
        model = LandingPage
        fields = [
            "id",
            "slug",
            "title",
            "content",
            "sections",
            "meta_title",
            "meta_description",
            "is_active",
            "is_faq",
            "faq_nav_group",
            "faq_nav_label",
            "faq_nav_order",
            "sort_order",
            "meta",
            "deleted_at",
        ]
        extra_kwargs = {
            "deleted_at": {"required": False, "allow_null": True},
        }
        read_only_fields = ["id"]
