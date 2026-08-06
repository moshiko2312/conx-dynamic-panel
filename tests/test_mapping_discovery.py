"""Tests for Zigbee2MQTT / Zemismart prefix auto-mapping."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.conx_dynamic_panel.config_flow import (
    CONF_DEVICE_PREFIX,
    CONF_MAPPING_MODE,
    MAPPING_MODE_MANUAL,
    MAPPING_MODE_PREFIX,
    ConXDynamicPanelConfigFlow,
)
from custom_components.conx_dynamic_panel.mapping_discovery import (
    discover_mapping_from_entities,
    normalize_device_prefix,
)


def test_normalize_device_prefix() -> None:
    assert normalize_device_prefix(" tp4 ") == "tp4"
    assert normalize_device_prefix("Living Room") == "living_room"
    assert normalize_device_prefix("PT-4") == "pt_4"


def test_discover_zemismart_prefix_entities() -> None:
    entities = [
        "switch.tp4_l1",
        "switch.tp4_l2",
        "switch.tp4_l3",
        "switch.tp4_l4",
        "switch.tp4_backlight_mode",
        "switch.tp4_child_lock",
        "text.tp4_name_l1",
        "text.tp4_name_l2",
        "text.tp4_name_l3",
        "text.tp4_name_l4",
        "select.tp4_switch_color_off",
        "select.tp4_switch_color_on",
        "select.tp4_radar_config",
        "number.tp4_backlight_brightness",
        "switch.other_l1",
    ]
    discovered = discover_mapping_from_entities(entities, "tp4")
    assert discovered.complete is True
    assert discovered.relay_entities == (
        "switch.tp4_l1",
        "switch.tp4_l2",
        "switch.tp4_l3",
        "switch.tp4_l4",
    )
    assert discovered.name_entities == (
        "text.tp4_name_l1",
        "text.tp4_name_l2",
        "text.tp4_name_l3",
        "text.tp4_name_l4",
    )
    assert discovered.color_on_entity == "select.tp4_switch_color_on"
    assert discovered.color_off_entity == "select.tp4_switch_color_off"
    assert discovered.radar_entity == "select.tp4_radar_config"
    assert discovered.backlight_entity == "switch.tp4_backlight_mode"
    assert discovered.backlight_brightness_entity == "number.tp4_backlight_brightness"
    assert discovered.child_lock_entity == "switch.tp4_child_lock"


def test_discover_device_scoped_short_names() -> None:
    entities = [
        "switch.l1",
        "switch.l2",
        "switch.l3",
        "switch.l4",
        "switch.backlight_mode",
        "switch.child_lock",
        "text.name_l1",
        "text.name_l2",
        "text.name_l3",
        "text.name_l4",
        "select.switch_color_off",
        "select.switch_color_on",
        "select.radar_config",
    ]
    discovered = discover_mapping_from_entities(entities, "tp4", device_scoped=True)
    assert discovered.complete is True
    assert discovered.relay_entities == ("switch.l1", "switch.l2", "switch.l3", "switch.l4")
    assert discovered.backlight_entity == "switch.backlight_mode"


def test_discover_reports_missing_fields() -> None:
    discovered = discover_mapping_from_entities(["switch.tp4_l1"], "tp4")
    assert discovered.complete is False
    assert "relay_l2" in discovered.missing
    assert discovered.relay_entities is None


@pytest.mark.asyncio
async def test_config_flow_prefix_autofills_relays() -> None:
    flow = ConXDynamicPanelConfigFlow()
    flow.hass = SimpleNamespace(states=SimpleNamespace(async_all=lambda: []))
    entities = [
        "switch.tp4_l1",
        "switch.tp4_l2",
        "switch.tp4_l3",
        "switch.tp4_l4",
        "text.tp4_name_l1",
        "text.tp4_name_l2",
        "text.tp4_name_l3",
        "text.tp4_name_l4",
        "select.tp4_switch_color_off",
        "select.tp4_switch_color_on",
        "select.tp4_radar_config",
        "switch.tp4_backlight_mode",
        "switch.tp4_child_lock",
    ]
    with patch(
        "custom_components.conx_dynamic_panel.config_flow.discover_mapping_from_hass",
        return_value=discover_mapping_from_entities(entities, "tp4"),
    ):
        result = await flow.async_step_user(
            {
                "panel_name": "Living",
                CONF_DEVICE_PREFIX: "tp4",
                CONF_MAPPING_MODE: MAPPING_MODE_PREFIX,
                "adapter_type": "zemismart_4gang",
            }
        )
    assert result["type"] == "form"
    assert result["step_id"] == "relays"
    assert flow._data["relay_entities"] == [
        "switch.tp4_l1",
        "switch.tp4_l2",
        "switch.tp4_l3",
        "switch.tp4_l4",
    ]
    assert flow._data["color_on_entity"] == "select.tp4_switch_color_on"


@pytest.mark.asyncio
async def test_config_flow_prefix_not_found() -> None:
    flow = ConXDynamicPanelConfigFlow()
    flow.hass = SimpleNamespace()
    empty = discover_mapping_from_entities([], "missing")
    with patch(
        "custom_components.conx_dynamic_panel.config_flow.discover_mapping_from_hass",
        return_value=empty,
    ):
        result = await flow.async_step_user(
            {
                "panel_name": "Living",
                CONF_DEVICE_PREFIX: "missing",
                CONF_MAPPING_MODE: MAPPING_MODE_PREFIX,
                "adapter_type": "zemismart_4gang",
            }
        )
    assert result["type"] == "form"
    assert result["step_id"] == "user"
    assert result["errors"]["base"] == "prefix_not_found"


@pytest.mark.asyncio
async def test_config_flow_manual_skips_discovery() -> None:
    flow = ConXDynamicPanelConfigFlow()
    flow.hass = SimpleNamespace()
    with patch(
        "custom_components.conx_dynamic_panel.config_flow.discover_mapping_from_hass",
        new=MagicMock(),
    ) as discover:
        result = await flow.async_step_user(
            {
                "panel_name": "Living",
                CONF_DEVICE_PREFIX: "tp4",
                CONF_MAPPING_MODE: MAPPING_MODE_MANUAL,
                "adapter_type": "zemismart_4gang",
            }
        )
    discover.assert_not_called()
    assert result["step_id"] == "relays"
    assert "relay_entities" not in flow._data
