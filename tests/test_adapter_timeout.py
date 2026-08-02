"""Hardware confirmation timeout tests."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.adapters.zemismart import Zemismart4GangAdapter
from custom_components.conx_dynamic_panel.exceptions import HardwareWriteError
from custom_components.conx_dynamic_panel.models import EntityMapping
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker


@pytest.mark.asyncio
async def test_wait_for_state_times_out() -> None:
    mapping = EntityMapping.from_dict(
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
    hass = SimpleNamespace(
        states=SimpleNamespace(get=lambda entity_id: SimpleNamespace(state="off")),
        services=SimpleNamespace(async_call=AsyncMock()),
    )
    adapter = Zemismart4GangAdapter(
        hass,  # type: ignore[arg-type]
        mapping,
        SuppressionTracker(),
        confirm_timeout=0.15,
    )
    with pytest.raises(HardwareWriteError, match="Timed out"):
        await adapter.async_set_relay(1, True, suppress_event=True)
    hass.services.async_call.assert_awaited()
