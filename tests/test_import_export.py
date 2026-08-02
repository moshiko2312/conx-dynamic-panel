"""Tests for profile import/export."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.models import (
    EntityMapping,
    HardwareState,
    PanelStorageData,
    Profile,
    SyncResult,
)
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
    hass = SimpleNamespace(
        services=SimpleNamespace(
            has_service=lambda domain, service: True,
            async_call=AsyncMock(),
        ),
        bus=SimpleNamespace(async_fire=lambda *args, **kwargs: None),
        async_create_task=lambda coro: asyncio.create_task(coro),
    )
    entry = SimpleNamespace(entry_id="entry-1", options={"auto_sync": False})
    return SimpleNamespace(
        hass=hass,
        entry=entry,
        mapping=mapping,
        store=store,
        adapter=adapter,
        suppression=SuppressionTracker(),
        sync_lock=asyncio.Lock(),
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
    assert payload["schema_version"] == 1
    assert "lighting" in payload["profiles"]
    assert payload["active_profile_id"] == "lighting"


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
                    "buttons": [
                        {"index": i, "name": f"G{i}", "action": None} for i in range(1, 5)
                    ],
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
                    "buttons": [
                        {"index": i, "name": f"B{i}", "action": None} for i in range(1, 5)
                    ],
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
