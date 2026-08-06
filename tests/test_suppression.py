"""Tests for transition suppression."""

from __future__ import annotations

import time

from custom_components.conx_dynamic_panel.suppression import SuppressionTracker


def test_matching_transition_is_consumed() -> None:
    tracker = SuppressionTracker()
    tracker.register("switch.l1", "on", operation_id="op1")
    assert tracker.should_suppress("switch.l1", "on") is True
    assert tracker.should_suppress("switch.l1", "on") is False


def test_mismatched_state_is_not_suppressed() -> None:
    tracker = SuppressionTracker()
    tracker.register("switch.l1", "on", operation_id="op1")
    assert tracker.should_suppress("switch.l1", "off") is False


def test_expired_transition_is_not_suppressed() -> None:
    tracker = SuppressionTracker()
    tracker.register("switch.l1", "on", operation_id="op1", ttl=0.01)
    time.sleep(0.02)
    assert tracker.should_suppress("switch.l1", "on") is False


def test_off_then_on_queue_keeps_both_expectations() -> None:
    """Cover halt OFF then reverse ON must both remain suppressible."""
    tracker = SuppressionTracker()
    tracker.register("switch.l3", "off", operation_id="halt")
    tracker.register("switch.l3", "on", operation_id="reverse")
    assert tracker.pending_count("switch.l3") == 2
    # Deferred OFF must not wipe the ON expectation (single-slot bug).
    assert tracker.should_suppress("switch.l3", "off") is True
    assert tracker.pending_count("switch.l3") == 1
    assert tracker.should_suppress("switch.l3", "on") is True
    assert tracker.pending_count("switch.l3") == 0


def test_on_before_off_in_queue_still_matches_both() -> None:
    """Out-of-order delivery: ON event before deferred OFF."""
    tracker = SuppressionTracker()
    tracker.register("switch.l3", "off", operation_id="halt")
    tracker.register("switch.l3", "on", operation_id="reverse")
    assert tracker.should_suppress("switch.l3", "on") is True
    assert tracker.should_suppress("switch.l3", "off") is True


def test_mismatch_clears_remaining_queue() -> None:
    tracker = SuppressionTracker()
    tracker.register("switch.l1", "off", operation_id="a")
    tracker.register("switch.l1", "on", operation_id="b")
    assert tracker.should_suppress("switch.l1", "unavailable") is False
    assert tracker.pending_count("switch.l1") == 0
