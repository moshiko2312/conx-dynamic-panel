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


def _normalize_button_roles(profile: dict[str, Any]) -> None:
    """Preserve additive mixed-mode fields; map legacy momentary_mix / press_mode."""
    if profile.get("mode") == "momentary_mix":
        profile["mode"] = "mixed"
    buttons = profile.get("buttons")
    if not isinstance(buttons, list):
        return
    for button in buttons:
        if not isinstance(button, dict):
            continue
        if button.get("role"):
            continue
        press_mode = str(button.get("press_mode") or "").strip().lower()
        if press_mode == "momentary":
            button["role"] = "momentary"
        elif press_mode:
            button["role"] = "toggle"


def _migrate_mixed_fields(data: dict[str, Any]) -> None:
    """Normalize mixed-mode aliases without dropping profiles or snapshots."""
    profiles = data.get("profiles")
    if isinstance(profiles, dict):
        for profile in profiles.values():
            if isinstance(profile, dict):
                _normalize_button_roles(profile)
    snapshot = data.get("applied_snapshot")
    if isinstance(snapshot, dict) and snapshot:
        _normalize_button_roles(snapshot)


def _migrate_v2_to_v3(data: dict[str, Any]) -> None:
    """Schema 2 → 3: default profile + per-panel scheduler tasks (preserve profiles)."""
    if "scheduler_tasks" not in data or not isinstance(data.get("scheduler_tasks"), dict):
        data["scheduler_tasks"] = {}
    profiles = data.get("profiles")
    active = data.get("active_profile_id")
    default = data.get("default_profile_id")
    if default and isinstance(profiles, dict) and default in profiles:
        data["default_profile_id"] = default
    elif active and isinstance(profiles, dict) and active in profiles:
        data["default_profile_id"] = active
    elif isinstance(profiles, dict) and profiles:
        data["default_profile_id"] = next(iter(profiles))
    else:
        data["default_profile_id"] = None


def _migrate_v3_to_v4(data: dict[str, Any]) -> None:
    """Schema 3 → 4: conditions + local scope on per-panel scheduler tasks."""
    raw_tasks = data.get("scheduler_tasks")
    if not isinstance(raw_tasks, dict):
        data["scheduler_tasks"] = {}
        return
    for key, value in raw_tasks.items():
        if not isinstance(value, dict):
            continue
        value.setdefault("id", key)
        value["scope"] = "local"
        value["entry_ids"] = []
        if "conditions" not in value or not isinstance(value.get("conditions"), list):
            value["conditions"] = []


def _migrate_v4_to_v5(data: dict[str, Any]) -> None:
    """Schema 4 → 5: per-panel holiday mode (schedulers suspended for this entry).

    Does not copy the old domain global holiday onto every panel — that flag
    migrates to *master* holiday in ``holiday_store`` and still pauses all
    panels when ON. Local default is False.
    """
    if "holiday_mode" not in data:
        data["holiday_mode"] = False
    else:
        data["holiday_mode"] = bool(data.get("holiday_mode"))


def _migrate(data: dict[str, Any]) -> dict[str, Any]:
    """Migrate storage payload to the current schema version."""
    version = int(data.get("schema_version") or 1)
    if version > STORAGE_VERSION:
        raise ValueError(
            f"Unsupported storage schema version {version}; current is {STORAGE_VERSION}"
        )
    if version < 2:
        _migrate_v1_to_v2(data)
    # Additive mixed-mode fields (role / pulse_time_s) — kept across versions.
    _migrate_mixed_fields(data)
    if version < 3:
        _migrate_v2_to_v3(data)
    if version < 4:
        _migrate_v3_to_v4(data)
    if version < 5:
        _migrate_v4_to_v5(data)
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
