"""Card/service execute_button must drive physical relays like a press."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.const import (
    BUTTON_ROLE_MOMENTARY,
    BUTTON_ROLE_TOGGLE,
    MODE_MIXED,
    MODE_RADIO_OPTIONAL,
    MODE_TOGGLE,
)
from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.models import (
    ButtonAction,
    EntityMapping,
    HardwareState,
    PanelStorageData,
    SyncResult,
)
from custom_components.conx_dynamic_panel.runtime import CoverRuntime, MomentaryRuntime
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker


class FakeStore:
    def __init__(self) -> None:
        self.data = PanelStorageData()
        self.data.ensure_defaults()
        self.saved = 0

    async def async_save(self) -> None:
        self.saved += 1


class FakeAdapter:
    def __init__(self, states: dict[str, SimpleNamespace]) -> None:
        self.relay_calls: list[tuple[int, bool]] = []
        self._states = states
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
        self.relay_calls.append((index, state))
        entity_id = f"switch.l{index}"
        self._states[entity_id] = SimpleNamespace(state="on" if state else "off")

    async def async_read_hardware_state(self) -> HardwareState:
        return self.hardware


def _build(mode: str = MODE_TOGGLE) -> tuple[PanelCoordinator, FakeAdapter, FakeStore, Any]:
    store = FakeStore()
    states = {
        f"switch.l{i}": SimpleNamespace(state="off") for i in range(1, 5)
    }
    adapter = FakeAdapter(states)
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
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    hass = SimpleNamespace(
        services=SimpleNamespace(
            has_service=lambda domain, service: True,
            async_call=AsyncMock(),
        ),
        bus=SimpleNamespace(async_fire=lambda *args, **kwargs: None),
        async_create_task=lambda coro: asyncio.create_task(coro),
        loop=loop,
        states=SimpleNamespace(get=lambda entity_id: states.get(entity_id)),
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
        unloading=False,
        listeners=[],
        update_callbacks=[],
        auto_sync=False,
        sync_timeout=30.0,
        confirm_timeout=10.0,
        async_notify=lambda: None,
    )
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = mode  # type: ignore[assignment]
    profile.buttons[0].action = ButtonAction(
        action="light.toggle",
        target={"entity_id": "light.living"},
    )
    return coordinator, adapter, store, runtime


@pytest.mark.asyncio
async def test_execute_button_toggles_relay_and_runs_action() -> None:
    coordinator, adapter, _store, runtime = _build(MODE_TOGGLE)
    await coordinator.async_execute_button(1)
    assert (1, True) in adapter.relay_calls
    runtime.hass.services.async_call.assert_awaited_once()

    await coordinator.async_execute_button(1)
    assert adapter.relay_calls[-1] == (1, False)
    assert runtime.hass.services.async_call.await_count == 2


@pytest.mark.asyncio
async def test_execute_button_radio_selects_and_clears_others() -> None:
    coordinator, adapter, store, runtime = _build(MODE_RADIO_OPTIONAL)
    profile = store.data.active_profile()
    assert profile is not None
    profile.selected_button = 1
    profile.buttons[1].action = ButtonAction(
        action="switch.toggle",
        target={"entity_id": "switch.kitchen"},
    )
    adapter._states["switch.l1"] = SimpleNamespace(state="on")

    await coordinator.async_execute_button(2)
    assert (2, True) in adapter.relay_calls
    assert (1, False) in adapter.relay_calls
    assert profile.selected_button == 2
    runtime.hass.services.async_call.assert_awaited()

    # Re-press selected classic radio member: no-op.
    before = list(adapter.relay_calls)
    calls_before = runtime.hass.services.async_call.await_count
    await coordinator.async_execute_button(2)
    assert adapter.relay_calls == before
    assert runtime.hass.services.async_call.await_count == calls_before


@pytest.mark.asyncio
async def test_execute_button_momentary_pulses_on_then_off() -> None:
    coordinator, adapter, store, runtime = _build(MODE_MIXED)
    profile = store.data.active_profile()
    assert profile is not None
    profile.buttons[0].role = BUTTON_ROLE_MOMENTARY  # type: ignore[assignment]
    profile.buttons[0].pulse_time_s = 0.05
    profile.buttons[1].role = BUTTON_ROLE_TOGGLE  # type: ignore[assignment]

    await coordinator.async_execute_button(1)
    assert (1, True) in adapter.relay_calls
    assert 1 in runtime.momentary.timers
    runtime.hass.services.async_call.assert_awaited_once()

    await asyncio.sleep(0.08)
    assert (1, False) in adapter.relay_calls
    assert 1 not in runtime.momentary.timers


@pytest.mark.asyncio
async def test_execute_button_rejects_out_of_gang() -> None:
    coordinator, _adapter, store, _runtime = _build(MODE_TOGGLE)
    profile = store.data.active_profile()
    assert profile is not None
    profile.gang_count = 2
    with pytest.raises(ValueError, match="gang_count"):
        await coordinator.async_execute_button(3)
