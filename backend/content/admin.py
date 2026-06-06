from django.contrib import admin

from common.soft_delete import soft_delete

from .models import LandingPage


@admin.register(LandingPage)
class LandingPageAdmin(admin.ModelAdmin):
    list_display = ("id", "slug", "title", "is_active", "is_faq", "sort_order", "updated_at")
    list_filter = ("is_active", "is_faq", "sort_order")
    search_fields = ("slug", "title")
    ordering = ("sort_order", "-updated_at")

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
