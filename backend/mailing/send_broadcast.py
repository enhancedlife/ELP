"""Backward-compatible entry point; implementation lives in broadcast_engine."""

from .broadcast_engine import send_broadcast

__all__ = ["send_broadcast"]
