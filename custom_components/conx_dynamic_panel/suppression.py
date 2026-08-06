"""Expected transition tracker for feedback-loop protection."""

from __future__ import annotations

import time
from collections import defaultdict, deque
from dataclasses import dataclass


@dataclass(slots=True)
class ExpectedTransition:
    """One expected relay transition produced by the integration."""

    expected_state: str
    expires_at: float
    operation_id: str


class SuppressionTracker:
    """Track and consume integration-generated relay transitions.

    Expectations are a FIFO queue per entity so rapid OFF→ON on the same
    relay (cover halt then reverse start) keeps both suppressions. A single
    slot previously let ``turn_on`` overwrite the halt ``turn_off``, so a
    deferred Zigbee/HA OFF event was treated as a physical stop and killed
    the newly energized direction.
    """

    def __init__(self) -> None:
        self._expected: dict[str, deque[ExpectedTransition]] = defaultdict(deque)

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
        self._expected[entity_id].append(
            ExpectedTransition(
                expected_state=expected_state,
                expires_at=time.monotonic() + ttl,
                operation_id=operation_id,
            )
        )

    def should_suppress(self, entity_id: str, new_state: str) -> bool:
        """Consume and suppress a matching expected transition.

        Scans the queue for the first matching non-expired expectation and
        removes only that entry so a later ON/OFF sibling stays armed.

        A transition that matches nothing proves hardware drifted or the user
        pressed physically, so the whole queue for that entity is dropped
        instead of swallowing a later real press.
        """
        self.cleanup()
        queue = self._expected.get(entity_id)
        if not queue:
            return False
        now = time.monotonic()
        for index, expected in enumerate(queue):
            if expected.expires_at < now:
                continue
            if expected.expected_state != new_state:
                continue
            del queue[index]
            if not queue:
                self._expected.pop(entity_id, None)
            return True
        # No match — clear stale expectations for this entity.
        self._expected.pop(entity_id, None)
        return False

    def discard(self, entity_id: str) -> None:
        """Drop any pending expectation for one entity."""
        self._expected.pop(entity_id, None)

    def cleanup(self) -> None:
        """Remove expired entries lazily."""
        now = time.monotonic()
        empty: list[str] = []
        for key, queue in self._expected.items():
            while queue and queue[0].expires_at < now:
                queue.popleft()
            # Also drop expired entries that are not at the head.
            alive = deque(item for item in queue if item.expires_at >= now)
            if alive:
                self._expected[key] = alive
            else:
                empty.append(key)
        for key in empty:
            self._expected.pop(key, None)

    def clear(self) -> None:
        """Clear all tracked transitions."""
        self._expected.clear()

    def pending_count(self, entity_id: str) -> int:
        """Return how many non-expired expectations remain for tests/debug."""
        self.cleanup()
        return len(self._expected.get(entity_id, ()))
