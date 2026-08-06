"""Tests for live HA entity → panel relay state sync."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest

from custom_components.conx_dynamic_panel.const import (
    BUTTON_ROLE_COVER_CLOSE,
    BUTTON_ROLE_COVER_OPEN,
    BUTTON_ROLE_MOMENTARY,
    BUTTON_ROLE_TOGGLE,
    MODE_COVER,
    MODE_MIXED,
    MODE_TOGGLE,
)
from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.entity_relay import (
    EntityRelayBinding,
    iter_entity_relay_bindings,
    state_value_to_relay_on,
)
from custom_components.conx_dynamic_panel.models import (
    ButtonAction,
    ButtonConfig,
    CoverConfig,
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
    def __init__(self) -> None:
        self.relay_calls: list[tuple[int, bool, bool]] = []
        self._relay_on: dict[int, bool] = {1: True, 2: False, 3: False, 4: False}

    async def async_apply_profile(self, profile: Profile) -> SyncResult:
        return SyncResult(success=True, confirmed_steps=["names"])

    async def async_set_relay(
        self, index: int, state: bool, *, suppress_event: bool = True
    ) -> None:
        self.relay_calls.append((index, state, suppress_event))
        self._relay_on[index] = state

    def relay_is_on(self, index: int) -> bool:
        return bool(self._relay_on.get(index, False))

    async def async_read_hardware_state(self) -> HardwareState:
        return HardwareState(
            names=("A", "B", "C", "D"),
            relays=tuple(self._relay_on[i] for i in range(1, 5)),  # type: ignore[arg-type]
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


def _action(entity_id: str) -> ButtonAction:
    return ButtonAction(
        action="light.toggle",
        target={"entity_id": entity_id},
        data={},
    )


def _toggle_profile(*, lights: dict[int, str | None]) -> Profile:
    buttons = []
    for index in range(1, 5):
        entity = lights.get(index)
        buttons.append(
            ButtonConfig(
                index=index,
                name=f"L{index}",
                action=_action(entity) if entity else None,
            )
        )
    return Profile(id="p1", name="Test", mode=MODE_TOGGLE, buttons=buttons)


def _runtime(
    adapter: FakeAdapter,
    store: FakeStore,
    *,
    states: dict[str, Any] | None = None,
) -> Any:
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
    hass_states = SimpleNamespace(
        get=lambda entity_id: (states or {}).get(entity_id),
    )
    hass = SimpleNamespace(
        states=hass_states,
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
        multiclick=MultiClickRuntime(),
        unloading=False,
        listeners=[],
        update_callbacks=[],
        auto_sync=False,
        sync_timeout=30.0,
        confirm_timeout=10.0,
        async_notify=lambda: None,
    )


def _state(value: str) -> SimpleNamespace:
    return SimpleNamespace(state=value, attributes={})


def test_state_value_to_relay_on_skips_unavailable() -> None:
    assert state_value_to_relay_on("light.a", "on") is True
    assert state_value_to_relay_on("light.a", "off") is False
    assert state_value_to_relay_on("input_boolean.x", "on") is True
    assert state_value_to_relay_on("switch.x", "unavailable") is None
    assert state_value_to_relay_on("switch.x", "unknown") is None


def test_iter_bindings_toggle_and_skips_cover_momentary() -> None:
    toggle = _toggle_profile(lights={1: "light.kitchen", 2: "switch.fan"})
    bindings = iter_entity_relay_bindings(toggle)
    assert {(b.button_index, b.entity_id) for b in bindings} == {
        (1, "light.kitchen"),
        (2, "switch.fan"),
    }

    cover = Profile(
        id="c1",
        name="Cover",
        mode=MODE_COVER,
        buttons=[
            ButtonConfig(index=1, name="Up", action=_action("cover.shade")),
            ButtonConfig(index=2, name="Down", action=_action("cover.shade")),
            ButtonConfig(index=3, name=""),
            ButtonConfig(index=4, name=""),
        ],
        covers=[
            CoverConfig(
                id="cover_1",
                open_button=1,
                close_button=2,
                open_time_s=10,
                close_time_s=10,
            )
        ],
    )
    assert iter_entity_relay_bindings(cover) == []

    mixed = Profile(
        id="m1",
        name="Mixed",
        mode=MODE_MIXED,
        buttons=[
            ButtonConfig(
                index=1,
                name="Light",
                role=BUTTON_ROLE_TOGGLE,
                action=_action("light.kitchen"),
            ),
            ButtonConfig(
                index=2,
                name="Pulse",
                role=BUTTON_ROLE_MOMENTARY,
                action=_action("light.pulse"),
            ),
            ButtonConfig(
                index=3,
                name="Open",
                role=BUTTON_ROLE_COVER_OPEN,
                cover_id="cover_1",
                action=_action("cover.shade"),
            ),
            ButtonConfig(
                index=4,
                name="Close",
                role=BUTTON_ROLE_COVER_CLOSE,
                cover_id="cover_1",
                action=_action("cover.shade"),
            ),
        ],
        covers=[
            CoverConfig(
                id="cover_1",
                open_button=3,
                close_button=4,
                open_time_s=10,
                close_time_s=10,
            )
        ],
    )
    bindings = iter_entity_relay_bindings(mixed)
    assert bindings == [
        EntityRelayBinding(entity_id="light.kitchen", button_index=1),
    ]


@pytest.mark.asyncio
async def test_live_entity_off_updates_relay_with_suppression() -> None:
    store = FakeStore()
    profile = _toggle_profile(lights={1: "light.kitchen"})
    store.data.profiles = {"p1": profile}
    store.data.active_profile_id = "p1"
    adapter = FakeAdapter()
    adapter._relay_on[1] = True
    states = {
        "light.kitchen": _state("on"),
        "switch.l1": _state("on"),
        "switch.l2": _state("off"),
        "switch.l3": _state("off"),
        "switch.l4": _state("off"),
    }
    runtime = _runtime(adapter, store, states=states)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]

    tracked: dict[str, Any] = {}

    def fake_track(hass: Any, entity_ids: list[str], callback: Any) -> Any:
        tracked["entity_ids"] = list(entity_ids)
        tracked["callback"] = callback

        def _remove() -> None:
            tracked["removed"] = True

        return _remove

    with patch(
        "custom_components.conx_dynamic_panel.coordinator.async_track_state_change_event",
        side_effect=fake_track,
    ):
        coordinator._rebuild_entity_relay_listeners()

    assert tracked["entity_ids"] == ["light.kitchen"]
    assert "light.kitchen" in coordinator._entity_relay_bindings

    states["light.kitchen"] = _state("off")
    event = SimpleNamespace(
        data={
            "entity_id": "light.kitchen",
            "old_state": _state("on"),
            "new_state": _state("off"),
        }
    )
    await coordinator._async_handle_linked_entity_event(event)  # type: ignore[arg-type]

    assert adapter.relay_calls == [(1, False, True)]
    # Already off — second event must not write again.
    await coordinator._async_handle_linked_entity_event(event)  # type: ignore[arg-type]
    assert adapter.relay_calls == [(1, False, True)]


@pytest.mark.asyncio
async def test_live_cover_entities_are_not_tracked() -> None:
    store = FakeStore()
    profile = Profile(
        id="c1",
        name="Cover",
        mode=MODE_COVER,
        buttons=[
            ButtonConfig(index=1, name="Up", action=_action("cover.shade")),
            ButtonConfig(index=2, name="Down", action=_action("cover.shade")),
            ButtonConfig(index=3, name=""),
            ButtonConfig(index=4, name=""),
        ],
        covers=[
            CoverConfig(
                id="cover_1",
                open_button=1,
                close_button=2,
                open_time_s=10,
                close_time_s=10,
            )
        ],
    )
    store.data.profiles = {"c1": profile}
    store.data.active_profile_id = "c1"
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]

    track_calls: list[list[str]] = []

    def fake_track(hass: Any, entity_ids: list[str], callback: Any) -> Any:
        track_calls.append(list(entity_ids))
        return lambda: None

    with patch(
        "custom_components.conx_dynamic_panel.coordinator.async_track_state_change_event",
        side_effect=fake_track,
    ):
        coordinator._rebuild_entity_relay_listeners()

    assert track_calls == []
    assert coordinator._entity_relay_bindings == {}
    assert coordinator._entity_relay_unsubs == []


@pytest.mark.asyncio
async def test_unload_clears_entity_relay_listeners() -> None:
    store = FakeStore()
    profile = _toggle_profile(lights={1: "light.kitchen"})
    store.data.profiles = {"p1": profile}
    store.data.active_profile_id = "p1"
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]

    removed = {"count": 0}

    def fake_track(hass: Any, entity_ids: list[str], callback: Any) -> Any:
        def _remove() -> None:
            removed["count"] += 1

        return _remove

    with patch(
        "custom_components.conx_dynamic_panel.coordinator.async_track_state_change_event",
        side_effect=fake_track,
    ):
        coordinator._rebuild_entity_relay_listeners()

    assert coordinator._entity_relay_unsubs
    assert "light.kitchen" in coordinator._entity_relay_bindings

    await coordinator.async_unload()
    assert removed["count"] == 1
    assert coordinator._entity_relay_unsubs == []
    assert coordinator._entity_relay_bindings == {}
    assert runtime.unloading is True
