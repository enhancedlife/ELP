from django.db import migrations


def seed(apps, schema_editor):
    DashboardNotification = apps.get_model("dashboard", "DashboardNotification")
    DashboardConversation = apps.get_model("dashboard", "DashboardConversation")
    DashboardMessage = apps.get_model("dashboard", "DashboardMessage")

    if not DashboardNotification.objects.exists():
        DashboardNotification.objects.create(
            title="Dashboard messages and notifications are live",
            body=(
                "You can manage threads under Messages and configure delivery "
                "preferences under Settings → Notifications. Data is stored in "
                "the database and served via /api/dashboard/."
            ),
            category="success",
            is_read=False,
        )
    if not DashboardConversation.objects.exists():
        conv = DashboardConversation.objects.create(subject="Welcome to team messages")
        DashboardMessage.objects.create(
            conversation=conv,
            author_label="System",
            body=(
                "Start a new thread or reply here. Messages are shared across "
                "dashboard users with API access (same server secret)."
            ),
        )


def unseed(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("dashboard", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
