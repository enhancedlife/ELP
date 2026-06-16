from rest_framework import serializers

from .models import SmtpProfile


class SmtpProfileSerializer(serializers.ModelSerializer):
    password_set = serializers.SerializerMethodField()

    class Meta:
        model = SmtpProfile
        fields = [
            "id",
            "name",
            "host",
            "port",
            "username",
            "password",
            "password_set",
            "use_tls",
            "use_ssl",
            "from_email",
            "is_enabled",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "password_set"]
        extra_kwargs = {
            "password": {"write_only": True, "required": False, "allow_blank": True},
        }

    def get_password_set(self, obj: SmtpProfile) -> bool:
        return bool((obj.password or "").strip())

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        profile = SmtpProfile(**validated_data)
        if password is not None:
            profile.password = password
        profile.save()
        if profile.is_active:
            from .smtp_profiles import activate_smtp_profile

            activate_smtp_profile(profile)
        elif (
            profile.is_enabled
            and not SmtpProfile.objects.filter(is_active=True, is_enabled=True).exists()
        ):
            from .smtp_profiles import activate_smtp_profile

            activate_smtp_profile(profile)
        return profile

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password is not None:
            instance.password = password
        instance.save()
        if instance.is_active and instance.is_enabled:
            from .smtp_profiles import activate_smtp_profile

            activate_smtp_profile(instance)
        return instance
