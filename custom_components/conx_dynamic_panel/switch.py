"""Switch platform."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import CONF_AUTO_SYNC, DOMAIN
from .coordinator import PanelCoordinator
from .entity import ConXPanelEntity
from .master_store import async_get_master_store


async def _async_purge_switch(hass: HomeAssistant, switch: SwitchEntity) -> None:
    """Fully remove a dynamic switch (entity registry + state).

    Plain ``Entity.async_remove()`` without ``force_remove`` leaves a registry
    entry and writes ``unavailable`` — the symptom users see after deleting a
    scheduler task. Purge the registry unique_id and force-remove the state.
    """
    registry = er.async_get(hass)
    entity_id = getattr(switch, "entity_id", None)
    if not entity_id or registry.async_get(entity_id) is None:
        unique_id = getattr(switch, "unique_id", None) or getattr(
            switch, "_attr_unique_id", None
        )
        if unique_id:
            by_uid = registry.async_get_entity_id("switch", DOMAIN, unique_id)
            if by_uid:
                entity_id = by_uid
    if entity_id and registry.async_get(entity_id) is not None:
        registry.async_remove(entity_id)
    await switch.async_remove(force_remove=True)


def _purge_orphan_scheduler_registry_entries(
    hass: HomeAssistant,
    *,
    entry_id: str,
    local_task_ids: set[str],
    master_task_ids: set[str] | None,
) -> None:
    """Drop registry unique_ids for scheduler switches no longer in storage.

    Without this, a prior plain ``async_remove()`` left orphans that HA restores
    as ``unavailable`` on every config-entry reload.
    """
    registry = er.async_get(hass)
    local_prefix = f"{entry_id}_scheduler_"
    master_prefix = f"{DOMAIN}_master_scheduler_"
    for entity_entry in list(registry.entities.values()):
        if getattr(entity_entry, "domain", None) != "switch":
            continue
        if getattr(entity_entry, "platform", None) != DOMAIN:
            continue
        unique_id = str(getattr(entity_entry, "unique_id", "") or "")
        entity_id = getattr(entity_entry, "entity_id", None)
        if not entity_id:
            continue
        if unique_id.startswith(local_prefix):
            task_id = unique_id[len(local_prefix) :]
            if task_id and task_id not in local_task_ids:
                registry.async_remove(entity_id)
            continue
        if master_task_ids is not None and unique_id.startswith(master_prefix):
            task_id = unique_id[len(master_prefix) :]
            if task_id and task_id not in master_task_ids:
                registry.async_remove(entity_id)


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
    master_task_ids: set[str] | None = None
    if not domain_data.get("master_switches_added"):
        master_store = await async_get_master_store(hass)
        master_task_ids = set(master_store.tasks)
        for task_id in master_store.tasks:
            switch = ConXMasterSchedulerTaskSwitch(coordinator, task_id)
            master_entities[task_id] = switch
            entities.append(switch)
        domain_data["master_switches_added"] = True
        domain_data["master_switch_entities"] = master_entities
    else:
        master_entities = domain_data.setdefault("master_switch_entities", {})

    _purge_orphan_scheduler_registry_entries(
        hass,
        entry_id=entry.entry_id,
        local_task_ids=set(coordinator.data.scheduler_tasks),
        master_task_ids=master_task_ids,
    )

    async_add_entities(entities)

    def _add_task(task_id: str) -> None:
        if task_id in task_entities:
            return
        switch = ConXSchedulerTaskSwitch(coordinator, task_id)
        task_entities[task_id] = switch
        async_add_entities([switch])

    async def _remove_task(task_id: str) -> None:
        switch = task_entities.pop(task_id, None)
        if switch is not None:
            await _async_purge_switch(hass, switch)

    def _add_master(task_id: str) -> None:
        if task_id in master_entities:
            return
        switch = ConXMasterSchedulerTaskSwitch(coordinator, task_id)
        master_entities[task_id] = switch
        async_add_entities([switch])

    async def _remove_master(task_id: str) -> None:
        switch = master_entities.pop(task_id, None)
        if switch is not None:
            await _async_purge_switch(hass, switch)

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
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, coordinator: PanelCoordinator, task_id: str) -> None:
        super().__init__(coordinator)
        self._task_id = task_id
        self._attr_unique_id = f"{coordinator.runtime.entry.entry_id}_scheduler_{task_id}"

    @property
    def name(self) -> str:
        task = self.coordinator.data.scheduler_tasks.get(self._task_id)
        return task.name if task else self._task_id

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
    _attr_entity_category = EntityCategory.CONFIG

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
