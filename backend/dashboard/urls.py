from django.urls import path

from mailing import dashboard_views as mailing_dashboard_views
from mailing import smtp_profile_views as mailing_smtp_profile_views

from blog import dashboard_views as blog_dashboard_views
from blog import dashboard_comment_views as blog_dashboard_comment_views
from . import branding_views
from . import views
from . import db_backup_views

urlpatterns = [
    path("site-branding/favicon", branding_views.site_branding_favicon),
    path("site-branding/logo", branding_views.site_branding_logo),
    path("site-branding", branding_views.site_branding_dashboard),
    path("overview", views.overview),
    path("analytics", views.analytics),
    path("users/bulk", views.users_bulk),
    path("users/<int:pk>", views.user_detail),
    path("users", views.users_collection),
    path("projects", views.projects_list),
    path("landing-pages/<int:pk>", views.landing_page_detail),
    path("landing-pages", views.landing_pages_collection),
    path(
        "blog-posts/<int:pk>/thumbnail",
        blog_dashboard_views.blog_post_thumbnail,
    ),
    path("blog-posts/<int:pk>", blog_dashboard_views.blog_post_detail),
    path("blog-posts", blog_dashboard_views.blog_posts_collection),
    path("blog-comments/<int:pk>", blog_dashboard_comment_views.blog_comment_detail),
    path("blog-comments", blog_dashboard_comment_views.blog_comments_collection),
    path("sponsors/<int:pk>", views.sponsor_detail),
    path("sponsors", views.sponsors_collection),
    path("partners-page", views.partners_page_settings),
    path("notifications/<int:pk>", views.notification_detail),
    path("notifications", views.notifications_collection),
    path("notification-preferences", views.notification_preferences),
    path(
        "messages/<int:pk>/items/<int:msg_id>",
        views.conversation_message_detail,
    ),
    path("messages/<int:pk>", views.conversation_detail),
    path("messages", views.messages_inbox),
    path("calendar", views.calendar_placeholder),
    path("database/backup/export", db_backup_views.database_backup_export_view),
    path("database/backup/import", db_backup_views.database_backup_import_view),
    path("database/backup", db_backup_views.database_backup_info_view),
    path(
        "email/broadcasts/<int:pk>/recipients",
        mailing_dashboard_views.email_broadcast_recipients,
    ),
    path(
        "email/broadcasts/<int:pk>/process",
        mailing_dashboard_views.email_broadcast_process,
    ),
    path(
        "email/broadcasts/<int:pk>/pause",
        mailing_dashboard_views.email_broadcast_pause,
    ),
    path(
        "email/broadcasts/<int:pk>/resume",
        mailing_dashboard_views.email_broadcast_resume,
    ),
    path(
        "email/broadcasts/<int:pk>/stop",
        mailing_dashboard_views.email_broadcast_stop,
    ),
    path(
        "email/broadcasts/<int:pk>/send",
        mailing_dashboard_views.email_broadcast_send,
    ),
    path(
        "email/broadcasts/<int:pk>",
        mailing_dashboard_views.email_broadcast_detail,
    ),
    path(
        "email/template/test-send",
        mailing_dashboard_views.system_email_layout_test_send,
    ),
    path("email/delivery-status", mailing_dashboard_views.email_delivery_status),
    path("email/smtp-profiles/import-env", mailing_smtp_profile_views.smtp_profiles_import_env),
    path(
        "email/smtp-profiles/<int:pk>/test-send",
        mailing_smtp_profile_views.smtp_profile_test_send,
    ),
    path(
        "email/smtp-profiles/<int:pk>/activate",
        mailing_smtp_profile_views.smtp_profile_activate,
    ),
    path("email/smtp-profiles/<int:pk>", mailing_smtp_profile_views.smtp_profile_detail),
    path("email/smtp-profiles", mailing_smtp_profile_views.smtp_profiles_collection),
    path("email/send-logs", mailing_dashboard_views.email_send_logs_collection),
    path("email/template", mailing_dashboard_views.system_email_layout),
    path("email/broadcasts", mailing_dashboard_views.email_broadcasts_collection),
    path(
        "email/subscribers/<int:pk>",
        mailing_dashboard_views.newsletter_subscriber_detail,
    ),
    path("email/subscribers", mailing_dashboard_views.newsletter_subscribers_collection),
]
