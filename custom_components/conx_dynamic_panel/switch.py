"""Switch platform."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import CONF_AUTO_SYNC, DOMAIN
from .coordinator import PanelCoordinator
from .entity import ConXPanelEntity
from .master_store import async_get_master_store


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up switches."""
    coordinator: PanelCoordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]
    entities: list[SwitchEntity] = [
        ConXAutoSyncSwitch(coordinator),
        ConXPanelHolidayModeSwitch(coordinator),
    ]

    domain_data = hass.data.setdefault(DOMAIN, {})
    if not domain_data.get("holiday_switch_added"):
        entities.append(ConXMasterHolidayModeSwitch(coordinator))
        domain_data["holiday_switch_added"] = True

    task_entities: dict[str, ConXSchedulerTaskSwitch] = {}
    for task_id in coordinator.data.scheduler_tasks:
        switch = ConXSchedulerTaskSwitch(coordinator, task_id)
        task_entities[task_id] = switch
        entities.append(switch)

    master_entities: dict[str, ConXMasterSchedulerTaskSwitch] = {}
    if not domain_data.get("master_switches_added"):
        master_store = await async_get_master_store(hass)
        for task_id in master_store.tasks:
            switch = ConXMasterSchedulerTaskSwitch(coordinator, task_id)
            master_entities[task_id] = switch
            entities.append(switch)
        domain_data["master_switches_added"] = True
        domain_data["master_switch_entities"] = master_entities
    else:
        master_entities = domain_data.setdefault("master_switch_entities", {})

    async_add_entities(entities)

    def _add_task(task_id: str) -> None:
        if task_id in task_entities:
            return
        switch = ConXSchedulerTaskSwitch(coordinator, task_id)
        task_entities[task_id] = switch
        async_add_entities([switch])

    def _remove_task(task_id: str) -> None:
        switch = task_entities.pop(task_id, None)
        if switch is not None:
            hass.async_create_task(switch.async_remove())

    def _add_master(task_id: str) -> None:
        if task_id in master_entities:
            return
        switch = ConXMasterSchedulerTaskSwitch(coordinator, task_id)
        master_entities[task_id] = switch
        async_add_entities([switch])

    def _remove_master(task_id: str) -> None:
        switch = master_entities.pop(task_id, None)
        if switch is not None:
            hass.async_create_task(switch.async_remove())

    coordinator.register_scheduler_entity_hooks(
        adder=_add_task,
        remover=_remove_task,
        master_adder=_add_master,
        master_remover=_remove_master,
    )


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
        self.hass.config_entries.async_update_entry(self.coordinator.runtime.entry, options=options)
        self.async_write_ha_state()


class ConXPanelHolidayModeSwitch(ConXPanelEntity, SwitchEntity):
    """Per-panel holiday — suspends this panel's schedulers only."""

    _attr_translation_key = "panel_holiday_mode"
    _attr_name = "Holiday mode"

    def __init__(self, coordinator: PanelCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.runtime.entry.entry_id}_holiday_mode"

    @property
    def is_on(self) -> bool:
        return bool(self.coordinator.data.holiday_mode)

    async def async_turn_on(self, **kwargs: object) -> None:
        await self.coordinator.async_set_holiday_mode(True, scope="panel")
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs: object) -> None:
        await self.coordinator.async_set_holiday_mode(False, scope="panel")
        self.async_write_ha_state()


class ConXMasterHolidayModeSwitch(ConXPanelEntity, SwitchEntity):
    """Master holiday — when ON, every panel's scheduler is suspended.

    Keeps the legacy unique_id from the old global holiday switch so existing
    automations/entity_ids remain stable after migration.
    """

    _attr_translation_key = "master_holiday_mode"
    _attr_name = "Master holiday mode"

    def __init__(self, coordinator: PanelCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_holiday_mode"
        self._attr_entity_registry_enabled_default = True

    @property
    def is_on(self) -> bool:
        store = self.hass.data.get(DOMAIN, {}).get("holiday_store")
        return bool(getattr(store, "master_holiday", getattr(store, "holiday_mode", False)))

    async def async_turn_on(self, **kwargs: object) -> None:
        await self.coordinator.async_set_holiday_mode(True, scope="master")
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs: object) -> None:
        await self.coordinator.async_set_holiday_mode(False, scope="master")
        self.async_write_ha_state()


# Backward-compatible name for imports / older references.
ConXHolidayModeSwitch = ConXMasterHolidayModeSwitch


class ConXSchedulerTaskSwitch(ConXPanelEntity, SwitchEntity):
    """Enable or disable one scheduler task for this panel."""

    _attr_translation_key = "scheduler_task"

    def __init__(self, coordinator: PanelCoordinator, task_id: str) -> None:
        super().__init__(coordinator)
        self._task_id = task_id
        self._attr_unique_id = f"{coordinator.runtime.entry.entry_id}_scheduler_{task_id}"

    @property
    def name(self) -> str:
        task = self.coordinator.data.scheduler_tasks.get(self._task_id)
        label = task.name if task else self._task_id
        return f"Schedule {label}"

    @property
    def is_on(self) -> bool:
        task = self.coordinator.data.scheduler_tasks.get(self._task_id)
        return bool(task and task.enabled)

    @property
    def available(self) -> bool:
        return self._task_id in self.coordinator.data.scheduler_tasks

    async def async_turn_on(self, **kwargs: Any) -> None:
        try:
            await self.coordinator.async_set_scheduler_task_enabled(self._task_id, True)
        except ValueError as err:
            raise HomeAssistantError(str(err)) from err
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self.coordinator.async_set_scheduler_task_enabled(self._task_id, False)
        self.async_write_ha_state()


class ConXMasterSchedulerTaskSwitch(ConXPanelEntity, SwitchEntity):
    """Enable or disable a multi-panel master scheduler task (domain-level)."""

    _attr_translation_key = "master_scheduler_task"
    _attr_name = "Master schedule"

    def __init__(self, coordinator: PanelCoordinator, task_id: str) -> None:
        super().__init__(coordinator)
        self._task_id = task_id
        self._attr_unique_id = f"{DOMAIN}_master_scheduler_{task_id}"

    def _task(self) -> Any:
        store = self.hass.data.get(DOMAIN, {}).get("master_store")
        if store is None:
            return None
        return store.tasks.get(self._task_id)

    @property
    def name(self) -> str:
        task = self._task()
        label = task.name if task else self._task_id
        return f"Master schedule {label}"

    @property
    def is_on(self) -> bool:
        task = self._task()
        return bool(task and task.enabled)

    @property
    def available(self) -> bool:
        return self._task() is not None

    async def async_turn_on(self, **kwargs: Any) -> None:
        try:
            await self.coordinator.async_set_scheduler_task_enabled(self._task_id, True)
        except ValueError as err:
            raise HomeAssistantError(str(err)) from err
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self.coordinator.async_set_scheduler_task_enabled(self._task_id, False)
        self.async_write_ha_state()
