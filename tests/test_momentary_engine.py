"""Tests for mixed-mode momentary (timed pulse) behavior."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.const import (
    BUTTON_ROLE_MOMENTARY,
    BUTTON_ROLE_TOGGLE,
    DEFAULT_PULSE_TIME,
    MODE_MIXED,
    MODE_TOGGLE,
    PULSE_TIME_MAX,
    PULSE_TIME_MIN,
)
from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.models import (
    ButtonAction,
    ButtonConfig,
    EntityMapping,
    HardwareState,
    PanelStorageData,
    Profile,
    SyncResult,
    clamp_pulse_time,
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
    def __init__(self) -> None:
        self.relay_calls: list[tuple[int, bool]] = []
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

    async def async_apply_profile(self, profile: Profile) -> SyncResult:
        return self.apply_result

    async def async_set_relay(
        self, index: int, state: bool, *, suppress_event: bool = True
    ) -> None:
        self.relay_calls.append((index, state))

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


def _mixed_profile(store: FakeStore) -> Profile:
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_MIXED  # type: ignore[assignment]
    profile.buttons[0].role = BUTTON_ROLE_MOMENTARY  # type: ignore[assignment]
    profile.buttons[0].pulse_time_s = 0.05
    profile.buttons[0].action = ButtonAction(
        action="light.toggle",
        target={"entity_id": "light.gate"},
    )
    profile.buttons[1].role = BUTTON_ROLE_TOGGLE  # type: ignore[assignment]
    profile.buttons[1].action = ButtonAction(
        action="switch.toggle",
        target={"entity_id": "switch.lamp"},
    )
    return profile


def test_clamp_pulse_time_bounds() -> None:
    assert clamp_pulse_time(0.01) == PULSE_TIME_MIN
    assert clamp_pulse_time(9999) == PULSE_TIME_MAX
    assert clamp_pulse_time("bad") == DEFAULT_PULSE_TIME
    assert clamp_pulse_time(3.5) == 3.5


def test_button_role_defaults_and_roundtrip() -> None:
    button = ButtonConfig.from_dict({"index": 1, "name": "Pulse"})
    assert button.role == BUTTON_ROLE_TOGGLE
    assert button.pulse_time_s == DEFAULT_PULSE_TIME
    button.role = BUTTON_ROLE_MOMENTARY  # type: ignore[assignment]
    button.pulse_time_s = 1.5
    restored = ButtonConfig.from_dict(button.to_dict())
    assert restored.role == BUTTON_ROLE_MOMENTARY
    assert restored.pulse_time_s == 1.5
    assert restored.is_momentary is True
    legacy = ButtonConfig.from_dict(
        {"index": 2, "name": "Legacy", "press_mode": "momentary", "pulse_time_s": 2}
    )
    assert legacy.role == BUTTON_ROLE_MOMENTARY


@pytest.mark.asyncio
async def test_momentary_press_turns_off_after_pulse() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    _mixed_profile(store)

    await coordinator._async_handle_physical_press(1, True)
    assert runtime.hass.services.async_call.await_count == 1
    assert 1 in runtime.momentary.timers

    await asyncio.sleep(0.08)
    assert (1, False) in adapter.relay_calls
    assert 1 not in runtime.momentary.timers
    assert runtime.hass.services.async_call.await_count == 1


@pytest.mark.asyncio
async def test_momentary_repress_cancels_and_turns_off() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    _mixed_profile(store)

    await coordinator._async_handle_physical_press(1, True)
    assert 1 in runtime.momentary.timers
    await coordinator._async_handle_physical_press(1, False)
    assert 1 not in runtime.momentary.timers
    assert runtime.hass.services.async_call.await_count == 1

    await asyncio.sleep(0.08)
    assert adapter.relay_calls == []


@pytest.mark.asyncio
async def test_momentary_on_while_armed_forces_off() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    _mixed_profile(store)

    await coordinator._async_handle_physical_press(1, True)
    await coordinator._async_handle_physical_press(1, True)
    assert (1, False) in adapter.relay_calls
    assert 1 not in runtime.momentary.timers
    assert runtime.hass.services.async_call.await_count == 1


@pytest.mark.asyncio
async def test_mixed_toggle_button_stays_independent() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    _mixed_profile(store)

    await coordinator._async_handle_physical_press(2, True)
    await coordinator._async_handle_physical_press(2, False)
    assert runtime.hass.services.async_call.await_count == 2
    assert runtime.momentary.timers == {}
    assert adapter.relay_calls == []


@pytest.mark.asyncio
async def test_momentary_abort_on_profile_switch() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    _mixed_profile(store)
    other = Profile(id="other", name="Other", mode=MODE_TOGGLE)  # type: ignore[arg-type]
    store.data.profiles[other.id] = other

    await coordinator._async_handle_physical_press(1, True)
    assert 1 in runtime.momentary.timers
    await coordinator.async_activate_profile(other.id)
    assert runtime.momentary.timers == {}
    assert (1, False) in adapter.relay_calls


@pytest.mark.asyncio
async def test_momentary_abort_on_sync_and_unload() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    _mixed_profile(store)

    await coordinator._async_handle_physical_press(1, True)
    await coordinator.async_sync()
    assert runtime.momentary.timers == {}
    assert (1, False) in adapter.relay_calls

    adapter.relay_calls.clear()
    await coordinator._async_handle_physical_press(1, True)
    await coordinator.async_unload()
    assert runtime.momentary.timers == {}
    assert (1, False) in adapter.relay_calls
