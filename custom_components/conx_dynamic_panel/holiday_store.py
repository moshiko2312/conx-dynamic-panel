"""Master holiday mode store (domain-wide; forces holiday on every panel).

Per-panel holiday lives on each entry's ``PanelStorageData.holiday_mode``.
Effective holiday for a panel is ``panel OR master``.

Migration: the previous global-only holiday flag is preserved as master holiday
(same storage key / ``holiday_mode`` field) so existing ON state keeps pausing
all schedulers after upgrade.

HA ``Store`` major version is ``HOLIDAY_STORAGE_VERSION`` (2). Version 1 on disk
(from the pre-master-holiday global flag) must migrate via ``_async_migrate_func``;
without that hook Home Assistant raises ``NotImplementedError`` on load.
"""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, HOLIDAY_STORAGE_KEY, HOLIDAY_STORAGE_VERSION

_LOGGER = logging.getLogger(__name__)


def migrate_holiday_payload(
    old_major_version: int, data: dict[str, Any] | None
) -> dict[str, Any]:
    """Normalize holiday store payload to the current on-disk shape.

    v1 stored only ``holiday_mode``. v2 uses ``master_holiday`` and keeps
    ``holiday_mode`` in sync for backups / older readers.
    """
    raw = dict(data) if isinstance(data, dict) else {}
    if old_major_version < 2 or "master_holiday" not in raw:
        enabled = bool(raw.get("master_holiday", raw.get("holiday_mode", False)))
    else:
        enabled = bool(raw.get("master_holiday"))
    return {
        "master_holiday": enabled,
        "holiday_mode": enabled,
    }


class _HolidayHAStore(Store):
    """HA Store with major-version migration (v1 global → v2 master holiday)."""

    async def _async_migrate_func(
        self,
        old_major_version: int,
        old_minor_version: int,
        old_data: dict[str, Any] | None,
    ) -> dict[str, Any]:
        _LOGGER.info(
            "Migrating %s holiday store from v%s.%s to v%s",
            DOMAIN,
            old_major_version,
            old_minor_version,
            HOLIDAY_STORAGE_VERSION,
        )
        return migrate_holiday_payload(old_major_version, old_data)


class HolidayStore:
    """Versioned domain-level master holiday flag (applies to all panels)."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass
        self._store = _HolidayHAStore(
            hass,
            HOLIDAY_STORAGE_VERSION,
            HOLIDAY_STORAGE_KEY,
            private=True,
        )
        # Master holiday — when True, every panel's scheduler is suspended.
        self.master_holiday = False

    async def async_load(self) -> bool:
        """Load master holiday from disk (legacy ``holiday_mode`` key supported)."""
        raw = await self._store.async_load()
        migrated = migrate_holiday_payload(
            HOLIDAY_STORAGE_VERSION,
            raw if isinstance(raw, dict) else None,
        )
        self.master_holiday = bool(migrated["master_holiday"])
        return self.master_holiday

    async def async_save(self) -> None:
        """Persist master holiday (write both keys for forward/back clarity)."""
        await self._store.async_save(
            {
                "master_holiday": self.master_holiday,
                # Keep legacy key in sync so older readers / backups stay coherent.
                "holiday_mode": self.master_holiday,
            }
        )

    async def async_set(self, enabled: bool) -> bool:
        """Set and persist master holiday; return the new value."""
        self.master_holiday = bool(enabled)
        await self.async_save()
        _LOGGER.info(
            "%s master holiday %s",
            DOMAIN,
            "ON" if self.master_holiday else "OFF",
        )
        return self.master_holiday

    @property
    def holiday_mode(self) -> bool:
        """Alias for legacy callers / HA switch ``is_on``."""
        return self.master_holiday

    @holiday_mode.setter
    def holiday_mode(self, value: bool) -> None:
        self.master_holiday = bool(value)


async def async_get_holiday_store(hass: HomeAssistant) -> HolidayStore:
    """Return the shared holiday store, loading it once per hass lifetime."""
    data = getattr(hass, "data", None)
    if not isinstance(data, dict):
        data = {}
        hass.data = data
    domain = data.setdefault(DOMAIN, {})
    store = domain.get("holiday_store")
    if isinstance(store, HolidayStore):
        return store
    store = HolidayStore(hass)
    await store.async_load()
    domain["holiday_store"] = store
    return store


def master_holiday_enabled(hass: HomeAssistant) -> bool:
    """Read master holiday without I/O (False until store is loaded)."""
    data = getattr(hass, "data", None)
    if not isinstance(data, dict):
        return False
    domain = data.get(DOMAIN) or {}
    store = domain.get("holiday_store")
    if isinstance(store, HolidayStore):
        return store.master_holiday
    return False


def holiday_mode_enabled(hass: HomeAssistant) -> bool:
    """Backward-compatible alias: master holiday (not per-panel effective)."""
    return master_holiday_enabled(hass)


def holiday_payload(hass: HomeAssistant) -> dict[str, Any]:
    """Frontend snippet for master holiday (panel effective is computed per entry)."""
    return {"master_holiday_mode": master_holiday_enabled(hass)}
