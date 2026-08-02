"""Select platform."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .coordinator import PanelCoordinator
from .entity import ConXPanelEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up select entities."""
    coordinator: PanelCoordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]
    async_add_entities([ConXActiveProfileSelect(coordinator)])


class ConXActiveProfileSelect(ConXPanelEntity, SelectEntity):
    """Select the active profile."""

    _attr_translation_key = "active_profile"

    def __init__(self, coordinator: PanelCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.runtime.entry.entry_id}_active_profile"

    @property
    def options(self) -> list[str]:
        """Return profile IDs."""
        return sorted(self.coordinator.data.profiles)

    @property
    def current_option(self) -> str | None:
        """Return active profile ID."""
        return self.coordinator.data.active_profile_id

    async def async_select_option(self, option: str) -> None:
        """Activate selected profile without forcing sync."""
        await self.coordinator.async_activate_profile(option, sync=False)
