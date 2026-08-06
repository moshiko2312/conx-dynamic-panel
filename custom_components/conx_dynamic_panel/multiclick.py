"""Multi-click (double) gesture classification for panel buttons.

Physical latching relays still toggle on every user tap. Integration-configured
Home Assistant actions are classified separately: when a double-click slot is
configured, edges within ``MULTI_CLICK_GAP_S`` are counted and only the matching
action runs once the idle gap elapses (classic deferred single — not single×N).

When a gesture classifies as double, the physical relay is restored to the state
**before** the first tap (with transition suppression), then only ``action_double``
runs. Single-click finalize does not restore — the normal hardware path already
applied. Momentary and cover-direction roles skip restore so those engines keep
ownership of the relay.

Suppressed (integration-generated) relay edges never reach this module.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

from .const import (
    BUTTON_ROLE_COVER_CLOSE,
    BUTTON_ROLE_COVER_OPEN,
    BUTTON_ROLE_MOMENTARY,
    CLICK_COUNT_DOUBLE,
    CLICK_COUNT_SINGLE,
    MODE_COVER,
    MODE_MIXED,
    MULTI_CLICK_GAP_S,
    MULTI_CLICK_MAX,
)
from .models import ButtonAction, ButtonConfig, Profile


@dataclass(slots=True)
class MultiClickPending:
    """In-flight multi-click gesture for one button."""

    count: int = 0
    last_relay_state: bool = False
    # Relay state prior to click 1 of this gesture (before the first edge applied).
    pre_relay_state: bool | None = None
    # Radio group member states prior to click 1 (this button uses pre_relay_state).
    pre_radio_states: dict[int, bool] | None = None
    profile_id: str = ""
    handle: asyncio.TimerHandle | None = None
    token: object | None = None


@dataclass(slots=True)
class MultiClickRuntime:
    """Per-button pending multi-click gestures for one panel entry."""

    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    pending: dict[int, MultiClickPending] = field(default_factory=dict)
    gap_s: float = MULTI_CLICK_GAP_S

    def cancel(self, index: int) -> None:
        """Cancel and drop the pending gesture for one button."""
        entry = self.pending.pop(index, None)
        if entry is None:
            return
        if entry.handle is not None and not entry.handle.cancelled():
            entry.handle.cancel()

    def cancel_all(self) -> None:
        """Cancel every pending multi-click timer without firing actions."""
        for index in list(self.pending):
            self.cancel(index)


def classify_click_count(count: int, *, max_count: int = MULTI_CLICK_MAX) -> int:
    """Clamp a raw edge count to a final 1..max gesture class."""
    if count < 1:
        return CLICK_COUNT_SINGLE
    return min(int(count), max_count)


def button_has_multi_click(button: ButtonConfig | None) -> bool:
    """Whether deferred multi-click classification is enabled for the button."""
    if button is None:
        return False
    return button.action_double is not None


def should_restore_relay_after_double(profile: Profile, index: int) -> bool:
    """Whether double-click finalize may rewrite the physical relay.

    Momentary pulses and cover direction roles own the relay; restoring would
    fight those engines. Toggle / radio (and non-cover buttons) restore.
    """
    if profile.mode == MODE_COVER:
        return profile.cover_for_button(index) is None
    if profile.mode == MODE_MIXED:
        role = profile.button_role(index)
        if role in {
            BUTTON_ROLE_MOMENTARY,
            BUTTON_ROLE_COVER_OPEN,
            BUTTON_ROLE_COVER_CLOSE,
        }:
            return False
    return True


def action_for_click_count(button: ButtonConfig, click_count: int) -> ButtonAction | None:
    """Return the configured action for a finalized click count (or None)."""
    classified = classify_click_count(click_count)
    if classified == CLICK_COUNT_DOUBLE:
        return button.action_double
    return button.action


def edges_within_gap(
    timestamps: list[float],
    *,
    gap_s: float = MULTI_CLICK_GAP_S,
    max_count: int = MULTI_CLICK_MAX,
) -> int:
    """Classify a sequence of edge timestamps into a final click count.

    Counts consecutive edges whose gaps are ``<= gap_s``, starting from the
    first edge. Used by unit tests and as the pure timing contract.
    """
    if not timestamps:
        return 0
    ordered = sorted(timestamps)
    count = 1
    for previous, current in zip(ordered, ordered[1:], strict=False):
        if current - previous > gap_s:
            break
        count += 1
        if count >= max_count:
            return max_count
    return count


def pending_token() -> object:
    """Fresh identity token so a late timer cannot finalize a newer gesture."""
    return object()
