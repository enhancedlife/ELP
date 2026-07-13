"""Process due email broadcast waves (cron / systemd backup for the in-process worker)."""

from django.core.management.base import BaseCommand
from django.db import close_old_connections

from mailing.broadcast_engine import process_broadcast_chunk
from mailing.models import EmailBroadcast


class Command(BaseCommand):
    help = (
        "Process one wave for each broadcast currently in 'sending' status. "
        "Safe to run on a schedule; the in-app background worker usually covers this."
    )

    def handle(self, *args, **options):
        close_old_connections()
        qs = EmailBroadcast.objects.filter(status=EmailBroadcast.Status.SENDING).order_by("id")
        count = 0
        for broadcast in qs:
            before = broadcast.pending_count
            process_broadcast_chunk(broadcast)
            broadcast.refresh_from_db()
            self.stdout.write(
                f"Broadcast {broadcast.id}: status={broadcast.status} "
                f"pending {before} → {broadcast.pending_count}"
            )
            count += 1
        if count == 0:
            self.stdout.write("No sending broadcasts.")
        else:
            self.stdout.write(self.style.SUCCESS(f"Processed {count} broadcast(s)."))
