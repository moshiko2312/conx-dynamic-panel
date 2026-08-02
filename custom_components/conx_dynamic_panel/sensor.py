"""Sensor platform."""

from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .coordinator import PanelCoordinator
from .entity import ConXPanelEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up sensors."""
    coordinator: PanelCoordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]
    async_add_entities(
        [
            ConXSyncStatusSensor(coordinator),
            ConXLastSyncSensor(coordinator),
            ConXLastErrorSensor(coordinator),
        ]
    )


class ConXSyncStatusSensor(ConXPanelEntity, SensorEntity):
    """Expose sync status."""

    _attr_translation_key = "sync_status"

    def __init__(self, coordinator: PanelCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.runtime.entry.entry_id}_sync_status"

    @property
    def native_value(self) -> str | None:
        return self.coordinator.data.sync_status


class ConXLastSyncSensor(ConXPanelEntity, SensorEntity):
    """Expose last successful sync timestamp."""

    _attr_translation_key = "last_sync"

    def __init__(self, coordinator: PanelCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.runtime.entry.entry_id}_last_sync"

    @property
    def native_value(self) -> str | None:
        return self.coordinator.data.last_sync


class ConXLastErrorSensor(ConXPanelEntity, SensorEntity):
    """Expose last sync error."""

    _attr_translation_key = "last_error"
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator: PanelCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.runtime.entry.entry_id}_last_error"

    @property
    def native_value(self) -> str | None:
        return self.coordinator.data.last_error
