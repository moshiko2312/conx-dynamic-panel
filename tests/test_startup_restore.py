"""Startup restore from applied snapshot and storage survival."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.const import (
    BUTTON_ROLE_MOMENTARY,
    MODE_MIXED,
    SYNC_ERROR,
    SYNC_OUT_OF_SYNC,
    SYNC_PENDING,
    SYNC_SYNCED,
)
from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.models import (
    ButtonConfig,
    EntityMapping,
    HardwareState,
    PanelStorageData,
    Profile,
    SyncResult,
)
from custom_components.conx_dynamic_panel.runtime import CoverRuntime, MomentaryRuntime, MultiClickRuntime
from custom_components.conx_dynamic_panel.storage import _migrate
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker


class FakeStore:
    def __init__(self, data: PanelStorageData | None = None) -> None:
        self.data = data or PanelStorageData()
        if not self.data.profiles:
            self.data.ensure_defaults()
        self.saved = 0
        self.loaded = 0

    async def async_load(self) -> PanelStorageData:
        self.loaded += 1
        return self.data

    async def async_save(self) -> None:
        self.saved += 1


class FakeAdapter:
    def __init__(self) -> None:
        self.apply_calls: list[Profile] = []
        self.apply_result = SyncResult(success=True, confirmed_steps=["names", "relays"])
        self.hardware = HardwareState(
            names=("Living room", "Kitchen", "Outdoor", "All off"),
            relays=(False, False, False, False),
            color_on="cyan",
            color_off="blue",
            radar="30s",
            backlight=True,
            child_lock=False,
            backlight_brightness=100,
        )
        self.relay_calls: list[tuple[int, bool]] = []

    async def async_apply_profile(self, profile: Profile) -> SyncResult:
        self.apply_calls.append(profile)
        return self.apply_result

    async def async_set_relay(
        self, index: int, state: bool, *, suppress_event: bool = True
    ) -> None:
        self.relay_calls.append((index, state))

    async def async_read_hardware_state(self) -> HardwareState:
        return self.hardware

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
        data={"conx_dynamic_panel": {"holiday_store": SimpleNamespace(holiday_mode=False, master_holiday=False)}},
        states=SimpleNamespace(get=lambda *_a, **_k: None),
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
async def test_setup_reapplies_applied_snapshot_not_draft() -> None:
    store = FakeStore()
    profile = store.data.active_profile()
    assert profile is not None
    store.data.applied_snapshot = profile.to_dict()
    # Dirty draft must not be what gets written to hardware on restart.
    profile.name = "Unsaved draft rename"
    profile.color_on = "red"
    store.data.sync_status = SYNC_PENDING  # type: ignore[assignment]

    adapter = FakeAdapter()
    # Hardware matches applied (cyan), not the dirty draft (red).
    adapter.hardware = HardwareState(
        names=tuple(b.name for b in Profile.from_dict(store.data.applied_snapshot).buttons),  # type: ignore[arg-type]
        relays=(False, False, False, False),
        color_on="cyan",
        color_off="blue",
        radar="30s",
        backlight=True,
        child_lock=False,
        backlight_brightness=100,
    )
    coordinator = PanelCoordinator(_runtime(adapter, store))  # type: ignore[arg-type]
    # Avoid attaching real HA listeners in unit tests.
    coordinator._attach_listeners = lambda: None  # type: ignore[method-assign]
    await coordinator.async_setup()

    assert adapter.apply_calls
    restored = adapter.apply_calls[0]
    assert restored.name == "Lighting"
    assert restored.color_on == "cyan"
    assert store.data.active_profile() is not None
    assert store.data.active_profile().name == "Unsaved draft rename"
    assert store.data.sync_status == SYNC_PENDING


@pytest.mark.asyncio
async def test_setup_without_snapshot_skips_reapply() -> None:
    store = FakeStore()
    store.data.applied_snapshot = {}
    adapter = FakeAdapter()
    coordinator = PanelCoordinator(_runtime(adapter, store))  # type: ignore[arg-type]
    coordinator._attach_listeners = lambda: None  # type: ignore[method-assign]
    await coordinator.async_setup()
    assert adapter.apply_calls == []


@pytest.mark.asyncio
async def test_setup_restore_failure_keeps_snapshot() -> None:
    store = FakeStore()
    profile = store.data.active_profile()
    assert profile is not None
    snapshot = profile.to_dict()
    store.data.applied_snapshot = snapshot
    adapter = FakeAdapter()
    adapter.apply_result = SyncResult(success=False, error="panel offline", confirmed_steps=[])
    coordinator = PanelCoordinator(_runtime(adapter, store))  # type: ignore[arg-type]
    coordinator._attach_listeners = lambda: None  # type: ignore[method-assign]
    await coordinator.async_setup()
    assert store.data.applied_snapshot == snapshot
    assert store.data.sync_status == SYNC_ERROR
    assert store.data.last_error == "panel offline"


def test_storage_roundtrip_preserves_mixed_roles() -> None:
    profile = Profile(
        id="mix",
        name="Mix",
        mode=MODE_MIXED,  # type: ignore[arg-type]
        buttons=[
            ButtonConfig(index=1, name="Pulse", role=BUTTON_ROLE_MOMENTARY, pulse_time_s=1.5),  # type: ignore[arg-type]
            ButtonConfig(index=2, name="Latch", role="toggle"),  # type: ignore[arg-type]
        ],
    )
    data = PanelStorageData(
        schema_version=2,
        active_profile_id="mix",
        profiles={"mix": profile},
        applied_snapshot=profile.to_dict(),
        sync_status=SYNC_SYNCED,  # type: ignore[arg-type]
    )
    restored = PanelStorageData.from_dict(data.to_dict())
    again = restored.profiles["mix"]
    assert again.mode == MODE_MIXED
    assert again.buttons[0].role == BUTTON_ROLE_MOMENTARY
    assert again.buttons[0].pulse_time_s == 1.5
    assert again.buttons[1].role == "toggle"
    assert restored.applied_snapshot["buttons"][0]["role"] == BUTTON_ROLE_MOMENTARY


def test_migrate_preserves_profiles_and_maps_momentary_mix_alias() -> None:
    migrated = _migrate(
        {
            "schema_version": 2,
            "active_profile_id": "mix",
            "profiles": {
                "mix": {
                    "id": "mix",
                    "name": "Mix",
                    "mode": "momentary_mix",
                    "buttons": [
                        {
                            "index": 1,
                            "name": "Gate",
                            "press_mode": "momentary",
                            "pulse_time_s": 3,
                        }
                    ],
                },
                "keep": {"id": "keep", "name": "Keep", "mode": "toggle"},
            },
            "applied_snapshot": {
                "id": "mix",
                "name": "Mix",
                "mode": "momentary_mix",
                "buttons": [{"index": 1, "name": "Gate", "press_mode": "momentary"}],
            },
        }
    )
    assert migrated["profiles"]["keep"]["name"] == "Keep"
    assert migrated["profiles"]["mix"]["mode"] == "mixed"
    assert migrated["profiles"]["mix"]["buttons"][0]["role"] == "momentary"
    assert migrated["applied_snapshot"]["mode"] == "mixed"
    data = PanelStorageData.from_dict(migrated)
    assert data.profiles["mix"].mode == MODE_MIXED
    assert data.profiles["mix"].buttons[0].is_momentary


@pytest.mark.asyncio
async def test_mapped_entity_drift_marks_out_of_sync() -> None:
    store = FakeStore()
    profile = store.data.active_profile()
    assert profile is not None
    store.data.applied_snapshot = profile.to_dict()
    store.data.sync_status = SYNC_SYNCED  # type: ignore[arg-type]
    adapter = FakeAdapter()
    adapter.hardware = HardwareState(
        names=("Living room", "Kitchen", "Outdoor", "All off"),
        relays=(False, False, False, False),
        color_on="red",  # drifted vs applied cyan
        color_off="blue",
        radar="30s",
        backlight=True,
        child_lock=False,
        backlight_brightness=100,
    )
    coordinator = PanelCoordinator(_runtime(adapter, store))  # type: ignore[arg-type]
    event = SimpleNamespace(
        data={
            "entity_id": "select.on",
            "old_state": SimpleNamespace(state="cyan"),
            "new_state": SimpleNamespace(state="red"),
        }
    )
    await coordinator._async_handle_mapped_entity_event(event)
    assert store.data.sync_status == SYNC_OUT_OF_SYNC
