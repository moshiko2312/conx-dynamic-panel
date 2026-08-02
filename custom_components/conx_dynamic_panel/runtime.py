"""Typed per-entry runtime state."""

from __future__ import annotations

import asyncio
from collections.abc import Callable, Coroutine
from dataclasses import dataclass, field
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .adapters.base import PanelAdapter
from .models import EntityMapping
from .storage import PanelStore
from .suppression import SuppressionTracker

type UnloadCallback = Callable[[], Coroutine[Any, Any, None] | None]


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
