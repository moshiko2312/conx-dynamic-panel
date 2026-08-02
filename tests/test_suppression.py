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
