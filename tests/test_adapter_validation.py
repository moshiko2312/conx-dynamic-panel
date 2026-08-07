"""Adapter mapping validation tests."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

import pytest

from custom_components.conx_dynamic_panel.adapters.zemismart import Zemismart4GangAdapter
from custom_components.conx_dynamic_panel.exceptions import MappingValidationError
from custom_components.conx_dynamic_panel.models import EntityMapping
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker


class FakeStates:
    def __init__(self, states: dict[str, Any]) -> None:
        self._states = states

    def get(self, entity_id: str) -> Any:
        return self._states.get(entity_id)


def _state(value: str, **attributes: Any) -> SimpleNamespace:
    return SimpleNamespace(state=value, attributes=attributes)


def _mapping(**overrides: Any) -> EntityMapping:
    data = {
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
    data.update(overrides)
    return EntityMapping.from_dict(data)


def _hass(
    states: dict[str, Any],
    registry: dict[str, Any] | None = None,
    *,
    monkeypatch: pytest.MonkeyPatch,
) -> Any:
    import homeassistant.helpers.entity_registry as er

    monkeypatch.setattr(
        er,
        "async_get",
        lambda hass: SimpleNamespace(
            async_get=lambda entity_id: (registry or {}).get(entity_id)
        ),
    )
    return SimpleNamespace(states=FakeStates(states))


def _valid_states() -> dict[str, Any]:
    return {
        "switch.l1": _state("off"),
        "switch.l2": _state("off"),
        "switch.l3": _state("off"),
        "switch.l4": _state("off"),
        "text.n1": _state("A", mode="text"),
        "text.n2": _state("B", mode="text"),
        "text.n3": _state("C", mode="text"),
        "text.n4": _state("D", mode="text"),
        "select.off": _state("blue", options=["blue", "red"]),
        "select.on": _state("cyan", options=["cyan", "blue"]),
        "select.radar": _state("30s", options=["none", "30s"]),
        "switch.backlight": _state("on"),
        "switch.lock": _state("off"),
    }


@pytest.mark.asyncio
async def test_validate_mapping_success(monkeypatch: pytest.MonkeyPatch) -> None:
    adapter = Zemismart4GangAdapter(
        _hass(_valid_states(), monkeypatch=monkeypatch),
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    await adapter.async_validate_mapping()


@pytest.mark.asyncio
async def test_duplicate_relays_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    mapping = _mapping(relay_entities=["switch.l1", "switch.l1", "switch.l3", "switch.l4"])
    adapter = Zemismart4GangAdapter(
        _hass(_valid_states(), monkeypatch=monkeypatch),
        mapping,
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    with pytest.raises(MappingValidationError, match="unique"):
        await adapter.async_validate_mapping()


@pytest.mark.asyncio
async def test_wrong_domain_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    mapping = _mapping(color_on_entity="switch.not_select")
    states = _valid_states()
    states["switch.not_select"] = _state("on")
    adapter = Zemismart4GangAdapter(
        _hass(states, monkeypatch=monkeypatch),
        mapping,
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    with pytest.raises(MappingValidationError, match="domain"):
        await adapter.async_validate_mapping()


@pytest.mark.asyncio
async def test_select_without_options_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    states = _valid_states()
    states["select.on"] = _state("cyan", options=[])
    adapter = Zemismart4GangAdapter(
        _hass(states, monkeypatch=monkeypatch),
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    with pytest.raises(MappingValidationError, match="options"):
        await adapter.async_validate_mapping()


@pytest.mark.asyncio
async def test_unavailable_text_allowed(monkeypatch: pytest.MonkeyPatch) -> None:
    """Offline panel text entities must soft-pass so setup can load."""
    states = _valid_states()
    states["text.n1"] = _state("unavailable", mode="text")
    adapter = Zemismart4GangAdapter(
        _hass(states, monkeypatch=monkeypatch),
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    await adapter.async_validate_mapping()


@pytest.mark.asyncio
async def test_unknown_text_allowed(monkeypatch: pytest.MonkeyPatch) -> None:
    states = _valid_states()
    states["text.n2"] = _state("unknown", mode="text")
    adapter = Zemismart4GangAdapter(
        _hass(states, monkeypatch=monkeypatch),
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    await adapter.async_validate_mapping()


@pytest.mark.asyncio
async def test_unavailable_select_without_options_allowed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Offline selects often lack options until MQTT reconnects."""
    states = _valid_states()
    states["select.on"] = _state("unavailable", options=[])
    adapter = Zemismart4GangAdapter(
        _hass(states, monkeypatch=monkeypatch),
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    await adapter.async_validate_mapping()


@pytest.mark.asyncio
async def test_disabled_text_still_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    states = _valid_states()
    registry = {
        "text.n1": SimpleNamespace(disabled_by="user"),
    }
    adapter = Zemismart4GangAdapter(
        _hass(states, registry=registry, monkeypatch=monkeypatch),
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    with pytest.raises(MappingValidationError, match="disabled"):
        await adapter.async_validate_mapping()


@pytest.mark.asyncio
async def test_password_text_rejected_when_available(monkeypatch: pytest.MonkeyPatch) -> None:
    states = _valid_states()
    states["text.n1"] = _state("Label", mode="password")
    adapter = Zemismart4GangAdapter(
        _hass(states, monkeypatch=monkeypatch),
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    with pytest.raises(MappingValidationError, match="password"):
        await adapter.async_validate_mapping()
