"""Versioned persistence for panel profiles and snapshots."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DEFAULT_GANG_COUNT, DOMAIN, STORAGE_KEY, STORAGE_VERSION
from .models import PanelStorageData, clamp_gang_count, normalize_covers

_LOGGER = logging.getLogger(__name__)


def _migrate_profile_covers(profile: dict[str, Any]) -> None:
    """Migrate a single ``cover`` object into ``covers[]`` and drop the legacy key."""
    gang_count = clamp_gang_count(profile.get("gang_count", DEFAULT_GANG_COUNT))
    profile["gang_count"] = gang_count
    if isinstance(profile.get("covers"), list):
        profile["covers"] = [
            cover.to_dict()
            for cover in normalize_covers(profile.get("covers"), gang_count=gang_count)
        ]
    else:
        legacy = profile.get("cover")
        profile["covers"] = [
            cover.to_dict() for cover in normalize_covers(None, legacy, gang_count=gang_count)
        ]
    profile.pop("cover", None)


def _migrate_v1_to_v2(data: dict[str, Any]) -> None:
    """Schema 1 → 2: ``cover`` → ``covers[]`` plus per-profile ``gang_count``."""
    profiles = data.get("profiles")
    if isinstance(profiles, dict):
        for profile in profiles.values():
            if isinstance(profile, dict):
                _migrate_profile_covers(profile)
    snapshot = data.get("applied_snapshot")
    if isinstance(snapshot, dict) and snapshot:
        _migrate_profile_covers(snapshot)


def _migrate(data: dict[str, Any]) -> dict[str, Any]:
    """Migrate storage payload to the current schema version."""
    version = int(data.get("schema_version") or 1)
    if version > STORAGE_VERSION:
        raise ValueError(
            f"Unsupported storage schema version {version}; current is {STORAGE_VERSION}"
        )
    if version < 2:
        _migrate_v1_to_v2(data)
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
        self.load_error: str | None = None

    async def async_load(self) -> PanelStorageData:
        """Load or initialize storage."""
        self.load_error = None
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
        except Exception as err:  # noqa: BLE001
            _LOGGER.exception(
                "Failed to load %s storage for %s; keeping defaults without overwrite",
                DOMAIN,
                self._entry_id,
            )
            self.load_error = (
                "Failed to load stored profiles; previous storage was preserved on disk "
                f"and defaults were loaded in memory only ({err})"
            )
            self.data = PanelStorageData()
            self.data.ensure_defaults()
            self.data.last_error = self.load_error
            return self.data
        return self.data

    async def async_save(self) -> None:
        """Persist current in-memory storage atomically."""
        await self._store.async_save(self.data.to_dict())
