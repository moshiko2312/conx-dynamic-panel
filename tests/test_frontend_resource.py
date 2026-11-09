"""The Lovelace resource URL tracks the integration version."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from custom_components.conx_dynamic_panel import _async_register_lovelace_resource

BASE = "/conx_dynamic_panel/frontend/conx-dynamic-panel-card.js"


class FakeResources:
    """Mirrors HA's ResourceStorageCollection: empty until loaded."""

    def __init__(self, stored: list[dict[str, Any]]) -> None:
        self._stored = stored
        self.items: list[dict[str, Any]] = []
        self.created: list[dict[str, Any]] = []
        self.updated: list[tuple[str, dict[str, Any]]] = []

    async def async_get_info(self) -> dict[str, int]:
        self.items = self._stored
        return {"resources": len(self.items)}

    def async_items(self) -> list[dict[str, Any]]:
        return self.items

    async def async_create_item(self, data: dict[str, Any]) -> dict[str, Any]:
        self.created.append(data)
        return data

    async def async_update_item(self, item_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        self.updated.append((item_id, updates))
        return updates


def _hass(resources: FakeResources) -> Any:
    # Current HA keeps a LovelaceData object (not a dict) under "lovelace".
    return SimpleNamespace(data={"lovelace": SimpleNamespace(resources=resources)})


async def test_creates_resource_with_version_query() -> None:
    resources = FakeResources([])
    await _async_register_lovelace_resource(_hass(resources), f"{BASE}?v=0.3.16")
    assert resources.created == [{"res_type": "module", "url": f"{BASE}?v=0.3.16"}]


async def test_updates_resource_left_by_an_older_version() -> None:
    resources = FakeResources([{"id": "abc", "type": "module", "url": f"{BASE}?v=0.1.1"}])
    await _async_register_lovelace_resource(_hass(resources), f"{BASE}?v=0.3.16")
    assert resources.created == []
    assert resources.updated == [("abc", {"url": f"{BASE}?v=0.3.16"})]


async def test_current_resource_is_left_alone() -> None:
    resources = FakeResources([{"id": "abc", "type": "module", "url": f"{BASE}?v=0.3.16"}])
    await _async_register_lovelace_resource(_hass(resources), f"{BASE}?v=0.3.16")
    assert resources.created == []
    assert resources.updated == []
