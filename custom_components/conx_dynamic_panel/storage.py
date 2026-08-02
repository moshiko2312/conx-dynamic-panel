"""Versioned persistence for panel profiles and snapshots."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, STORAGE_KEY, STORAGE_VERSION
from .models import PanelStorageData

_LOGGER = logging.getLogger(__name__)


def _migrate(data: dict[str, Any]) -> dict[str, Any]:
    """Migrate storage payload to the current schema version."""
    version = int(data.get("schema_version") or 1)
    if version > STORAGE_VERSION:
        raise ValueError(
            f"Unsupported storage schema version {version}; current is {STORAGE_VERSION}"
        )
    # Future migrations append here while preserving profiles and snapshots.
    data["schema_version"] = STORAGE_VERSION
    return data


class PanelStore:
    """Per-entry versioned store wrapper."""

    def __init__(self, hass: HomeAssistant, entry_id: str) -> None:
        self._hass = hass
        self._entry_id = entry_id
        self._store = Store(
            hass,
            STORAGE_VERSION,
            f"{STORAGE_KEY}_{entry_id}",
            private=True,
        )
        self.data = PanelStorageData()

    async def async_load(self) -> PanelStorageData:
        """Load or initialize storage."""
        raw = await self._store.async_load()
        if raw is None:
            self.data = PanelStorageData()
            self.data.ensure_defaults()
            await self.async_save()
            return self.data
        try:
            migrated = _migrate(dict(raw))
            self.data = PanelStorageData.from_dict(migrated)
            self.data.ensure_defaults()
        except Exception:  # noqa: BLE001
            _LOGGER.exception(
                "Failed to load %s storage for %s; keeping defaults without overwrite",
                DOMAIN,
                self._entry_id,
            )
            self.data = PanelStorageData()
            self.data.ensure_defaults()
            return self.data
        return self.data

    async def async_save(self) -> None:
        """Persist current in-memory storage atomically."""
        await self._store.async_save(self.data.to_dict())
