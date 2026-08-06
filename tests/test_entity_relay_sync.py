"""Tests for syncing panel relays from linked Home Assistant entity states."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.adapters.zemismart import Zemismart4GangAdapter
from custom_components.conx_dynamic_panel.const import (
    MODE_COVER,
    MODE_MIXED,
    MODE_RADIO_MANDATORY,
    MODE_RADIO_SPLIT,
    MODE_TOGGLE,
)
from custom_components.conx_dynamic_panel.entity_relay import (
    entity_state_to_relay_on,
    linked_entity_id_from_action,
)
from custom_components.conx_dynamic_panel.models import (
    ButtonAction,
    ButtonConfig,
    CoverConfig,
    EntityMapping,
    Profile,
    RadioGroup,
)
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker


class FakeStates:
    def __init__(self, states: dict[str, Any]) -> None:
        self._states = states

    def get(self, entity_id: str) -> Any:
        return self._states.get(entity_id)


def _state(value: str) -> SimpleNamespace:
    return SimpleNamespace(state=value, attributes={})


def _mapping() -> EntityMapping:
    return EntityMapping.from_dict(
        {
            "panel_name": "Kitchen",
            "adapter_type": "zemismart_4gang",
            "relay_entities": ["switch.l1", "switch.l2", "switch.l3", "switch.l4"],
            "name_entities": ["text.n1", "text.n2", "text.n3", "text.n4"],
            "color_off_entity": "select.off",
            "color_on_entity": "select.on",
            "radar_entity": "select.radar",
            "backlight_entity": "switch.backlight",
            "child_lock_entity": "switch.lock",
        }
    )


def _action(entity_id: str) -> ButtonAction:
    return ButtonAction(
        action="light.toggle",
        target={"entity_id": entity_id},
        data={},
    )


def _profile_toggle(*, lights: dict[int, str | None]) -> Profile:
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


@pytest.fixture
def relay_harness() -> tuple[Zemismart4GangAdapter, dict[str, Any], list[tuple[int, bool]]]:
    """Adapter whose relay writes update fake HA switch states."""
    states: dict[str, Any] = {
        "switch.l1": _state("off"),
        "switch.l2": _state("off"),
        "switch.l3": _state("off"),
        "switch.l4": _state("off"),
    }
    relay_calls: list[tuple[int, bool]] = []
    mapping = _mapping()

    async def async_call(domain: str, service: str, data: dict[str, Any], **_: Any) -> None:
        entity_id = data["entity_id"]
        if domain == "switch":
            states[entity_id] = _state("on" if service == "turn_on" else "off")
            index = mapping.relay_entities.index(entity_id) + 1
            relay_calls.append((index, service == "turn_on"))

    hass = SimpleNamespace(
        states=FakeStates(states),
        services=SimpleNamespace(async_call=AsyncMock(side_effect=async_call)),
    )
    adapter = Zemismart4GangAdapter(
        hass,  # type: ignore[arg-type]
        mapping,
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    return adapter, states, relay_calls


def test_linked_entity_id_from_target_and_data() -> None:
    assert (
        linked_entity_id_from_action(
            ButtonAction("light.toggle", target={"entity_id": "light.a"}, data={})
        )
        == "light.a"
    )
    assert (
        linked_entity_id_from_action(
            ButtonAction(
                "light.toggle",
                target={},
                data={"entity_id": ["light.b", "light.c"]},
            )
        )
        == "light.b"
    )
    assert linked_entity_id_from_action(None) is None
    assert ButtonAction("homeassistant.toggle", target={}, data={}).linked_entity_id() is None


def test_entity_state_to_relay_on_mapping() -> None:
    hass = SimpleNamespace(
        states=FakeStates(
            {
                "light.kitchen": _state("on"),
                "light.hall": _state("off"),
                "light.gone": _state("unavailable"),
                "cover.shade": _state("open"),
                "cover.door": _state("closed"),
                "media_player.tv": _state("playing"),
                "media_player.radio": _state("idle"),
                "lock.front": _state("locked"),
                "sensor.odd": _state("42"),
            }
        )
    )
    assert entity_state_to_relay_on(hass, "light.kitchen") is True
    assert entity_state_to_relay_on(hass, "light.hall") is False
    assert entity_state_to_relay_on(hass, "light.gone") is None
    assert entity_state_to_relay_on(hass, "light.missing") is None
    assert entity_state_to_relay_on(hass, "cover.shade") is True
    assert entity_state_to_relay_on(hass, "cover.door") is False
    assert entity_state_to_relay_on(hass, "media_player.tv") is True
    assert entity_state_to_relay_on(hass, "media_player.radio") is False
    assert entity_state_to_relay_on(hass, "lock.front") is True
    assert entity_state_to_relay_on(hass, "sensor.odd") is None
    assert entity_state_to_relay_on(hass, "") is None


@pytest.mark.asyncio
async def test_toggle_sync_matches_linked_lights(
    relay_harness: tuple[Zemismart4GangAdapter, dict[str, Any], list[tuple[int, bool]]],
) -> None:
    adapter, states, relay_calls = relay_harness
    states["light.a"] = _state("on")
    states["light.b"] = _state("off")
    states["light.c"] = _state("unavailable")
    # L1 starts OFF on panel but linked light is ON → must turn ON.
    # L2 starts OFF and light is OFF → no write.
    # L3 unavailable → skip (leave OFF).
    # L4 has no entity → skip.
    profile = _profile_toggle(
        lights={1: "light.a", 2: "light.b", 3: "light.c", 4: None}
    )
    await adapter._async_apply_relay_mode(profile)
    assert states["switch.l1"].state == "on"
    assert states["switch.l2"].state == "off"
    assert states["switch.l3"].state == "off"
    assert states["switch.l4"].state == "off"
    assert (1, True) in relay_calls
    assert (2, False) not in relay_calls
    assert (3, True) not in relay_calls
    assert (3, False) not in relay_calls


@pytest.mark.asyncio
async def test_mixed_syncs_toggle_keeps_cover_and_momentary_off(
    relay_harness: tuple[Zemismart4GangAdapter, dict[str, Any], list[tuple[int, bool]]],
) -> None:
    adapter, states, relay_calls = relay_harness
    # Pretend cover/momentary relays were left ON before sync.
    states["switch.l1"] = _state("on")
    states["switch.l2"] = _state("on")
    states["switch.l3"] = _state("off")
    states["light.desk"] = _state("on")
    profile = Profile(
        id="mix",
        name="Mix",
        mode=MODE_MIXED,
        buttons=[
            ButtonConfig(index=1, name="Open", role="cover_open", cover_id="cover_1"),
            ButtonConfig(index=2, name="Pulse", role="momentary", action=_action("light.x")),
            ButtonConfig(index=3, name="Desk", role="toggle", action=_action("light.desk")),
            ButtonConfig(index=4, name="Close", role="cover_close", cover_id="cover_1"),
        ],
        covers=[
            CoverConfig(
                id="cover_1",
                open_button=1,
                close_button=4,
            )
        ],
    )
    await adapter._async_apply_relay_mode(profile)
    assert states["switch.l1"].state == "off"
    assert states["switch.l2"].state == "off"
    assert states["switch.l3"].state == "on"
    assert states["switch.l4"].state == "off"
    assert (1, False) in relay_calls
    assert (2, False) in relay_calls
    assert (3, True) in relay_calls
    # Cover close was already OFF — no need to write, but must never turn ON.
    assert (4, True) not in relay_calls


@pytest.mark.asyncio
async def test_radio_mandatory_selects_unique_on_entity(
    relay_harness: tuple[Zemismart4GangAdapter, dict[str, Any], list[tuple[int, bool]]],
) -> None:
    adapter, states, _relay_calls = relay_harness
    states["light.a"] = _state("off")
    states["light.b"] = _state("on")
    states["light.c"] = _state("off")
    profile = Profile(
        id="radio",
        name="Radio",
        mode=MODE_RADIO_MANDATORY,
        selected_button=1,
        buttons=[
            ButtonConfig(index=1, name="A", action=_action("light.a")),
            ButtonConfig(index=2, name="B", action=_action("light.b")),
            ButtonConfig(index=3, name="C", action=_action("light.c")),
            ButtonConfig(index=4, name="D"),
        ],
    )
    await adapter._async_apply_relay_mode(profile)
    assert profile.selected_button == 2
    assert states["switch.l1"].state == "off"
    assert states["switch.l2"].state == "on"
    assert states["switch.l3"].state == "off"


@pytest.mark.asyncio
async def test_radio_split_ambiguous_leaves_group_alone(
    relay_harness: tuple[Zemismart4GangAdapter, dict[str, Any], list[tuple[int, bool]]],
) -> None:
    adapter, states, relay_calls = relay_harness
    # Both group members "on" — do not invent exclusivity; leave latched state.
    states["switch.l1"] = _state("on")
    states["switch.l2"] = _state("off")
    states["light.a"] = _state("on")
    states["light.b"] = _state("on")
    states["light.solo"] = _state("on")
    profile = Profile(
        id="split",
        name="Split",
        mode=MODE_RADIO_SPLIT,
        radio_groups=[RadioGroup(id="g1", buttons=[1, 2])],
        buttons=[
            ButtonConfig(index=1, name="A", action=_action("light.a")),
            ButtonConfig(index=2, name="B", action=_action("light.b")),
            ButtonConfig(index=3, name="Solo", action=_action("light.solo")),
            ButtonConfig(index=4, name="D"),
        ],
    )
    await adapter._async_apply_relay_mode(profile)
    assert states["switch.l1"].state == "on"
    assert states["switch.l2"].state == "off"
    assert states["switch.l3"].state == "on"
    assert (1, False) not in relay_calls
    assert (2, True) not in relay_calls
    assert (3, True) in relay_calls


@pytest.mark.asyncio
async def test_cover_mode_never_energizes_from_entity(
    relay_harness: tuple[Zemismart4GangAdapter, dict[str, Any], list[tuple[int, bool]]],
) -> None:
    adapter, states, relay_calls = relay_harness
    states["switch.l1"] = _state("on")
    states["switch.l2"] = _state("on")
    # Even if buttons somehow had linked entities, cover mode only forces OFF.
    profile = Profile(
        id="cover",
        name="Cover",
        mode=MODE_COVER,
        buttons=[
            ButtonConfig(index=1, name="Open", action=_action("cover.shade")),
            ButtonConfig(index=2, name="Close", action=_action("cover.shade")),
            ButtonConfig(index=3, name="C"),
            ButtonConfig(index=4, name="D"),
        ],
        covers=[
            CoverConfig(id="cover_1", open_button=1, close_button=2),
        ],
    )
    states["cover.shade"] = _state("open")
    await adapter._async_apply_relay_mode(profile)
    assert states["switch.l1"].state == "off"
    assert states["switch.l2"].state == "off"
    assert (1, True) not in relay_calls
    assert (2, True) not in relay_calls
