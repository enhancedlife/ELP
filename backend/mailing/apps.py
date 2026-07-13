from django.apps import AppConfig


class MailingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "mailing"
    verbose_name = "Newsletter & broadcasts"

    def ready(self):
        # Start background sender so bulk mail continues after the browser closes.
        try:
            from .broadcast_worker import recover_sending_broadcasts_on_startup

            recover_sending_broadcasts_on_startup()
        except Exception:  # noqa: BLE001
            pass
