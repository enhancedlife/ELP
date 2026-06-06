from django.contrib import admin
from django.utils import timezone

from common.soft_delete import soft_delete

from .models import (
    DashboardConversation,
    DashboardMessage,
    DashboardNotification,
    DashboardNotificationPreference,
    MemberProfile,
)


@admin.register(MemberProfile)
class MemberProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "updated_at")
    search_fields = ("user__email", "user__username")
    raw_id_fields = ("user",)


@admin.register(DashboardNotificationPreference)
class DashboardNotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "email_product_updates", "email_security_alerts", "updated_at")


@admin.register(DashboardNotification)
class DashboardNotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "recipient", "is_read", "created_at")
    list_filter = ("is_read", "category")
    search_fields = ("title", "body")

    def delete_model(self, request, obj):
        if obj.deleted_at is not None:
            super().delete_model(request, obj)
        else:
            soft_delete(obj)

    def delete_queryset(self, request, queryset):
        alive = queryset.filter(deleted_at__isnull=True)
        alive.update(deleted_at=timezone.now())
        trash = queryset.filter(deleted_at__isnull=False)
        trash.delete()


class DashboardMessageInline(admin.TabularInline):
    model = DashboardMessage
    extra = 0


@admin.register(DashboardConversation)
class DashboardConversationAdmin(admin.ModelAdmin):
    list_display = ("subject", "updated_at")
    search_fields = ("subject",)
    inlines = [DashboardMessageInline]

    def delete_model(self, request, obj):
        if obj.deleted_at is not None:
            super().delete_model(request, obj)
        else:
            soft_delete(obj)

    def delete_queryset(self, request, queryset):
        alive = queryset.filter(deleted_at__isnull=True)
        alive.update(deleted_at=timezone.now())
        trash = queryset.filter(deleted_at__isnull=False)
        trash.delete()
