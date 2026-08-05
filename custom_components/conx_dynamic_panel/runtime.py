"""Typed per-entry runtime state."""

from __future__ import annotations

import asyncio
from collections.abc import Callable, Coroutine
from dataclasses import dataclass, field
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .adapters.base import PanelAdapter
from .const import COVER_DEFAULT_ID
from .models import EntityMapping
from .storage import PanelStore
from .suppression import SuppressionTracker

type UnloadCallback = Callable[[], Coroutine[Any, Any, None] | None]


@dataclass(slots=True)
class MomentaryRuntime:
    """Live timed-pulse state for momentary_mix buttons on one panel entry.

    Each momentary button may have at most one armed OFF timer handle
    (``asyncio.TimerHandle`` from ``loop.call_later``). ``tokens`` identify
    the active pulse so a late expiry cannot kill a newer press. ``lock``
    serializes press/timer/abort decisions.
    """

    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    timers: dict[int, asyncio.TimerHandle] = field(default_factory=dict)
    tokens: dict[int, object] = field(default_factory=dict)

    def cancel_timer(self, index: int) -> None:
        """Cancel and drop the pulse timer for one button, if any."""
        handle = self.timers.pop(index, None)
        self.tokens.pop(index, None)
        if handle is not None and not handle.cancelled():
            handle.cancel()

    def cancel_all(self) -> None:
        """Cancel every armed pulse timer without touching hardware."""
        for index in list(self.timers):
            self.cancel_timer(index)


@dataclass(slots=True)
class CoverMotion:
    """Live motion state for one cover mapping on a panel entry."""

    cover_id: str = COVER_DEFAULT_ID
    direction: str | None = None
    timer: asyncio.Task[None] | None = None
    started_at: float | None = None
    duration: float | None = None
    last_reason: str | None = None
    # Relay pair that was energized last, kept so a halt can de-energize the
    # right buttons even after the profile or its mapping changed.
    relays: tuple[int, int] | None = None

    @property
    def moving(self) -> bool:
        """Whether a travel timer is currently armed for this cover."""
        return self.direction is not None

    def reset(self, reason: str | None = None) -> None:
        """Clear motion bookkeeping without touching hardware."""
        self.direction = None
        self.timer = None
        self.started_at = None
        self.duration = None
        self.relays = None
        if reason is not None:
            self.last_reason = reason


@dataclass(slots=True)
class CoverRuntime:
    """Live cover/shutter motion state for one panel entry.

    ``lock`` serializes every relay decision so two presses can never interleave
    and leave both direction relays of the same cover energized. Different
    covers may travel at the same time because each keeps its own motion state.
    """

    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    motions: dict[str, CoverMotion] = field(default_factory=dict)

    def get(self, cover_id: str) -> CoverMotion:
        """Return (creating if needed) motion state for a cover id."""
        motion = self.motions.get(cover_id)
        if motion is None:
            motion = CoverMotion(cover_id=cover_id)
            self.motions[cover_id] = motion
        return motion

    def _primary(self) -> CoverMotion:
        """Prefer a moving cover, else the first tracked cover, else cover_1."""
        for motion in self.motions.values():
            if motion.moving:
                return motion
        if self.motions:
            return next(iter(self.motions.values()))
        return self.get(COVER_DEFAULT_ID)

    @property
    def moving(self) -> bool:
        """Whether any cover is currently travelling."""
        return any(motion.moving for motion in self.motions.values())

    @property
    def direction(self) -> str | None:
        """Direction of the primary (moving-or-first) cover."""
        return self._primary().direction

    @property
    def timer(self) -> asyncio.Task[None] | None:
        """Travel timer of the primary cover."""
        return self._primary().timer

    @property
    def duration(self) -> float | None:
        """Travel duration of the primary cover."""
        return self._primary().duration

    @property
    def last_reason(self) -> str | None:
        """Last halt/start reason across the primary cover."""
        return self._primary().last_reason

    @property
    def relays(self) -> tuple[int, int] | None:
        """Last energized pair of the primary cover."""
        return self._primary().relays

    def reset_all(self, reason: str | None = None) -> None:
        """Clear every cover motion bookkeeping entry."""
        if not self.motions:
            self.get(COVER_DEFAULT_ID).reset(reason)
            return
        for motion in self.motions.values():
            motion.reset(reason)


@dataclass(slots=True)
class PanelRuntime:
    """Runtime objects owned by one config entry."""

    hass: HomeAssistant
    entry: ConfigEntry
    mapping: EntityMapping
    store: PanelStore
    adapter: PanelAdapter
    suppression: SuppressionTracker
    sync_lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    cover: CoverRuntime = field(default_factory=CoverRuntime)
    momentary: MomentaryRuntime = field(default_factory=MomentaryRuntime)
    unloading: bool = False
    listeners: list[Callable[[], None]] = field(default_factory=list)
    update_callbacks: list[Callable[[], None]] = field(default_factory=list)

    @property
    def auto_sync(self) -> bool:
        """Whether draft changes should sync immediately."""
        return bool(self.entry.options.get("auto_sync", False))

    @property
    def confirm_timeout(self) -> float:
        """Hardware confirmation timeout."""
        return float(self.entry.options.get("confirm_timeout", 10.0))

    @property
    def sync_timeout(self) -> float:
        """Overall sync operation timeout."""
        return float(self.entry.options.get("sync_timeout", 30.0))

    def async_add_listener(self, callback: Callable[[], None]) -> Callable[[], None]:
        """Register a UI/entity update callback."""
        self.update_callbacks.append(callback)

        def _remove() -> None:
            if callback in self.update_callbacks:
                self.update_callbacks.remove(callback)

        return _remove

    def async_notify(self) -> None:
        """Notify registered listeners of state changes."""
        for callback in list(self.update_callbacks):
            callback()
