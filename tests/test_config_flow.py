"""Config flow and reconfigure behavior tests."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest

from custom_components.conx_dynamic_panel.config_flow import ConXDynamicPanelConfigFlow
from custom_components.conx_dynamic_panel.exceptions import MappingValidationError


def _base_data() -> dict[str, Any]:
    return {
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


@pytest.mark.asyncio
async def test_summary_requires_confirmation_before_create() -> None:
    flow = ConXDynamicPanelConfigFlow()
    flow.hass = SimpleNamespace()
    flow._data = _base_data()
    with patch(
        "custom_components.conx_dynamic_panel.config_flow._async_validate_mapping",
        new=AsyncMock(),
    ):
        result = await flow.async_step_summary(user_input=None)
    assert result["type"] == "form"
    assert result["step_id"] == "summary"


@pytest.mark.asyncio
async def test_summary_creates_entry_after_confirm() -> None:
    flow = ConXDynamicPanelConfigFlow()
    flow.hass = SimpleNamespace()
    flow._data = _base_data()
    with patch(
        "custom_components.conx_dynamic_panel.config_flow._async_validate_mapping",
        new=AsyncMock(),
    ):
        result = await flow.async_step_summary(user_input={"confirm": True})
    assert result["type"] == "create_entry"
    assert result["title"] == "Kitchen"
    assert result["data"]["panel_name"] == "Kitchen"


@pytest.mark.asyncio
async def test_summary_shows_validation_error() -> None:
    flow = ConXDynamicPanelConfigFlow()
    flow.hass = SimpleNamespace()
    flow._data = _base_data()
    with patch(
        "custom_components.conx_dynamic_panel.config_flow._async_validate_mapping",
        new=AsyncMock(side_effect=MappingValidationError("bad mapping")),
    ):
        result = await flow.async_step_summary(user_input={"confirm": True})
    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_mapping"
    assert "bad mapping" in result["description_placeholders"]["error"]


@pytest.mark.asyncio
async def test_reconfigure_updates_existing_entry() -> None:
    flow = ConXDynamicPanelConfigFlow()
    flow.hass = SimpleNamespace()
    flow._data = _base_data()
    flow._reconfigure = True
    entry = SimpleNamespace(entry_id="entry-1", data=_base_data(), unique_id="old")
    with (
        patch(
            "custom_components.conx_dynamic_panel.config_flow._async_validate_mapping",
            new=AsyncMock(),
        ),
        patch.object(flow, "_get_reconfigure_entry", return_value=entry),
    ):
        result = await flow.async_step_summary(user_input={"confirm": True})
    assert result["type"] == "abort"
    assert result["reason"] == "reconfigure_successful"


@pytest.mark.asyncio
async def test_duplicate_relays_rejected_in_relays_step() -> None:
    flow = ConXDynamicPanelConfigFlow()
    flow.hass = SimpleNamespace()
    flow._data = {"panel_name": "Kitchen", "adapter_type": "zemismart_4gang"}
    result = await flow.async_step_relays(
        {
            "relay_l1": "switch.l1",
            "relay_l2": "switch.l1",
            "relay_l3": "switch.l3",
            "relay_l4": "switch.l4",
        }
    )
    assert result["type"] == "form"
    assert result["errors"]["base"] == "duplicate_relays"
