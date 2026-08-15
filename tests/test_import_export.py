"""Tests for profile import/export."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.const import (
    PROFILES_EXPORT_SCHEMA_VERSION,
    STORAGE_VERSION,
)
from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.models import (
    EntityMapping,
    HardwareState,
    PanelStorageData,
    Profile,
    SyncResult,
)
from custom_components.conx_dynamic_panel.runtime import CoverRuntime, MomentaryRuntime, MultiClickRuntime
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker


class FakeStore:
    def __init__(self) -> None:
        self.data = PanelStorageData()
        self.data.ensure_defaults()
        self.saved = 0

    async def async_save(self) -> None:
        self.saved += 1


class FakeAdapter:
    async def async_apply_profile(self, profile: Profile) -> SyncResult:
        return SyncResult(success=True, confirmed_steps=["names"])

    async def async_set_relay(
        self, index: int, state: bool, *, suppress_event: bool = True
    ) -> None:
        return None

    async def async_read_hardware_state(self) -> HardwareState:
        return HardwareState(
            names=("A", "B", "C", "D"),
            relays=(False, False, False, False),
            color_on="cyan",
            color_off="blue",
            radar="30s",
            backlight=True,
            child_lock=False,
        )

    def supported_colors(self) -> list[str]:
        return ["cyan", "blue"]

    def supported_radar(self) -> list[str]:
        return ["30s"]


def _runtime(adapter: FakeAdapter, store: FakeStore) -> Any:
    mapping = EntityMapping(
        panel_name="Kitchen",
        adapter_type="zemismart_4gang",
        relay_entities=("switch.l1", "switch.l2", "switch.l3", "switch.l4"),
        name_entities=("text.n1", "text.n2", "text.n3", "text.n4"),
        color_off_entity="select.off",
        color_on_entity="select.on",
        radar_entity="select.radar",
        backlight_entity="switch.backlight",
        child_lock_entity="switch.lock",
    )
    updated = {"calls": []}

    def async_update_entry(entry, **kwargs):
        updated["calls"].append(kwargs)
        if "data" in kwargs:
            entry.data = kwargs["data"]
        if "title" in kwargs:
            entry.title = kwargs["title"]

    hass = SimpleNamespace(
        services=SimpleNamespace(
            has_service=lambda domain, service: True,
            async_call=AsyncMock(),
        ),
        bus=SimpleNamespace(
            async_fire=lambda *args, **kwargs: None,
            async_listen=lambda *args, **kwargs: (lambda: None),
        ),
        async_create_task=lambda coro: asyncio.create_task(coro),
        config_entries=SimpleNamespace(async_update_entry=async_update_entry),
        data={},
    )
    entry = SimpleNamespace(
        entry_id="entry-1",
        options={"auto_sync": False},
        data={},
        title="Kitchen",
    )
    hass._updated = updated
    return SimpleNamespace(
        hass=hass,
        entry=entry,
        mapping=mapping,
        store=store,
        adapter=adapter,
        suppression=SuppressionTracker(),
        sync_lock=asyncio.Lock(),
        cover=CoverRuntime(),
        momentary=MomentaryRuntime(),
        multiclick=MultiClickRuntime(),
        unloading=False,
        listeners=[],
        update_callbacks=[],
        auto_sync=False,
        sync_timeout=30.0,
        confirm_timeout=10.0,
        async_notify=lambda: None,
    )


@pytest.mark.asyncio
async def test_export_profiles_payload() -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    payload = coordinator.export_profiles()
    assert payload["schema_version"] == PROFILES_EXPORT_SCHEMA_VERSION
    assert PROFILES_EXPORT_SCHEMA_VERSION != STORAGE_VERSION
    assert "lighting" in payload["profiles"]
    assert payload["active_profile_id"] == "lighting"
    assert "scheduler_tasks" not in payload
    assert "applied_snapshot" not in payload
    assert "holiday_mode" not in payload
    assert "default_profile_id" not in payload


@pytest.mark.asyncio
async def test_import_profiles_merge() -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    await coordinator.async_import_profiles(
        {
            "profiles": {
                "guest": {
                    "id": "guest",
                    "name": "Guest",
                    "mode": "toggle",
                    "color_on": "cyan",
                    "color_off": "blue",
                    "radar": "30s",
                    "backlight": True,
                    "child_lock": False,
                    "selected_button": None,
                    "buttons": [{"index": i, "name": f"G{i}", "action": None} for i in range(1, 5)],
                }
            }
        },
        mode="merge",
    )
    assert "guest" in coordinator.data.profiles
    assert "lighting" in coordinator.data.profiles
    assert coordinator.data.profiles["guest"].buttons[0].name == "G1"


@pytest.mark.asyncio
async def test_import_profiles_replace() -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    await coordinator.async_import_profiles(
        {
            "active_profile_id": "only",
            "profiles": {
                "only": {
                    "id": "only",
                    "name": "Only",
                    "mode": "radio_optional",
                    "color_on": "cyan",
                    "color_off": "blue",
                    "radar": "30s",
                    "backlight": False,
                    "child_lock": True,
                    "selected_button": 1,
                    "buttons": [{"index": i, "name": f"B{i}", "action": None} for i in range(1, 5)],
                }
            },
        },
        mode="replace",
    )
    assert set(coordinator.data.profiles) == {"only"}
    assert coordinator.data.active_profile_id == "only"


@pytest.mark.asyncio
async def test_import_rejects_empty_profiles() -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    with pytest.raises(ValueError, match="non-empty"):
        await coordinator.async_import_profiles({"profiles": {}}, mode="merge")


@pytest.mark.asyncio
async def test_export_import_roundtrip() -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    exported = coordinator.export_profiles()
    assert exported["schema_version"] == PROFILES_EXPORT_SCHEMA_VERSION
    await coordinator.async_import_profiles(
        {
            "profiles": {
                "temp": {
                    "id": "temp",
                    "name": "Temp",
                    "mode": "toggle",
                    "color_on": "red",
                    "color_off": "blue",
                    "radar": "30s",
                    "backlight": True,
                    "child_lock": False,
                    "selected_button": None,
                    "buttons": [{"index": i, "name": f"T{i}", "action": None} for i in range(1, 5)],
                }
            }
        },
        mode="replace",
    )
    await coordinator.async_import_profiles(exported, mode="replace")
    again = coordinator.export_profiles()
    assert again["schema_version"] == exported["schema_version"]
    assert set(again["profiles"]) == set(exported["profiles"])
    assert again["profiles"]["lighting"]["name"] == exported["profiles"]["lighting"]["name"]
    assert again["active_profile_id"] == exported["active_profile_id"]


@pytest.mark.asyncio
async def test_export_import_roundtrip_preserves_mixed_and_actions() -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    await coordinator.async_import_profiles(
        {
            "schema_version": PROFILES_EXPORT_SCHEMA_VERSION,
            "active_profile_id": "rich",
            "profiles": {
                "rich": {
                    "id": "rich",
                    "name": "Rich",
                    "mode": "mixed",
                    "color_on": "cyan",
                    "color_off": "blue",
                    "radar": "30s",
                    "backlight": True,
                    "backlight_brightness": 75,
                    "child_lock": False,
                    "selected_button": None,
                    "gang_count": 4,
                    "buttons": [
                        {
                            "index": 1,
                            "name": "L1",
                            "role": "toggle",
                            "action": {
                                "action": "light.toggle",
                                "target": {"entity_id": "light.a"},
                                "data": {"brightness": 50},
                            },
                            "action_double": {
                                "action": "light.turn_off",
                                "target": {"entity_id": "light.a"},
                                "data": {},
                            },
                        },
                        {
                            "index": 2,
                            "name": "L2",
                            "role": "momentary",
                            "pulse_time_s": 1.5,
                            "action": None,
                        },
                        {
                            "index": 3,
                            "name": "Open",
                            "role": "cover_open",
                            "cover_id": "cover_1",
                            "action": None,
                        },
                        {
                            "index": 4,
                            "name": "Close",
                            "role": "cover_close",
                            "cover_id": "cover_1",
                            "action": None,
                        },
                    ],
                    "covers": [
                        {
                            "id": "cover_1",
                            "open_button": 3,
                            "close_button": 4,
                            "open_time_s": 20,
                            "close_time_s": 22,
                            "direction_settle_s": 0.5,
                            "opposite_press": "stop_then_reverse",
                            "ha_entity_id": "cover.living",
                        }
                    ],
                }
            },
        },
        mode="replace",
    )
    exported = coordinator.export_profiles()
    assert exported["schema_version"] == PROFILES_EXPORT_SCHEMA_VERSION
    b1 = exported["profiles"]["rich"]["buttons"][0]
    assert b1["action"]["data"]["brightness"] == 50
    assert b1["action_double"]["action"] == "light.turn_off"
    assert exported["profiles"]["rich"]["buttons"][1]["role"] == "momentary"
    assert exported["profiles"]["rich"]["buttons"][1]["pulse_time_s"] == 1.5
    assert exported["profiles"]["rich"]["covers"][0]["ha_entity_id"] == "cover.living"

    store2 = FakeStore()
    other = PanelCoordinator(_runtime(FakeAdapter(), store2))  # type: ignore[arg-type]
    await other.async_import_profiles(exported, mode="replace")
    again = other.export_profiles()
    assert again["profiles"]["rich"] == exported["profiles"]["rich"]
    assert again["active_profile_id"] == "rich"


@pytest.mark.asyncio
async def test_import_accepts_legacy_storage_stamped_schema_version_5() -> None:
    """Reproduce the card error: export wrote STORAGE_VERSION 5 as schema_version."""
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    assert STORAGE_VERSION == 5
    await coordinator.async_import_profiles(
        {
            "schema_version": 5,
            "active_profile_id": "guest",
            "profiles": {
                "guest": {
                    "id": "guest",
                    "name": "Guest",
                    "mode": "toggle",
                    "buttons": [
                        {"index": i, "name": f"G{i}", "action": None} for i in range(1, 5)
                    ],
                }
            },
            # Extra storage-dump fields must be ignored by profiles import.
            "scheduler_tasks": {},
            "applied_snapshot": {"id": "stale"},
            "holiday_mode": True,
            "default_profile_id": "guest",
        },
        mode="replace",
    )
    assert set(coordinator.data.profiles) == {"guest"}
    assert coordinator.data.active_profile_id == "guest"
    # Profiles import must not apply holiday / default from a storage dump.
    assert coordinator.data.holiday_mode is False


@pytest.mark.asyncio
async def test_import_accepts_profiles_array_and_schema_version() -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    await coordinator.async_import_profiles(
        {
            "schema_version": 1,
            "active_profile_id": "array_one",
            "profiles": [
                {
                    "id": "array_one",
                    "name": "Array One",
                    "mode": "toggle",
                    "color_on": "green",
                    "color_off": "blue",
                    "radar": "30s",
                    "backlight": True,
                    "child_lock": False,
                    "selected_button": None,
                    "buttons": [{"index": i, "name": f"A{i}", "action": None} for i in range(1, 5)],
                }
            ],
        },
        mode="replace",
    )
    assert set(coordinator.data.profiles) == {"array_one"}
    assert coordinator.data.active_profile_id == "array_one"


@pytest.mark.asyncio
async def test_import_rejects_future_schema_version() -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    with pytest.raises(ValueError, match="Unsupported export schema_version"):
        await coordinator.async_import_profiles(
            {
                "schema_version": 99,
                "profiles": {
                    "x": {
                        "id": "x",
                        "name": "X",
                        "mode": "toggle",
                        "buttons": [
                            {"index": i, "name": f"B{i}", "action": None} for i in range(1, 5)
                        ],
                    }
                },
            },
            mode="merge",
        )


@pytest.mark.asyncio
async def test_update_panel_name_updates_mapping_without_empty() -> None:
    store = FakeStore()
    runtime = _runtime(FakeAdapter(), store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    payload = await coordinator.async_update_panel_name("Salon")
    assert payload["panel_name"] == "Salon"
    assert runtime.mapping.panel_name == "Salon"
    assert coordinator.skip_next_reload is True or runtime.entry.title == "Salon"
    with pytest.raises(ValueError, match="cannot be empty"):
        await coordinator.async_update_panel_name("   ")
