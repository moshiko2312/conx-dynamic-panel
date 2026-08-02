"""Tests for toggle/radio behavior and sync recovery with fakes."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.const import (
    MODE_RADIO_MANDATORY,
    MODE_RADIO_OPTIONAL,
    MODE_TOGGLE,
    SYNC_ERROR,
    SYNC_SYNCED,
)
from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.models import (
    ButtonAction,
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
    def __init__(self) -> None:
        self.relay_calls: list[tuple[int, bool]] = []
        self.apply_result = SyncResult(success=True, confirmed_steps=["names"])

    async def async_apply_profile(self, profile: Profile) -> SyncResult:
        return self.apply_result

    async def async_set_relay(
        self, index: int, state: bool, *, suppress_event: bool = True
    ) -> None:
        self.relay_calls.append((index, state))

    async def async_read_hardware_state(self) -> HardwareState:
        return HardwareState(
            names=("A", "B", "C", "D"),
            relays=(True, False, False, False),
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
        async_notify=lambda: None,
    )


@pytest.mark.asyncio
async def test_toggle_executes_action_once() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_TOGGLE  # type: ignore[assignment]
    profile.buttons[0].action = ButtonAction(
        action="light.toggle",
        target={"entity_id": "light.living"},
    )
    await coordinator._async_handle_physical_press(1, True)
    runtime.hass.services.async_call.assert_awaited_once()


@pytest.mark.asyncio
async def test_radio_mandatory_turns_others_off_and_restores() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_RADIO_MANDATORY  # type: ignore[assignment]
    profile.buttons[1].action = ButtonAction(action="scene.turn_on", target={})
    await coordinator._async_handle_physical_press(2, True)
    assert profile.selected_button == 2
    assert (1, False) in adapter.relay_calls
    assert (3, False) in adapter.relay_calls
    adapter.relay_calls.clear()
    await coordinator._async_handle_physical_press(2, False)
    assert (2, True) in adapter.relay_calls


@pytest.mark.asyncio
async def test_radio_optional_allows_all_off() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_RADIO_OPTIONAL  # type: ignore[assignment]
    profile.selected_button = 1
    await coordinator._async_handle_physical_press(1, False)
    assert profile.selected_button is None
    assert adapter.relay_calls == []


@pytest.mark.asyncio
async def test_suppressed_transition_skips_action() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    runtime.suppression.register("switch.l1", "on", operation_id="x")
    event = SimpleNamespace(
        data={
            "entity_id": "switch.l1",
            "old_state": SimpleNamespace(state="off"),
            "new_state": SimpleNamespace(state="on"),
        }
    )
    await coordinator._async_handle_relay_event(event)
    runtime.hass.services.async_call.assert_not_awaited()


@pytest.mark.asyncio
async def test_sync_success_commits_snapshot() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    await coordinator.async_sync()
    assert store.data.sync_status == SYNC_SYNCED
    assert store.data.applied_snapshot["id"] == "lighting"
    assert store.data.last_error is None


@pytest.mark.asyncio
async def test_partial_sync_failure_preserves_snapshot() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    previous = {"id": "lighting", "name": "Previous"}
    store.data.applied_snapshot = previous
    adapter.apply_result = SyncResult(
        success=False, error="Timed out waiting for text.n1", confirmed_steps=["names"]
    )
    with pytest.raises(RuntimeError):
        await coordinator.async_sync()
    assert store.data.sync_status == SYNC_ERROR
    assert store.data.applied_snapshot == previous
    assert "Timed out" in (store.data.last_error or "")


@pytest.mark.asyncio
async def test_pull_updates_draft_names() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    await coordinator.async_pull_from_panel()
    profile = store.data.active_profile()
    assert profile is not None
    assert profile.button_names() == ("A", "B", "C", "D")
