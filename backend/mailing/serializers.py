from rest_framework import serializers

from .default_layout import PLACEHOLDER_BODY, PLACEHOLDER_TITLE
from .layout_config import (
    build_template_from_config,
    normalize_layout_config,
    validate_layout_config,
)
from .email_list import normalize_email_list
from .models import (
    EmailBroadcast,
    EmailBroadcastRecipient,
    NewsletterSubscriber,
    OutboundEmailLog,
    SystemEmailLayout,
)


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = [
            "id",
            "email",
            "name",
            "is_subscribed",
            "created_at",
            "updated_at",
            "deleted_at",
        ]
        extra_kwargs = {
            "deleted_at": {"required": False, "allow_null": True},
        }
        read_only_fields = ["id", "created_at", "updated_at"]


class EmailBroadcastSerializer(serializers.ModelSerializer):
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = EmailBroadcast
        fields = [
            "id",
            "subject",
            "headline",
            "body_text",
            "body_html",
            "status",
            "audience",
            "audience_user_ids",
            "audience_emails",
            "recipient_count",
            "sent_ok_count",
            "sent_fail_count",
            "pending_count",
            "skipped_count",
            "progress_percent",
            "error_summary",
            "created_at",
            "started_at",
            "completed_at",
            "sent_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "recipient_count",
            "sent_ok_count",
            "sent_fail_count",
            "pending_count",
            "skipped_count",
            "progress_percent",
            "error_summary",
            "created_at",
            "started_at",
            "completed_at",
            "sent_at",
        ]

    def get_progress_percent(self, obj: EmailBroadcast) -> int:
        total = obj.recipient_count or 0
        if total <= 0:
            return 0
        done = (obj.sent_ok_count or 0) + (obj.sent_fail_count or 0) + (obj.skipped_count or 0)
        return min(100, int(round(100 * done / total)))

    def validate_audience(self, value):
        if value is None:
            return value
        allowed = {c.value for c in EmailBroadcast.Audience}
        v = str(value).strip().lower()
        if v not in allowed:
            raise serializers.ValidationError(
                "audience must be newsletter, all_site_users, selected_site_users, or manual_emails."
            )
        return v

    def validate_audience_emails(self, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("audience_emails must be a list.")
        try:
            return normalize_email_list(value)
        except Exception as e:
            raise serializers.ValidationError(str(e)) from e

    def validate_audience_user_ids(self, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("audience_user_ids must be a list.")
        out: list[int] = []
        for x in value:
            try:
                out.append(int(x))
            except (TypeError, ValueError) as e:
                raise serializers.ValidationError(
                    "audience_user_ids must contain integers."
                ) from e
        return out


class EmailBroadcastRecipientSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailBroadcastRecipient
        fields = [
            "id",
            "email",
            "status",
            "error_message",
            "sent_at",
            "created_at",
        ]
        read_only_fields = fields


class OutboundEmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = OutboundEmailLog
        fields = [
            "id",
            "source",
            "to_email",
            "subject",
            "success",
            "error_message",
            "error_type",
            "broadcast_id",
            "meta",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "source",
            "to_email",
            "subject",
            "success",
            "error_message",
            "error_type",
            "broadcast_id",
            "meta",
            "created_at",
        ]


class SystemEmailLayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemEmailLayout
        fields = ["id", "template_html", "layout_config", "updated_at"]
        read_only_fields = ["id", "template_html", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        cfg = normalize_layout_config(instance.layout_config or None)
        data["layout_config"] = cfg
        data["template_html"] = build_template_from_config(cfg)
        return data

    def validate_layout_config(self, value):
        if value is None:
            return None
        if not isinstance(value, dict):
            raise serializers.ValidationError("layout_config must be an object.")
        return value

    def validate(self, attrs):
        layout = attrs.get("layout_config")
        if layout is not None:
            base = {}
            if self.instance and self.instance.layout_config:
                base = normalize_layout_config(self.instance.layout_config)
            else:
                base = normalize_layout_config(None)
            merged = {**base, **layout}
            try:
                validated = validate_layout_config(merged)
            except ValueError as e:
                raise serializers.ValidationError({"layout_config": str(e)}) from e
            attrs["layout_config"] = validated
            attrs["template_html"] = build_template_from_config(validated)
        elif "template_html" in attrs:
            text = (attrs["template_html"] or "").strip()
            if PLACEHOLDER_TITLE not in text or PLACEHOLDER_BODY not in text:
                raise serializers.ValidationError(
                    {
                        "template_html": f"Template must include {PLACEHOLDER_TITLE} and {PLACEHOLDER_BODY}."
                    }
                )
        return attrs

    def validate_template_html(self, value):
        if self.partial and "layout_config" in getattr(self, "initial_data", {}):
            return value
        text = (value or "").strip()
        if not text:
            return text
        if PLACEHOLDER_TITLE not in text or PLACEHOLDER_BODY not in text:
            raise serializers.ValidationError(
                f"Template must include {PLACEHOLDER_TITLE} and {PLACEHOLDER_BODY}."
            )
        return value
