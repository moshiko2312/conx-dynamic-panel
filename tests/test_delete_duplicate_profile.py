"""Tests for profile delete and duplicate (custom display name)."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.exceptions import ProfileNotFoundError
from custom_components.conx_dynamic_panel.models import (
    EntityMapping,
    HardwareState,
    PanelStorageData,
    Profile,
    ScheduleRange,
    SchedulerTask,
    SyncResult,
)
from custom_components.conx_dynamic_panel.runtime import (
    CoverRuntime,
    MomentaryRuntime,
    MultiClickRuntime,
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
    def __init__(self) -> None:
        self.apply_result = SyncResult(success=True, confirmed_steps=["names"])

    async def async_apply_profile(self, profile: Profile) -> SyncResult:
        return self.apply_result

    async def async_set_relay(
        self, index: int, state: bool, *, suppress_event: bool = True
    ) -> None:
        return None

    async def async_read_hardware_state(self) -> HardwareState:
        return HardwareState(
            names=("a", "b", "c", "d"),
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

    async def _noop(*_a: Any, **_k: Any) -> None:
        return None

    hass = SimpleNamespace(
        services=SimpleNamespace(has_service=lambda *_a, **_k: True, async_call=AsyncMock()),
        states=SimpleNamespace(get=lambda *_a, **_k: None),
        bus=SimpleNamespace(async_fire=_noop),
        data={"conx_dynamic_panel": {}},
        async_create_task=lambda coro: coro.close() if hasattr(coro, "close") else None,
        loop=SimpleNamespace(call_later=lambda *_a, **_k: None),
    )
    entry = SimpleNamespace(entry_id="entry-1", options={}, data={})
    return SimpleNamespace(
        hass=hass,
        entry=entry,
        mapping=mapping,
        store=store,
        adapter=adapter,
        suppression=SuppressionTracker(),
        sync_lock=__import__("asyncio").Lock(),
        cover=CoverRuntime(),
        momentary=MomentaryRuntime(),
        multiclick=MultiClickRuntime(),
        unloading=False,
        listeners=[],
        update_callbacks=[],
        auto_sync=False,
        confirm_timeout=5.0,
        sync_timeout=30.0,
        async_add_listener=lambda cb: (lambda: None),
        async_notify=lambda: None,
    )


@pytest.mark.asyncio
async def test_delete_profile_succeeds_and_reassigns_active_default(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeStore()
    store.data.active_profile_id = "scenes"
    store.data.default_profile_id = "scenes"
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_track_point_in_time",
        lambda *_a, **_k: (lambda: None),
    )

    await coordinator.async_delete_profile("scenes")

    assert "scenes" not in store.data.profiles
    assert "lighting" in store.data.profiles
    assert store.data.active_profile_id == "lighting"
    assert store.data.default_profile_id == "lighting"
    assert store.saved >= 1


@pytest.mark.asyncio
async def test_delete_last_profile_blocked() -> None:
    store = FakeStore()
    store.data.profiles = {"only": store.data.profiles["lighting"].clone("only", "Only")}
    store.data.active_profile_id = "only"
    store.data.default_profile_id = "only"
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))

    with pytest.raises(ValueError, match="At least one profile must remain"):
        await coordinator.async_delete_profile("only")
    assert "only" in store.data.profiles


@pytest.mark.asyncio
async def test_delete_profile_blocked_by_scheduler_lists_all_tasks() -> None:
    store = FakeStore()
    store.data.scheduler_tasks["day"] = SchedulerTask(
        id="day",
        name="Day shift",
        weekdays=list(range(7)),
        months=list(range(1, 13)),
        ranges=[ScheduleRange("08:00", "12:00", "scenes")],
    )
    store.data.scheduler_tasks["eve"] = SchedulerTask(
        id="eve",
        name="Evening",
        weekdays=list(range(7)),
        months=list(range(1, 13)),
        ranges=[ScheduleRange("17:00", "22:00", "scenes")],
    )
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))

    with pytest.raises(ValueError, match="Day shift") as err:
        await coordinator.async_delete_profile("scenes")
    message = str(err.value)
    assert "Evening" in message
    assert "scenes" in store.data.profiles


@pytest.mark.asyncio
async def test_delete_unknown_profile_raises() -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))
    with pytest.raises(ProfileNotFoundError):
        await coordinator.async_delete_profile("missing")


@pytest.mark.asyncio
async def test_duplicate_profile_persists_custom_name(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_track_point_in_time",
        lambda *_a, **_k: (lambda: None),
    )

    profile = await coordinator.async_duplicate_profile(
        "lighting", "lighting_copy_1", "Kitchen Evening"
    )

    assert profile.id == "lighting_copy_1"
    assert profile.name == "Kitchen Evening"
    assert store.data.profiles["lighting_copy_1"].name == "Kitchen Evening"
    # Source unchanged.
    assert store.data.profiles["lighting"].name == "Lighting"


@pytest.mark.asyncio
async def test_duplicate_profile_empty_name_falls_back(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_track_point_in_time",
        lambda *_a, **_k: (lambda: None),
    )

    profile = await coordinator.async_duplicate_profile("lighting", "lighting_copy_2", "   ")
    assert profile.name == "Lighting copy"


def test_profile_clone_custom_name_not_literal_copy() -> None:
    source = Profile(id="lighting", name="Lighting")
    cloned = source.clone("lighting_copy_9", "Guests night")
    assert cloned.name == "Guests night"
    assert cloned.id == "lighting_copy_9"
    blank = source.clone("lighting_copy_10", "")
    assert blank.name == "Lighting copy"
    empty_source = Profile(id="x", name="")
    assert empty_source.clone("y", None).name == "copy"
