"""Background worker so bulk email sends continue without an open browser tab."""

from __future__ import annotations

import logging
import os
import sys
import threading
import time

from django.db import close_old_connections
from django.utils import timezone

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_wake = threading.Event()
_thread: threading.Thread | None = None
_started = False

# How often the idle worker wakes to check for due batches.
_IDLE_POLL_SECONDS = 15
_MAX_SLEEP_SECONDS = 60


def _should_autostart() -> bool:
    """Skip worker during migrate/shell/tests and the runserver reloader parent."""
    argv = " ".join(sys.argv).lower()
    skip_cmds = (
        "migrate",
        "makemigrations",
        "shell",
        "test",
        "collectstatic",
        "flush",
        "dumpdata",
        "loaddata",
    )
    if any(cmd in argv for cmd in skip_cmds):
        return False
    # Django runserver spawns a parent + child; only the child has RUN_MAIN=true.
    if "runserver" in argv and os.environ.get("RUN_MAIN") != "true":
        return False
    return True


def ensure_broadcast_worker_started(*, force: bool = False) -> None:
    """Start the daemon worker thread once (idempotent)."""
    global _started, _thread
    if not force and not _should_autostart():
        return
    with _lock:
        if _started and _thread is not None and _thread.is_alive():
            return
        _started = True
        _thread = threading.Thread(
            target=_worker_loop,
            name="email-broadcast-worker",
            daemon=True,
        )
        _thread.start()
        logger.info("Email broadcast background worker started")


def kick_broadcast_worker() -> None:
    """Wake the worker immediately (e.g. after send/resume)."""
    ensure_broadcast_worker_started(force=True)
    _wake.set()


def _seconds_until_next_work() -> float:
    from .broadcast_engine import next_batch_at
    from .models import EmailBroadcast

    close_old_connections()
    try:
        sending = list(
            EmailBroadcast.objects.filter(status=EmailBroadcast.Status.SENDING).only(
                "id",
                "status",
                "last_batch_at",
                "batch_interval_minutes",
                "batch_email_count",
                "pending_count",
            )
        )
        scheduled = list(
            EmailBroadcast.objects.filter(
                status=EmailBroadcast.Status.SCHEDULED,
                scheduled_at__isnull=False,
            ).only("id", "scheduled_at")
        )
    except Exception:  # noqa: BLE001
        logger.exception("broadcast worker: failed to query broadcasts")
        return float(_IDLE_POLL_SECONDS)

    if not sending and not scheduled:
        return float(_IDLE_POLL_SECONDS)

    now = timezone.now()
    soonest: float | None = None
    for broadcast in sending:
        at = next_batch_at(broadcast)
        if at is None:
            return 0.5
        wait = (at - now).total_seconds()
        if wait <= 0:
            return 0.5
        if soonest is None or wait < soonest:
            soonest = wait
    for broadcast in scheduled:
        at = broadcast.scheduled_at
        if at is None:
            return 0.5
        wait = (at - now).total_seconds()
        if wait <= 0:
            return 0.5
        if soonest is None or wait < soonest:
            soonest = wait
    return min(soonest if soonest is not None else _IDLE_POLL_SECONDS, _MAX_SLEEP_SECONDS)


def _process_all_sending() -> None:
    from .broadcast_engine import process_broadcast_chunk, start_due_scheduled_broadcasts
    from .models import EmailBroadcast

    close_old_connections()
    try:
        start_due_scheduled_broadcasts()
    except Exception:  # noqa: BLE001
        logger.exception("broadcast worker: failed to start scheduled broadcasts")
    ids = list(
        EmailBroadcast.objects.filter(status=EmailBroadcast.Status.SENDING)
        .order_by("id")
        .values_list("id", flat=True)
    )
    for pk in ids:
        close_old_connections()
        try:
            broadcast = EmailBroadcast.objects.filter(pk=pk).first()
            if not broadcast or broadcast.status != EmailBroadcast.Status.SENDING:
                continue
            process_broadcast_chunk(broadcast)
        except Exception:  # noqa: BLE001
            logger.exception("broadcast worker: failed processing broadcast id=%s", pk)


def _worker_loop() -> None:
    # Brief delay so Django finishes bootstrapping connections.
    time.sleep(1.5)
    while True:
        _wake.clear()
        try:
            _process_all_sending()
        except Exception:  # noqa: BLE001
            logger.exception("broadcast worker: unexpected loop error")
        finally:
            close_old_connections()

        wait = _seconds_until_next_work()
        # Wait for timeout or an explicit kick (send/resume).
        _wake.wait(timeout=max(0.5, wait))


def recover_sending_broadcasts_on_startup() -> None:
    """Ensure any in-progress sends resume after a server restart."""
    if not _should_autostart():
        return

    def _deferred() -> None:
        # Avoid querying during AppConfig.ready() (Django warns / connections not ready).
        time.sleep(2.0)
        try:
            from .models import EmailBroadcast

            close_old_connections()
            count = EmailBroadcast.objects.filter(
                status__in=(
                    EmailBroadcast.Status.SENDING,
                    EmailBroadcast.Status.SCHEDULED,
                )
            ).count()
            if count:
                logger.info(
                    "Found %s active broadcast(s); starting background worker",
                    count,
                )
                kick_broadcast_worker()
            else:
                ensure_broadcast_worker_started()
        except Exception:  # noqa: BLE001
            logger.debug("broadcast worker startup recovery skipped", exc_info=True)

    threading.Thread(
        target=_deferred,
        name="email-broadcast-worker-boot",
        daemon=True,
    ).start()
