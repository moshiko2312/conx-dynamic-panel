"""Tests for multi-click classification and deferred action routing."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.const import (
    ATTR_CLICK_COUNT,
    BUTTON_ROLE_MOMENTARY,
    BUTTON_ROLE_TOGGLE,
    EVENT_BUTTON_PRESS,
    MODE_COVER,
    MODE_MIXED,
    MODE_RADIO_MANDATORY,
    MODE_TOGGLE,
    MULTI_CLICK_GAP_S,
)
from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.models import (
    ButtonAction,
    ButtonConfig,
    CoverConfig,
    EntityMapping,
    HardwareState,
    PanelStorageData,
    SyncResult,
)
from custom_components.conx_dynamic_panel.multiclick import (
    action_for_click_count,
    button_has_multi_click,
    classify_click_count,
    edges_within_gap,
    should_restore_relay_after_double,
)
from custom_components.conx_dynamic_panel.runtime import (
    CoverRuntime,
    MomentaryRuntime,
    MultiClickRuntime,
)
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker


def test_edges_within_gap_classifies_single_double() -> None:
    gap = MULTI_CLICK_GAP_S
    assert edges_within_gap([0.0]) == 1
    assert edges_within_gap([0.0, 0.2]) == 2
    assert edges_within_gap([0.0, 0.2, 0.35]) == 2  # capped at double
    assert edges_within_gap([0.0, gap + 0.01]) == 1
    assert edges_within_gap([0.0, 0.1, gap + 0.2]) == 2


def test_action_for_click_count_is_mutually_exclusive() -> None:
    button = ButtonConfig(
        index=1,
        name="L1",
        action=ButtonAction(action="light.toggle", target={}, data={}),
        action_double=ButtonAction(action="scene.turn_on", target={}, data={}),
    )
    assert button_has_multi_click(button)
    assert action_for_click_count(button, 1).action == "light.toggle"  # type: ignore[union-attr]
    assert action_for_click_count(button, 2).action == "scene.turn_on"  # type: ignore[union-attr]
    assert action_for_click_count(button, 3).action == "scene.turn_on"  # type: ignore[union-attr]
    assert classify_click_count(99) == 2


def test_button_config_roundtrip_preserves_multi_click() -> None:
    button = ButtonConfig(
        index=2,
        name="Kitchen",
        action=ButtonAction(action="switch.toggle", target={"entity_id": "switch.a"}),
        action_double=ButtonAction(action="light.turn_on", target={"entity_id": "light.b"}),
    )
    restored = ButtonConfig.from_dict(button.to_dict())
    assert restored.action is not None
    assert restored.action.action == "switch.toggle"
    assert restored.action_double is not None
    assert restored.action_double.action == "light.turn_on"
    assert "action_triple" not in button.to_dict()


def test_legacy_action_triple_is_dropped_on_load() -> None:
    restored = ButtonConfig.from_dict(
        {
            "index": 1,
            "name": "L1",
            "action": {"action": "light.toggle", "target": {}, "data": {}},
            "action_double": None,
            "action_triple": {"action": "script.panic", "target": {}, "data": {}},
        }
    )
    assert (
        not hasattr(restored, "action_triple") or getattr(restored, "action_triple", None) is None
    )
    assert "action_triple" not in restored.to_dict()
    assert not button_has_multi_click(restored)


def test_should_restore_skips_momentary_and_cover_roles() -> None:
    store = FakeStore()
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_MIXED  # type: ignore[assignment]
    profile.buttons[0].role = BUTTON_ROLE_MOMENTARY  # type: ignore[assignment]
    profile.buttons[1].role = BUTTON_ROLE_TOGGLE  # type: ignore[assignment]
    assert should_restore_relay_after_double(profile, 1) is False
    assert should_restore_relay_after_double(profile, 2) is True

    profile.mode = MODE_COVER  # type: ignore[assignment]
    profile.covers = [
        CoverConfig(id="cover_1", open_button=1, close_button=2, open_time_s=10, close_time_s=10)
    ]
    assert should_restore_relay_after_double(profile, 1) is False
    assert should_restore_relay_after_double(profile, 3) is True


class FakeStore:
    def __init__(self) -> None:
        self.data = PanelStorageData()
        self.data.ensure_defaults()
        self.saved = 0

    async def async_save(self) -> None:
        self.saved += 1


class FakeAdapter:
    def __init__(self) -> None:
        self.relay_calls: list[tuple[int, bool, bool]] = []
        self._relays = {1: False, 2: False, 3: False, 4: False}
        self.apply_result = SyncResult(success=True, confirmed_steps=["names"])
        self.hardware = HardwareState(
            names=("A", "B", "C", "D"),
            relays=(False, False, False, False),
            color_on="cyan",
            color_off="blue",
            radar="30s",
            backlight=True,
            child_lock=False,
        )

    async def async_apply_profile(self, profile: Any) -> SyncResult:
        return self.apply_result

    async def async_set_relay(
        self, index: int, state: bool, *, suppress_event: bool = True
    ) -> None:
        self.relay_calls.append((index, state, suppress_event))
        self._relays[index] = state

    def relay_is_on(self, index: int) -> bool:
        return bool(self._relays.get(index, False))

    async def async_read_hardware_state(self) -> HardwareState:
        return self.hardware


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
    events: list[tuple[str, dict[str, Any]]] = []
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    hass = SimpleNamespace(
        services=SimpleNamespace(
            has_service=lambda domain, service: True,
            async_call=AsyncMock(),
        ),
        bus=SimpleNamespace(async_fire=lambda event, data: events.append((event, data))),
        async_create_task=lambda coro: asyncio.create_task(coro),
        loop=loop,
    )
    entry = SimpleNamespace(entry_id="entry-1", options={"auto_sync": False})
    runtime = SimpleNamespace(
        hass=hass,
        entry=entry,
        mapping=mapping,
        store=store,
        adapter=adapter,
        suppression=SuppressionTracker(),
        sync_lock=asyncio.Lock(),
        cover=CoverRuntime(),
        momentary=MomentaryRuntime(),
        multiclick=MultiClickRuntime(gap_s=0.05),
        unloading=False,
        listeners=[],
        update_callbacks=[],
        auto_sync=False,
        sync_timeout=30.0,
        confirm_timeout=10.0,
        async_notify=lambda: None,
    )
    runtime._events = events  # type: ignore[attr-defined]
    return runtime


async def _physical_press(
    coordinator: PanelCoordinator, adapter: FakeAdapter, index: int, turned_on: bool
) -> None:
    """Simulate a physical edge that already flipped the mapped relay."""
    adapter._relays[index] = turned_on
    await coordinator._async_handle_physical_press(index, turned_on)


@pytest.mark.asyncio
async def test_without_multi_click_toggle_fires_immediately() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_TOGGLE  # type: ignore[assignment]
    profile.buttons[0].action = ButtonAction(action="light.toggle", target={})
    profile.buttons[0].action_double = None
    await _physical_press(coordinator, adapter, 1, True)
    runtime.hass.services.async_call.assert_awaited_once()
    assert runtime.multiclick.pending == {}


@pytest.mark.asyncio
async def test_double_click_restores_relay_then_runs_only_double_action() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_TOGGLE  # type: ignore[assignment]
    profile.buttons[0].action = ButtonAction(action="light.toggle", target={})
    profile.buttons[0].action_double = ButtonAction(action="scene.double", target={})

    # Pre-gesture: OFF. Two taps → ON then OFF; restore must write OFF again.
    await _physical_press(coordinator, adapter, 1, True)
    await _physical_press(coordinator, adapter, 1, False)
    runtime.hass.services.async_call.assert_not_awaited()
    assert adapter.relay_calls == []

    await asyncio.sleep(0.08)
    runtime.hass.services.async_call.assert_awaited_once()
    args = runtime.hass.services.async_call.await_args
    assert args is not None
    assert args.args[0] == "scene"
    assert args.args[1] == "double"
    assert adapter.relay_calls == [(1, False, True)]
    assert adapter.relay_is_on(1) is False
    press_events = [item for item in runtime._events if item[0] == EVENT_BUTTON_PRESS]
    assert len(press_events) == 1
    assert press_events[0][1][ATTR_CLICK_COUNT] == 2
    assert press_events[0][1]["new_relay_state"] == "off"


@pytest.mark.asyncio
async def test_single_click_does_not_restore_relay() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_TOGGLE  # type: ignore[assignment]
    profile.buttons[0].action = ButtonAction(action="light.single", target={})
    profile.buttons[0].action_double = ButtonAction(action="scene.double", target={})

    await _physical_press(coordinator, adapter, 1, True)
    await asyncio.sleep(0.08)

    runtime.hass.services.async_call.assert_awaited_once()
    args = runtime.hass.services.async_call.await_args
    assert args is not None
    assert args.args[0] == "light"
    assert args.args[1] == "single"
    assert adapter.relay_calls == []
    press_events = [item for item in runtime._events if item[0] == EVENT_BUTTON_PRESS]
    assert len(press_events) == 1
    assert press_events[0][1][ATTR_CLICK_COUNT] == 1
    assert press_events[0][1]["new_relay_state"] == "on"


@pytest.mark.asyncio
async def test_three_rapid_edges_cap_at_double_and_restore() -> None:
    """Extra edges beyond two still finalize as double (max clicks = 2)."""
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_TOGGLE  # type: ignore[assignment]
    profile.buttons[0].action = ButtonAction(action="light.single", target={})
    profile.buttons[0].action_double = ButtonAction(action="scene.double", target={})

    await _physical_press(coordinator, adapter, 1, True)
    await _physical_press(coordinator, adapter, 1, False)
    await _physical_press(coordinator, adapter, 1, True)
    await asyncio.sleep(0.08)

    runtime.hass.services.async_call.assert_awaited_once()
    args = runtime.hass.services.async_call.await_args
    assert args is not None
    assert args.args[0] == "scene"
    assert args.args[1] == "double"
    # Pre-gesture was OFF; restore writes OFF even after a third edge left it ON.
    assert adapter.relay_calls == [(1, False, True)]
    press_events = [item for item in runtime._events if item[0] == EVENT_BUTTON_PRESS]
    assert len(press_events) == 1
    assert press_events[0][1][ATTR_CLICK_COUNT] == 2


@pytest.mark.asyncio
async def test_radio_double_restores_group_without_breaking_exclusivity() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    adapter._relays = {1: True, 2: False, 3: False, 4: False}
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_RADIO_MANDATORY  # type: ignore[assignment]
    profile.selected_button = 1
    for button in profile.buttons:
        button.radio_member = True
    profile.buttons[1].action = ButtonAction(action="light.single", target={})
    profile.buttons[1].action_double = ButtonAction(action="scene.double", target={})

    # Two ON edges on L2 (after an intervening OFF so both edges are unsuppressed).
    await _physical_press(coordinator, adapter, 2, True)
    adapter._relays[2] = False
    await _physical_press(coordinator, adapter, 2, True)
    await asyncio.sleep(0.08)

    runtime.hass.services.async_call.assert_awaited_once()
    args = runtime.hass.services.async_call.await_args
    assert args is not None
    assert args.args[0] == "scene"
    assert args.args[1] == "double"
    # Restore group snapshot from before click 1: L2 OFF, L1 ON.
    assert (2, False, True) in adapter.relay_calls
    assert (1, True, True) in adapter.relay_calls
    assert adapter.relay_is_on(1) is True
    assert adapter.relay_is_on(2) is False
    assert profile.selected_button == 1


@pytest.mark.asyncio
async def test_momentary_double_skips_relay_restore() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_MIXED  # type: ignore[assignment]
    profile.buttons[0].role = BUTTON_ROLE_MOMENTARY  # type: ignore[assignment]
    profile.buttons[0].pulse_time_s = 5.0
    profile.buttons[0].action = ButtonAction(action="light.single", target={})
    profile.buttons[0].action_double = ButtonAction(action="scene.double", target={})

    # First ON arms pulse + starts multi-click. Force-off cancel path on re-press,
    # then a second ON continues the same pending gesture as click 2.
    await _physical_press(coordinator, adapter, 1, True)
    await _physical_press(coordinator, adapter, 1, False)  # cancel pulse; no multi-click note
    adapter.relay_calls.clear()
    await _physical_press(coordinator, adapter, 1, True)
    await asyncio.sleep(0.08)

    runtime.hass.services.async_call.assert_awaited_once()
    args = runtime.hass.services.async_call.await_args
    assert args is not None
    assert args.args[0] == "scene"
    assert args.args[1] == "double"
    # Momentary owns the relay — double finalize must not rewrite it.
    restore_calls = [call for call in adapter.relay_calls if call[2] is True and call[0] == 1]
    assert restore_calls == []


@pytest.mark.asyncio
async def test_cover_direction_press_does_not_use_multi_click_restore() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_COVER  # type: ignore[assignment]
    profile.covers = [
        CoverConfig(id="cover_1", open_button=1, close_button=2, open_time_s=30, close_time_s=30)
    ]
    profile.buttons[0].action = ButtonAction(action="light.single", target={})
    profile.buttons[0].action_double = ButtonAction(action="scene.double", target={})

    await _physical_press(coordinator, adapter, 1, True)
    await asyncio.sleep(0.08)

    # Cover engine handles the press; multi-click / HA action path is not used.
    runtime.hass.services.async_call.assert_not_awaited()
    assert runtime.multiclick.pending == {}


@pytest.mark.asyncio
async def test_suppressed_relay_edges_do_not_count_as_clicks() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_TOGGLE  # type: ignore[assignment]
    profile.buttons[0].action = ButtonAction(action="light.single", target={})
    profile.buttons[0].action_double = ButtonAction(action="scene.double", target={})

    old = SimpleNamespace(state="off")
    new = SimpleNamespace(state="on")
    runtime.suppression.register("switch.l1", "on", operation_id="self-write")
    event = SimpleNamespace(data={"entity_id": "switch.l1", "old_state": old, "new_state": new})
    await coordinator._async_handle_relay_event(event)
    assert runtime.multiclick.pending == {}
    runtime.hass.services.async_call.assert_not_awaited()

    # Real physical edge after suppression is cleared still works.
    await coordinator._async_handle_relay_event(event)
    await asyncio.sleep(0.08)
    runtime.hass.services.async_call.assert_awaited_once()
    args = runtime.hass.services.async_call.await_args
    assert args is not None
    assert args.args[0] == "light"
    assert args.args[1] == "single"
    assert adapter.relay_calls == []
