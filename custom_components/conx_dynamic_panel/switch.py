"""Switch platform."""

from __future__ import annotations

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import CONF_AUTO_SYNC, DOMAIN
from .coordinator import PanelCoordinator
from .entity import ConXPanelEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up switches."""
    coordinator: PanelCoordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]
    async_add_entities([ConXAutoSyncSwitch(coordinator)])


class ConXAutoSyncSwitch(ConXPanelEntity, SwitchEntity):
    """Enable or disable automatic sync after draft changes."""

    _attr_translation_key = "auto_sync"

    def __init__(self, coordinator: PanelCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.runtime.entry.entry_id}_auto_sync"

    @property
    def is_on(self) -> bool:
        return self.coordinator.runtime.auto_sync

    async def async_turn_on(self, **kwargs: object) -> None:
        await self._async_set(True)

    async def async_turn_off(self, **kwargs: object) -> None:
        await self._async_set(False)

    async def _async_set(self, value: bool) -> None:
        options = dict(self.coordinator.runtime.entry.options)
        options[CONF_AUTO_SYNC] = value
        self.hass.config_entries.async_update_entry(
            self.coordinator.runtime.entry, options=options
        )
        self.async_write_ha_state()
