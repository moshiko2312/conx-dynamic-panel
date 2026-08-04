"""Expected transition tracker for feedback-loop protection."""

from __future__ import annotations

import time
from dataclasses import dataclass


@dataclass(slots=True)
class ExpectedTransition:
    """One expected relay transition produced by the integration."""

    expected_state: str
    expires_at: float
    operation_id: str


class SuppressionTracker:
    """Track and consume integration-generated relay transitions."""

    def __init__(self) -> None:
        self._expected: dict[str, ExpectedTransition] = {}

    def register(
        self,
        entity_id: str,
        expected_state: str,
        *,
        operation_id: str,
        ttl: float = 15.0,
    ) -> None:
        """Register an expected transition before a service call."""
        self.cleanup()
        self._expected[entity_id] = ExpectedTransition(
            expected_state=expected_state,
            expires_at=time.monotonic() + ttl,
            operation_id=operation_id,
        )

    def should_suppress(self, entity_id: str, new_state: str) -> bool:
        """Consume and suppress a matching expected transition.

        A transition to a different state proves the expectation can no longer
        arrive (a write that never produced an event, or hardware drift), so the
        stale entry is dropped instead of swallowing a later physical press.
        """
        self.cleanup()
        expected = self._expected.pop(entity_id, None)
        if expected is None:
            return False
        if expected.expected_state != new_state:
            return False
        return expected.expires_at >= time.monotonic()

    def discard(self, entity_id: str) -> None:
        """Drop any pending expectation for one entity."""
        self._expected.pop(entity_id, None)

    def cleanup(self) -> None:
        """Remove expired entries lazily."""
        now = time.monotonic()
        expired = [key for key, value in self._expected.items() if value.expires_at < now]
        for key in expired:
            self._expected.pop(key, None)

    def clear(self) -> None:
        """Clear all tracked transitions."""
        self._expected.clear()
