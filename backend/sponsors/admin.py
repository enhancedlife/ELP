from django.contrib import admin

from common.soft_delete import soft_delete

from .models import PartnersPageSettings, Sponsor


@admin.register(PartnersPageSettings)
class PartnersPageSettingsAdmin(admin.ModelAdmin):
    list_display = ("id", "hero_title", "updated_at")

    def has_add_permission(self, request):
        return not PartnersPageSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Sponsor)
class SponsorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "category",
        "website_url",
        "is_active",
        "sort_order",
        "updated_at",
    )
    list_filter = ("is_active",)
    search_fields = ("name", "website_url", "description", "category")
    ordering = ("sort_order", "-updated_at")
    list_editable = ("sort_order", "is_active")
    readonly_fields = ("created_at", "updated_at", "deleted_at")

    fieldsets = (
        (None, {"fields": ("name", "category", "description")}),
        ("Links & branding", {"fields": ("website_url", "logo_url")}),
        (
            "Publishing",
            {
                "fields": ("is_active", "sort_order"),
                "description": "Only active sponsors appear on the public /sponsors page (ordered by sort order).",
            },
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at", "deleted_at")}),
    )

    def delete_model(self, request, obj):
        if obj.deleted_at is not None:
            super().delete_model(request, obj)
        else:
            soft_delete(obj)

    def delete_queryset(self, request, queryset):
        from django.utils import timezone

        alive = queryset.filter(deleted_at__isnull=True)
        alive.update(deleted_at=timezone.now())
        trash = queryset.filter(deleted_at__isnull=False)
        trash.delete()
