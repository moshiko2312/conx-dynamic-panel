"""Select option matching and color/radar sync confirmation tests."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.adapters import zemismart as zemismart_mod
from custom_components.conx_dynamic_panel.adapters.zemismart import Zemismart4GangAdapter
from custom_components.conx_dynamic_panel.const import SELECT_CONFIRM_TIMEOUT_FLOOR
from custom_components.conx_dynamic_panel.exceptions import HardwareWriteError
from custom_components.conx_dynamic_panel.models import EntityMapping
from custom_components.conx_dynamic_panel.option_match import (
    compact_select_option_key,
    filter_ui_color_options,
    is_broken_warm_led_color,
    normalize_select_option_key,
    options_match,
    remap_broken_warm_led_color,
    resolve_select_option,
)
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker


@pytest.fixture(autouse=True)
def _fast_select_confirm_floor(monkeypatch: pytest.MonkeyPatch) -> None:
    """Unit tests use tiny confirm timeouts; disable the Zigbee select floor."""
    monkeypatch.setattr(zemismart_mod, "SELECT_CONFIRM_TIMEOUT_FLOOR", 0.0)


def test_normalize_select_option_key() -> None:
    assert normalize_select_option_key("Warm White") == "warm_white"
    assert normalize_select_option_key("warm-white") == "warm_white"
    assert normalize_select_option_key("  WARM_WHITE  ") == "warm_white"
    assert normalize_select_option_key("warm white") == "warm_white"
    assert compact_select_option_key("warm_white") == "warmwhite"
    assert compact_select_option_key("Warm White") == "warmwhite"


def test_options_match_ignores_formatting() -> None:
    assert options_match("warm_white", "Warm White")
    assert options_match("warm_white", "warmwhite")
    assert options_match("warm_yellow", "warmyellow")
    assert options_match("blue", "Blue")
    assert options_match("none", "None")
    assert not options_match("blue", "warm_white")


def test_resolve_select_option_exact() -> None:
    assert resolve_select_option("white", ["blue", "white"]) == "white"
    assert resolve_select_option("none", ["none", "10s", "30s"]) == "none"


def test_resolve_select_option_fuzzy() -> None:
    assert resolve_select_option("White", ["Blue", "White", "Cyan"]) == "White"
    assert resolve_select_option("Warm White", ["blue", "white"]) == "white"
    assert resolve_select_option("warm_white", ["blue", "warmwhite", "white"]) == "white"
    assert resolve_select_option("None", ["none", "30s"]) == "none"


def test_resolve_select_option_color_closest_alias() -> None:
    """When warm variants are requested, always map to white/yellow."""
    assert resolve_select_option("warm_white", ["red", "blue", "white", "yellow"]) == "white"
    assert resolve_select_option("warm_yellow", ["red", "blue", "white", "yellow"]) == "yellow"


def test_resolve_never_writes_warm_even_when_in_options() -> None:
    """Live HA options may still list warm_*; never return them as write targets."""
    options = ["red", "blue", "white", "yellow", "warm_white", "warm_yellow"]
    assert resolve_select_option("warm_white", options) == "white"
    assert resolve_select_option("warm_yellow", options) == "yellow"
    assert resolve_select_option("Warm White", options) == "white"
    assert resolve_select_option("warmwhite", options) == "white"
    assert not is_broken_warm_led_color(resolve_select_option("warm_white", options))


def test_remap_and_filter_broken_warm_led_colors() -> None:
    assert remap_broken_warm_led_color("warm_white") == "white"
    assert remap_broken_warm_led_color("warm_yellow") == "yellow"
    assert remap_broken_warm_led_color("WarmYellow") == "yellow"
    assert remap_broken_warm_led_color("blue") == "blue"
    assert is_broken_warm_led_color("warm_white")
    assert is_broken_warm_led_color("warmyellow")
    assert not is_broken_warm_led_color("white")
    assert filter_ui_color_options(
        ["red", "warm_white", "white", "Warm Yellow", "yellow", "cyan"]
    ) == ["red", "white", "yellow", "cyan"]


def test_resolve_select_option_radar_none_aliases() -> None:
    options = ["none", "10s", "20s", "30s", "45s", "60s"]
    assert resolve_select_option("none", options) == "none"
    assert resolve_select_option("None", options) == "none"
    assert resolve_select_option("off", options) == "none"
    assert resolve_select_option("0", options) == "none"
    assert resolve_select_option("ללא", options) == "none"
    assert resolve_select_option("disabled", ["off", "10s", "30s"]) == "off"


def test_resolve_select_option_empty_options_passthrough() -> None:
    # Empty options still remaps broken warm enums so Sync cannot hang the panel.
    assert resolve_select_option("warm_white", []) == "white"
    assert resolve_select_option("warm_white", None) == "white"
    assert resolve_select_option("warm_yellow", []) == "yellow"
    assert resolve_select_option("none", []) == "none"


def test_resolve_select_option_missing_raises() -> None:
    with pytest.raises(HardwareWriteError, match="choices="):
        resolve_select_option("warm_white", ["blue", "cyan"])
    with pytest.raises(HardwareWriteError, match="choices="):
        resolve_select_option("none", ["10s", "30s"])


def test_select_confirm_timeout_floor_constant() -> None:
    assert SELECT_CONFIRM_TIMEOUT_FLOOR == 20.0
    assert max(5.0, SELECT_CONFIRM_TIMEOUT_FLOOR) == 20.0


class FakeStates:
    def __init__(self, states: dict[str, Any]) -> None:
        self._states = states

    def get(self, entity_id: str) -> Any:
        return self._states.get(entity_id)


def _state(value: str, **attributes: Any) -> SimpleNamespace:
    return SimpleNamespace(state=value, attributes=attributes)


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


@pytest.mark.asyncio
async def test_select_option_fuzzy_write_and_confirm() -> None:
    """Profile warm_white maps to white (never writes warm_*) and confirms."""
    states = {
        "select.off": _state("Blue", options=["Blue", "Warm White", "White", "Cyan"]),
    }

    async def async_call(domain: str, service: str, data: dict[str, Any], **_: Any) -> None:
        assert domain == "select"
        assert service == "select_option"
        assert data["option"] == "White"
        assert data["option"] != "Warm White"
        states[data["entity_id"]] = _state(
            data["option"], options=["Blue", "Warm White", "White", "Cyan"]
        )

    hass = SimpleNamespace(
        states=FakeStates(states),
        services=SimpleNamespace(async_call=AsyncMock(side_effect=async_call)),
    )

    adapter = Zemismart4GangAdapter(
        hass,  # type: ignore[arg-type]
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    await adapter._async_select_option("select.off", "warm_white")
    assert states["select.off"].state == "White"
    assert hass.services.async_call.await_count == 1


@pytest.mark.asyncio
async def test_select_option_never_writes_warm_when_listed() -> None:
    """Even when HA options include warm_white, ConX writes white instead."""
    options = ["blue", "warm_white", "white", "cyan"]
    states = {
        "select.off": _state("blue", options=options),
    }

    async def async_call(domain: str, service: str, data: dict[str, Any], **_: Any) -> None:
        assert data["option"] == "white"
        assert data["option"] != "warm_white"
        states[data["entity_id"]] = _state(data["option"], options=options)

    hass = SimpleNamespace(
        states=FakeStates(states),
        services=SimpleNamespace(async_call=AsyncMock(side_effect=async_call)),
    )
    adapter = Zemismart4GangAdapter(
        hass,  # type: ignore[arg-type]
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    await adapter._async_select_option("select.off", "warm_white")
    assert states["select.off"].state == "white"


@pytest.mark.asyncio
async def test_select_option_skips_when_already_set() -> None:
    states = {
        "select.off": _state("White", options=["Blue", "Warm White", "White"]),
    }
    hass = SimpleNamespace(
        states=FakeStates(states),
        services=SimpleNamespace(async_call=AsyncMock()),
    )
    adapter = Zemismart4GangAdapter(
        hass,  # type: ignore[arg-type]
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    await adapter._async_select_option("select.off", "warm_white")
    hass.services.async_call.assert_not_awaited()


@pytest.mark.asyncio
async def test_select_option_timeout_lists_available_options() -> None:
    states = {
        "select.off": _state("blue", options=["blue", "warm_white", "cyan", "white"]),
    }
    hass = SimpleNamespace(
        states=FakeStates(states),
        services=SimpleNamespace(async_call=AsyncMock()),
    )
    adapter = Zemismart4GangAdapter(
        hass,  # type: ignore[arg-type]
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=0.05,
    )
    with pytest.raises(HardwareWriteError, match="available options=") as exc_info:
        await adapter._async_select_option("select.off", "warm_white")
    message = str(exc_info.value)
    assert "white" in message
    assert "blue" in message
    assert "entity=select.off" in message
    # Retries should re-issue the select service call.
    assert hass.services.async_call.await_count == 3


@pytest.mark.asyncio
async def test_select_option_retries_until_state_confirms() -> None:
    states = {
        "select.off": _state("blue", options=["blue", "warm_white", "white"]),
    }
    calls = {"n": 0}

    async def async_call(domain: str, service: str, data: dict[str, Any], **_: Any) -> None:
        assert data["option"] == "white"
        calls["n"] += 1
        if calls["n"] >= 2:
            states[data["entity_id"]] = _state(
                data["option"], options=["blue", "warm_white", "white"]
            )

    hass = SimpleNamespace(
        states=FakeStates(states),
        services=SimpleNamespace(async_call=AsyncMock(side_effect=async_call)),
    )
    adapter = Zemismart4GangAdapter(
        hass,  # type: ignore[arg-type]
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=0.2,
    )
    await adapter._async_select_option("select.off", "warm_white")
    assert states["select.off"].state == "white"
    assert calls["n"] == 2


@pytest.mark.asyncio
async def test_radar_none_from_unknown_state() -> None:
    """Radar select can start as unknown; writing none must confirm."""
    options = ["none", "10s", "20s", "30s", "45s", "60s"]
    states = {
        "select.radar": _state("unknown", options=options),
    }

    async def async_call(domain: str, service: str, data: dict[str, Any], **_: Any) -> None:
        assert data["option"] == "none"
        states[data["entity_id"]] = _state("none", options=options)

    hass = SimpleNamespace(
        states=FakeStates(states),
        services=SimpleNamespace(async_call=AsyncMock(side_effect=async_call)),
    )
    adapter = Zemismart4GangAdapter(
        hass,  # type: ignore[arg-type]
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    await adapter.async_set_radar("none")
    assert states["select.radar"].state == "none"


@pytest.mark.asyncio
async def test_radar_none_alias_off_maps_to_live_option() -> None:
    options = ["none", "10s", "30s"]
    states = {
        "select.radar": _state("30s", options=options),
    }

    async def async_call(domain: str, service: str, data: dict[str, Any], **_: Any) -> None:
        assert data["option"] == "none"
        states[data["entity_id"]] = _state("none", options=options)

    hass = SimpleNamespace(
        states=FakeStates(states),
        services=SimpleNamespace(async_call=AsyncMock(side_effect=async_call)),
    )
    adapter = Zemismart4GangAdapter(
        hass,  # type: ignore[arg-type]
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    await adapter.async_set_radar("off")
    assert states["select.radar"].state == "none"


@pytest.mark.asyncio
async def test_radar_none_timeout_lists_options_and_current() -> None:
    options = ["none", "10s", "30s"]
    states = {
        "select.radar": _state("unknown", options=options),
    }
    hass = SimpleNamespace(
        states=FakeStates(states),
        services=SimpleNamespace(async_call=AsyncMock()),
    )
    adapter = Zemismart4GangAdapter(
        hass,  # type: ignore[arg-type]
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=0.05,
    )
    with pytest.raises(HardwareWriteError, match="available options=") as exc_info:
        await adapter.async_set_radar("none")
    message = str(exc_info.value)
    assert "none" in message
    assert "current='unknown'" in message or "current=unknown" in message
    assert hass.services.async_call.await_count == 3


def test_supported_colors_and_radar_prefer_live_options() -> None:
    states = {
        "select.on": _state(
            "blue",
            options=["red", "blue", "green", "white", "yellow", "warm_white", "warm_yellow"],
        ),
        "select.off": _state(
            "red",
            options=["red", "blue", "green", "white", "yellow", "warm_white", "warm_yellow"],
        ),
        "select.radar": _state("unknown", options=["none", "10s", "30s"]),
    }
    hass = SimpleNamespace(states=FakeStates(states))
    adapter = Zemismart4GangAdapter(
        hass,  # type: ignore[arg-type]
        _mapping(),
        SuppressionTracker(),
        confirm_timeout=1.0,
    )
    assert adapter.supported_colors() == [
        "red",
        "blue",
        "green",
        "white",
        "yellow",
    ]
    assert "warm_white" not in adapter.supported_colors()
    assert "warm_yellow" not in adapter.supported_colors()
    assert adapter.supported_radar() == ["none", "10s", "30s"]
