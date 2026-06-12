from rest_framework import serializers

from .branding_utils import branding_file_url
from .models import SiteBrandingSettings


class SiteBrandingSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()

    class Meta:
        model = SiteBrandingSettings
        fields = [
            "site_name",
            "logo_url",
            "favicon_url",
            "updated_at",
        ]
        read_only_fields = ["logo_url", "favicon_url", "updated_at"]

    def get_logo_url(self, obj: SiteBrandingSettings) -> str:
        return branding_file_url(obj.logo, self.context.get("request"))

    def get_favicon_url(self, obj: SiteBrandingSettings) -> str:
        return branding_file_url(obj.favicon, self.context.get("request"))
