"""Shared entity base."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity import Entity

from .const import DOMAIN, MANUFACTURER, MODEL_ZEMISMART_4GANG
from .coordinator import PanelCoordinator


class ConXPanelEntity(Entity):
    """Base entity bound to one panel coordinator."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, coordinator: PanelCoordinator) -> None:
        self.coordinator = coordinator
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.runtime.entry.entry_id)},
            manufacturer=MANUFACTURER,
            model=MODEL_ZEMISMART_4GANG,
            name=coordinator.runtime.mapping.panel_name,
        )

    async def async_added_to_hass(self) -> None:
        """Register for coordinator updates."""
        await super().async_added_to_hass()
        self.async_on_remove(self.coordinator.runtime.async_add_listener(self.async_write_ha_state))
