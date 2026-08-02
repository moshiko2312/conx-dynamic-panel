"""Button platform."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
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
    """Set up buttons."""
    coordinator: PanelCoordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]
    async_add_entities(
        [
            ConXSyncButton(coordinator),
            ConXPullButton(coordinator),
        ]
    )


class ConXSyncButton(ConXPanelEntity, ButtonEntity):
    """Trigger sync to panel."""

    _attr_translation_key = "sync"

    def __init__(self, coordinator: PanelCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.runtime.entry.entry_id}_sync"

    async def async_press(self) -> None:
        await self.coordinator.async_sync()


class ConXPullButton(ConXPanelEntity, ButtonEntity):
    """Pull hardware state into the active profile."""

    _attr_translation_key = "pull_from_panel"

    def __init__(self, coordinator: PanelCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.runtime.entry.entry_id}_pull"

    async def async_press(self) -> None:
        await self.coordinator.async_pull_from_panel()
