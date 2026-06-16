from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from mailing.email_logging import record_outbound_email
from mailing.models import OutboundEmailLog
from mailing.smtp_config import outbound_smtp_block_reason
from mailing.smtp_helpers import smtp_failure_user_message
from mailing.smtp_profiles import resolve_from_email, resolve_smtp, send_outbound_mail


class Command(BaseCommand):
    help = (
        "Send one test message using the configured SMTP backend. "
        "Use this to verify Elastic Email (or any provider) from the same environment as production."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "to",
            type=str,
            help="Recipient email address",
        )

    def handle(self, *args, **options):
        to = (options["to"] or "").strip()
        if not to or "@" not in to:
            raise CommandError("Provide a valid recipient address.")

        block = outbound_smtp_block_reason(allow_console_in_debug=False)
        if block:
            raise CommandError(block)

        resolved = resolve_smtp()
        try:
            tls_on = "yes" if (resolved.use_tls if resolved else settings.EMAIL_USE_TLS) else "no"
            ssl_on = "yes" if (resolved.use_ssl if resolved else settings.EMAIL_USE_SSL) else "no"
            body = (
                "THE SWOLE REPUBLIC\n"
                "Outbound mail test\n"
                "\n"
                "This is a plain-text check that your server can authenticate to SMTP and hand off "
                "a message. It contains no links and no HTML.\n"
                "\n"
                "If this arrived in your inbox (not spam), relay for this recipient is working.\n"
                "\n"
                "------------------------------------------------------------\n"
                "Technical summary\n"
                "------------------------------------------------------------\n"
                f"From address: {resolve_from_email()}\n"
                f"SMTP host: {resolved.host if resolved else settings.EMAIL_HOST}\n"
                f"Port: {resolved.port if resolved else settings.EMAIL_PORT}\n"
                f"STARTTLS: {tls_on}\n"
                f"Implicit SSL: {ssl_on}\n"
                f"Source: {resolved.source if resolved else 'unknown'}\n"
                "\n"
                "Sent by: manage.py sendtestemail\n"
            )
            subj = "The Swole Republic — SMTP connectivity test"
            send_outbound_mail(
                subject=subj,
                message=body,
                from_email=None,
                recipient_list=[to],
                fail_silently=False,
            )
        except OSError as e:
            record_outbound_email(
                source=OutboundEmailLog.Source.SMTP_CLI,
                to_email=to,
                subject="The Swole Republic — SMTP connectivity test",
                success=False,
                error_message=f"{smtp_failure_user_message(e)}\n\nTechnical: {e!r}"[:4000],
                error_type=type(e).__name__,
            )
            raise CommandError(f"{smtp_failure_user_message(e)}\n\nTechnical: {e!r}") from e

        record_outbound_email(
            source=OutboundEmailLog.Source.SMTP_CLI,
            to_email=to,
            subject="The Swole Republic — SMTP connectivity test",
            success=True,
        )
        self.stdout.write(self.style.SUCCESS(f"Sent test email to {to}"))
