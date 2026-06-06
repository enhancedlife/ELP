from rest_framework import serializers

from .models import DashboardNotificationPreference


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardNotificationPreference
        fields = [
            "email_product_updates",
            "email_security_alerts",
            "browser_push",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]
