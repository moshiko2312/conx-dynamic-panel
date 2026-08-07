"""Tests for live runtime payload / websocket subscribe helpers."""

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
)
from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.models import (
    EntityMapping,
    HardwareState,
    PanelStorageData,
)
from custom_components.conx_dynamic_panel.runtime import (
    CoverRuntime,
    MomentaryRuntime,
    MultiClickRuntime,
)
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker
from custom_components.conx_dynamic_panel.websocket_api import ws_subscribe


class FakeStore:
    def __init__(self) -> None:
        self.data = PanelStorageData()
        self.data.ensure_defaults()
        profile = self.data.active_profile()
        assert profile is not None
        profile.mode = MODE_MIXED  # type: ignore[assignment]
        profile.buttons[0].role = BUTTON_ROLE_MOMENTARY  # type: ignore[assignment]
        profile.buttons[0].pulse_time_s = 2
        profile.buttons[1].role = BUTTON_ROLE_TOGGLE  # type: ignore[assignment]

    async def async_save(self) -> None:
        return None


class FakeAdapter:
    def __init__(self) -> None:
        self.hardware = HardwareState(
            names=("L1", "L2", "L3", "L4"),
            relays=(False, False, False, False),
            color_on="cyan",
            color_off="blue",
            radar="30s",
            backlight=True,
            child_lock=False,
            backlight_brightness=100,
        )

    def supported_colors(self) -> list[str]:
        return ["cyan", "blue"]

    def supported_radar(self) -> list[str]:
        return ["30s"]

    async def async_read_hardware_state(self) -> HardwareState:
        return self.hardware


class _FakeStates:
    def __init__(self, mapping: dict[str, SimpleNamespace]) -> None:
        self._mapping = mapping

    def get(self, entity_id: str) -> SimpleNamespace | None:
        return self._mapping.get(entity_id)


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
    callbacks: list = []

    def async_add_listener(callback):  # noqa: ANN001
        callbacks.append(callback)

        def _remove() -> None:
            if callback in callbacks:
                callbacks.remove(callback)

        return _remove

    def async_notify() -> None:
        for callback in list(callbacks):
            callback()

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
        data={},
        states=_FakeStates(
            {
                "switch.l1": SimpleNamespace(state="off"),
                "switch.l2": SimpleNamespace(state="on"),
                "switch.l3": SimpleNamespace(state="off"),
                "switch.l4": SimpleNamespace(state="unavailable"),
            }
        ),
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
        update_callbacks=callbacks,
        auto_sync=False,
        sync_timeout=30.0,
        confirm_timeout=10.0,
        async_add_listener=async_add_listener,
        async_notify=async_notify,
    )


def test_get_config_payload_includes_relay_entities() -> None:
    store = FakeStore()
    runtime = _runtime(FakeAdapter(), store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    payload = coordinator.get_config_payload()
    assert payload["relay_entities"] == [
        "switch.l1",
        "switch.l2",
        "switch.l3",
        "switch.l4",
    ]
    assert payload["relay_states"] == [False, True, False, None]
    assert payload["panel_available"] is True
    assert payload["momentary_active"] == []
    runtime_payload = coordinator.get_runtime_payload()
    assert "profiles" not in runtime_payload
    assert runtime_payload["relay_entities"] == payload["relay_entities"]
    assert runtime_payload["relay_states"] == [False, True, False, None]
    assert runtime_payload["panel_available"] is True
    assert "cover_state" in runtime_payload
    assert runtime_payload["sync_status"] == store.data.sync_status


def test_panel_available_false_when_all_relays_unavailable() -> None:
    store = FakeStore()
    runtime = _runtime(FakeAdapter(), store)
    runtime.hass.states = _FakeStates(
        {
            "switch.l1": SimpleNamespace(state="unavailable"),
            "switch.l2": SimpleNamespace(state="unavailable"),
            "switch.l3": SimpleNamespace(state="unknown"),
            "switch.l4": SimpleNamespace(state="unavailable"),
        }
    )
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    assert coordinator.get_config_payload()["panel_available"] is False
    assert coordinator.get_runtime_payload()["panel_available"] is False
    assert coordinator.get_runtime_payload()["relay_states"] == [None, None, None, None]


def test_panel_available_true_when_any_relay_usable() -> None:
    store = FakeStore()
    runtime = _runtime(FakeAdapter(), store)
    runtime.hass.states = _FakeStates(
        {
            "switch.l1": SimpleNamespace(state="unavailable"),
            "switch.l2": SimpleNamespace(state="unavailable"),
            "switch.l3": SimpleNamespace(state="off"),
            "switch.l4": SimpleNamespace(state="unavailable"),
        }
    )
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    assert coordinator.get_config_payload()["panel_available"] is True


@pytest.mark.asyncio
async def test_relay_unavailable_transition_notifies_runtime() -> None:
    store = FakeStore()
    runtime = _runtime(FakeAdapter(), store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    notified: list[int] = []
    runtime.async_add_listener(lambda: notified.append(1))

    await coordinator._async_handle_relay_event(
        SimpleNamespace(
            data={
                "entity_id": "switch.l1",
                "old_state": SimpleNamespace(state="on"),
                "new_state": SimpleNamespace(state="unavailable"),
            }
        )
    )
    assert notified == [1]


def test_runtime_payload_includes_momentary_active() -> None:
    store = FakeStore()
    runtime = _runtime(FakeAdapter(), store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    handle = SimpleNamespace(cancelled=lambda: False, cancel=lambda: None)
    runtime.momentary.timers[1] = handle  # type: ignore[assignment]
    runtime.momentary.tokens[1] = object()
    payload = coordinator.get_runtime_payload()
    assert payload["momentary_active"] == [1]
    assert payload["relay_states"][1] is True


def test_ws_subscribe_pushes_runtime_without_drafts() -> None:
    store = FakeStore()
    runtime = _runtime(FakeAdapter(), store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    runtime.hass.data = {"conx_dynamic_panel": {"entry-1": {"coordinator": coordinator}}}

    messages: list[dict[str, Any]] = []
    results: list[Any] = []

    connection = SimpleNamespace(
        subscriptions={},
        send_message=lambda msg: messages.append(msg),
        send_result=lambda msg_id, result=None: results.append((msg_id, result)),
    )

    ws_subscribe(
        runtime.hass,
        connection,  # type: ignore[arg-type]
        {"id": 7, "type": "conx_dynamic_panel/subscribe", "entry_id": "entry-1"},
    )

    assert results == [(7, None)]
    assert len(messages) == 1
    assert messages[0]["type"] == "event"
    assert messages[0]["event"]["relay_entities"][0] == "switch.l1"
    assert "profiles" not in messages[0]["event"]

    store.data.sync_status = "out_of_sync"  # type: ignore[assignment]
    runtime.async_notify()
    assert len(messages) == 2
    assert messages[1]["event"]["sync_status"] == "out_of_sync"
