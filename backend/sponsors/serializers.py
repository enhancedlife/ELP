from rest_framework import serializers

from .models import PartnersPageSettings, Sponsor


class PartnersPageSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnersPageSettings
        fields = [
            "id",
            "banner_image_url",
            "banner_kicker",
            "hero_title",
            "hero_lead",
            "intro_heading",
            "intro_body",
            "pillars",
            "link_primary_label",
            "link_primary_url",
            "link_secondary_label",
            "link_secondary_url",
            "page_body",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]


class SponsorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sponsor
        fields = [
            "id",
            "name",
            "website_url",
            "logo_url",
            "description",
            "body",
            "is_featured",
            "cta_label",
            "category",
            "is_active",
            "sort_order",
            "deleted_at",
        ]
        extra_kwargs = {
            "deleted_at": {"required": False, "allow_null": True},
        }
