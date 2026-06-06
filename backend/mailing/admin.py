from django.contrib import admin

from .models import EmailBroadcast, NewsletterSubscriber, OutboundEmailLog


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "name", "is_subscribed", "created_at")
    list_filter = ("is_subscribed",)
    search_fields = ("email", "name")
    readonly_fields = ("unsubscribe_token", "created_at", "updated_at")


class OutboundEmailLogInline(admin.TabularInline):
    model = OutboundEmailLog
    fk_name = "broadcast"
    extra = 0
    readonly_fields = (
        "source",
        "to_email",
        "subject",
        "success",
        "error_message",
        "error_type",
        "meta",
        "created_at",
    )
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(EmailBroadcast)
class EmailBroadcastAdmin(admin.ModelAdmin):
    list_display = ("subject", "status", "recipient_count", "sent_ok_count", "created_at")
    list_filter = ("status",)
    inlines = [OutboundEmailLogInline]


@admin.register(OutboundEmailLog)
class OutboundEmailLogAdmin(admin.ModelAdmin):
    list_display = (
        "created_at",
        "source",
        "to_email",
        "success",
        "subject",
        "broadcast",
    )
    list_filter = ("source", "success")
    search_fields = ("to_email", "subject", "error_message")
    readonly_fields = (
        "source",
        "to_email",
        "subject",
        "success",
        "error_message",
        "error_type",
        "broadcast",
        "meta",
        "created_at",
    )

    def has_add_permission(self, request):
        return False
