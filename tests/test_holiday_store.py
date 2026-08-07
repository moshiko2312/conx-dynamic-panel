"""Holiday store load / HA Store version migration regression tests."""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from homeassistant.helpers.storage import Store

from custom_components.conx_dynamic_panel.const import (
    HOLIDAY_STORAGE_KEY,
    HOLIDAY_STORAGE_VERSION,
    STORAGE_VERSION,
)
from custom_components.conx_dynamic_panel.holiday_store import (
    HolidayStore,
    migrate_holiday_payload,
)
from custom_components.conx_dynamic_panel.storage import PanelStore


def test_migrate_holiday_payload_v1_global_to_master() -> None:
    migrated = migrate_holiday_payload(1, {"holiday_mode": True})
    assert migrated == {"master_holiday": True, "holiday_mode": True}


def test_migrate_holiday_payload_v2_roundtrip() -> None:
    migrated = migrate_holiday_payload(
        HOLIDAY_STORAGE_VERSION, {"master_holiday": False, "holiday_mode": False}
    )
    assert migrated["master_holiday"] is False
    assert migrated["holiday_mode"] is False


@pytest.mark.asyncio
async def test_plain_store_raises_on_major_version_mismatch() -> None:
    """Reproduce the HA failure mode: Store without migrator + version bump."""
    hass = SimpleNamespace()
    store = Store(hass, HOLIDAY_STORAGE_VERSION, HOLIDAY_STORAGE_KEY, private=True)
    store._envelope = {
        "version": 1,
        "minor_version": 1,
        "key": HOLIDAY_STORAGE_KEY,
        "data": {"holiday_mode": True},
    }
    with pytest.raises(NotImplementedError):
        await store.async_load()


@pytest.mark.asyncio
async def test_holiday_store_loads_legacy_v1_without_notimplemented() -> None:
    """Upgrade path: v0.2.0-era holiday file (Store version 1) must load."""
    hass = SimpleNamespace(data={})
    holiday = HolidayStore(hass)
    holiday._store._envelope = {
        "version": 1,
        "minor_version": 1,
        "key": HOLIDAY_STORAGE_KEY,
        "data": {"holiday_mode": True},
    }
    enabled = await holiday.async_load()
    assert enabled is True
    assert holiday.master_holiday is True
    # Migrator rewritten the envelope to the current Store version.
    assert holiday._store._envelope is not None
    assert holiday._store._envelope["version"] == HOLIDAY_STORAGE_VERSION
    assert holiday._store._envelope["data"]["master_holiday"] is True


@pytest.mark.asyncio
async def test_holiday_store_fresh_install_empty() -> None:
    hass = SimpleNamespace(data={})
    holiday = HolidayStore(hass)
    enabled = await holiday.async_load()
    assert enabled is False
    assert holiday.master_holiday is False


@pytest.mark.asyncio
async def test_holiday_store_roundtrip_current_version() -> None:
    hass = SimpleNamespace(data={})
    holiday = HolidayStore(hass)
    await holiday.async_set(True)
    reloaded = HolidayStore(hass)
    reloaded._store._envelope = holiday._store._envelope
    assert await reloaded.async_load() is True


@pytest.mark.asyncio
async def test_panel_store_version_mismatch_does_not_raise() -> None:
    """Panel Store version bumps must not crash setup (schema migrates in _migrate)."""
    hass = SimpleNamespace(data={}, config=SimpleNamespace(config_dir="/tmp"))
    panel = PanelStore(hass, "entry-tp4")
    panel._store._envelope = {
        "version": max(1, STORAGE_VERSION - 1),
        "minor_version": 1,
        "key": panel._store.key,
        "data": {
            "schema_version": max(1, STORAGE_VERSION - 1),
            "profiles": {
                "lighting": {"id": "lighting", "name": "Lighting"},
            },
            "active_profile_id": "lighting",
        },
    }
    data = await panel.async_load()
    assert data.profiles["lighting"].name == "Lighting"
    assert data.schema_version == STORAGE_VERSION
