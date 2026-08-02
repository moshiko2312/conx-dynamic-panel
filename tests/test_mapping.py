"""Mapping model and uniqueness tests."""

from __future__ import annotations

import pytest

from custom_components.conx_dynamic_panel.models import EntityMapping


def test_mapping_rejects_wrong_counts() -> None:
    with pytest.raises(ValueError):
        EntityMapping.from_dict(
            {
                "panel_name": "Kitchen",
                "adapter_type": "zemismart_4gang",
                "relay_entities": ["switch.a"],
                "name_entities": ["text.a", "text.b", "text.c", "text.d"],
                "color_off_entity": "select.off",
                "color_on_entity": "select.on",
                "radar_entity": "select.radar",
                "backlight_entity": "switch.backlight",
                "child_lock_entity": "switch.lock",
            }
        )


def test_mapping_roundtrip() -> None:
    data = {
        "panel_name": "Kitchen",
        "adapter_type": "zemismart_4gang",
        "relay_entities": ["switch.a", "switch.b", "switch.c", "switch.d"],
        "name_entities": ["text.a", "text.b", "text.c", "text.d"],
        "color_off_entity": "select.off",
        "color_on_entity": "select.on",
        "radar_entity": "select.radar",
        "backlight_entity": "switch.backlight",
        "child_lock_entity": "switch.lock",
    }
    mapping = EntityMapping.from_dict(data)
    assert mapping.to_dict()["panel_name"] == "Kitchen"
    assert len(mapping.all_entities()) == 13
