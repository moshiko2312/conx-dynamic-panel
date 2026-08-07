"""Scheduler task switches must be fully removed on delete (not left unavailable)."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest
from homeassistant.helpers import entity_registry as er

from custom_components.conx_dynamic_panel.const import DOMAIN
from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.models import (
    EntityMapping,
    HardwareState,
    PanelStorageData,
    Profile,
    ScheduleRange,
    SchedulerTask,
    SyncResult,
)
from custom_components.conx_dynamic_panel.runtime import (
    CoverRuntime,
    MomentaryRuntime,
    MultiClickRuntime,
)
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker
from custom_components.conx_dynamic_panel.switch import (
    ConXMasterSchedulerTaskSwitch,
    ConXSchedulerTaskSwitch,
    _async_purge_switch,
    async_setup_entry,
)


class FakeStore:
    def __init__(self, data: PanelStorageData | None = None) -> None:
        self.data = data or PanelStorageData()
        if not self.data.profiles:
            self.data.ensure_defaults()
        self.saved = 0

    async def async_load(self) -> PanelStorageData:
        return self.data

    async def async_save(self) -> None:
        self.saved += 1


class FakeAdapter:
    async def async_apply_profile(self, profile: Profile) -> SyncResult:
        return SyncResult(success=True, confirmed_steps=["names"])

    async def async_set_relay(
        self, index: int, state: bool, *, suppress_event: bool = True
    ) -> None:
        return None

    async def async_read_hardware_state(self) -> HardwareState:
        return HardwareState(
            names=("a", "b", "c", "d"),
            relays=(False, False, False, False),
            color_on="cyan",
            color_off="blue",
            radar="30s",
            backlight=True,
            child_lock=False,
        )

    def supported_colors(self) -> list[str]:
        return ["cyan", "blue"]

    def supported_radar(self) -> list[str]:
        return ["30s"]


def _runtime(store: FakeStore, *, entry_id: str = "entry-1") -> Any:
    mapping = EntityMapping(
        panel_name="Kitchen",
        adapter_type="zemismart_4gang",
        relay_entities=("switch.l1", "switch.l2", "switch.l3", "switch.l4"),
        name_entities=("text.n1", "text.n2", "text.n3", "text.n4"),
        color_off_entity="select.off",
        color_on_entity="select.on",
        radar_entity="select.radar",
        backlight_entity="switch.backlight",
        child_lock_entity="switch.lock",
    )
    holiday_store = SimpleNamespace(holiday_mode=False, master_holiday=False)
    registry = er.FakeEntityRegistry()
    listeners: list[Any] = []

    def _add_listener(cb: Any) -> Any:
        listeners.append(cb)
        return lambda: None

    hass = SimpleNamespace(
        services=SimpleNamespace(has_service=lambda *_a, **_k: True, async_call=AsyncMock()),
        states=SimpleNamespace(get=lambda *_a, **_k: None, async_remove=lambda *_a, **_k: None),
        bus=SimpleNamespace(async_fire=AsyncMock()),
        data={DOMAIN: {"holiday_store": holiday_store, "_entity_registry": registry}},
        entity_registry=registry,
        async_create_task=lambda coro: coro.close() if hasattr(coro, "close") else None,
        loop=SimpleNamespace(call_later=lambda *_a, **_k: None),
    )
    entry = SimpleNamespace(entry_id=entry_id, options={}, data={})
    return SimpleNamespace(
        hass=hass,
        entry=entry,
        mapping=mapping,
        store=store,
        adapter=FakeAdapter(),
        suppression=SuppressionTracker(),
        sync_lock=__import__("asyncio").Lock(),
        cover=CoverRuntime(),
        momentary=MomentaryRuntime(),
        multiclick=MultiClickRuntime(),
        unloading=False,
        auto_sync=False,
        pending=False,
        last_error=None,
        last_sync_result=None,
        listeners=listeners,
        update_callbacks=[],
        confirm_timeout=5.0,
        sync_timeout=30.0,
        async_add_listener=_add_listener,
        async_notify=lambda: None,
    )


@pytest.mark.asyncio
async def test_purge_removes_registry_and_force_removes_state() -> None:
    registry = er.FakeEntityRegistry()
    hass = SimpleNamespace(entity_registry=registry, data={})
    switch = SimpleNamespace(
        entity_id="switch.schedule_day",
        unique_id="entry-1_scheduler_day",
        async_remove=AsyncMock(),
    )
    registry.register(
        "switch.schedule_day",
        unique_id="entry-1_scheduler_day",
    )

    await _async_purge_switch(hass, switch)

    assert "switch.schedule_day" in registry.removed
    assert registry.async_get("switch.schedule_day") is None
    switch.async_remove.assert_awaited_once_with(force_remove=True)


@pytest.mark.asyncio
async def test_purge_falls_back_to_unique_id_lookup() -> None:
    registry = er.FakeEntityRegistry()
    hass = SimpleNamespace(entity_registry=registry, data={})
    registry.register(
        "switch.schedule_day",
        unique_id="entry-1_scheduler_day",
    )
    switch = SimpleNamespace(
        entity_id=None,
        unique_id="entry-1_scheduler_day",
        async_remove=AsyncMock(),
    )

    await _async_purge_switch(hass, switch)

    assert registry.removed == ["switch.schedule_day"]
    switch.async_remove.assert_awaited_once_with(force_remove=True)


@pytest.mark.asyncio
async def test_delete_local_task_purges_switch_entity(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeStore()
    store.data.scheduler_tasks["day"] = SchedulerTask(
        id="day",
        name="Day",
        ranges=[ScheduleRange("08:00", "12:00", "lighting")],
    )
    runtime = _runtime(store)
    coordinator = PanelCoordinator(runtime)
    runtime.hass.data[DOMAIN][runtime.entry.entry_id] = {"coordinator": coordinator}

    added: list[Any] = []

    def _capture(entities: list[Any]) -> None:
        added.extend(entities)
        for ent in entities:
            if isinstance(ent, ConXSchedulerTaskSwitch):
                ent.hass = runtime.hass
                ent.entity_id = f"switch.conx_schedule_{ent._task_id}"
                runtime.hass.entity_registry.register(
                    ent.entity_id,
                    unique_id=ent.unique_id,
                )

    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.switch.async_get_master_store",
        AsyncMock(return_value=SimpleNamespace(tasks={})),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_get_master_store",
        AsyncMock(return_value=SimpleNamespace(tasks={})),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_track_point_in_time",
        lambda *_a, **_k: (lambda: None),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.master_holiday_enabled",
        lambda _hass: False,
    )

    await async_setup_entry(runtime.hass, runtime.entry, _capture)

    task_switches = [e for e in added if isinstance(e, ConXSchedulerTaskSwitch)]
    assert len(task_switches) == 1
    entity_id = task_switches[0].entity_id
    assert runtime.hass.entity_registry.async_get(entity_id) is not None

    await coordinator.async_delete_scheduler_task("day")

    assert "day" not in store.data.scheduler_tasks
    assert entity_id in runtime.hass.entity_registry.removed
    assert runtime.hass.entity_registry.async_get(entity_id) is None
    assert getattr(task_switches[0], "_removed", False) is True
    assert getattr(task_switches[0], "_force_remove", False) is True


@pytest.mark.asyncio
async def test_delete_master_task_purges_switch_entity(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeStore()
    runtime = _runtime(store)
    coordinator = PanelCoordinator(runtime)
    runtime.hass.data[DOMAIN][runtime.entry.entry_id] = {"coordinator": coordinator}
    task = SchedulerTask(
        id="master_day",
        name="Master day",
        scope="master",
        entry_ids=["entry-1"],
        ranges=[ScheduleRange("08:00", "12:00", "lighting")],
    )
    master_tasks = {"master_day": task}

    async def _delete(task_id: str) -> None:
        del master_tasks[task_id]

    master = SimpleNamespace(
        tasks=master_tasks,
        async_delete=_delete,
        tasks_for_entry=lambda entry_id: [
            item for item in master_tasks.values() if entry_id in item.entry_ids
        ],
    )
    runtime.hass.data[DOMAIN]["master_store"] = master

    added: list[Any] = []

    def _capture(entities: list[Any]) -> None:
        added.extend(entities)
        for ent in entities:
            if isinstance(ent, ConXMasterSchedulerTaskSwitch):
                ent.hass = runtime.hass
                ent.entity_id = f"switch.conx_master_{ent._task_id}"
                runtime.hass.entity_registry.register(
                    ent.entity_id,
                    unique_id=ent.unique_id,
                )

    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.switch.async_get_master_store",
        AsyncMock(return_value=master),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_get_master_store",
        AsyncMock(return_value=master),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_track_point_in_time",
        lambda *_a, **_k: (lambda: None),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.master_holiday_enabled",
        lambda _hass: False,
    )

    await async_setup_entry(runtime.hass, runtime.entry, _capture)

    master_switches = [e for e in added if isinstance(e, ConXMasterSchedulerTaskSwitch)]
    assert len(master_switches) == 1
    entity_id = master_switches[0].entity_id

    await coordinator.async_delete_scheduler_task("master_day")

    assert "master_day" not in master.tasks
    assert entity_id in runtime.hass.entity_registry.removed
    assert runtime.hass.entity_registry.async_get(entity_id) is None
    assert getattr(master_switches[0], "_force_remove", False) is True


@pytest.mark.asyncio
async def test_setup_purges_orphan_scheduler_registry_entries(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeStore()
    runtime = _runtime(store)
    coordinator = PanelCoordinator(runtime)
    runtime.hass.data[DOMAIN][runtime.entry.entry_id] = {"coordinator": coordinator}
    runtime.hass.data[DOMAIN].pop("holiday_switch_added", None)
    runtime.hass.data[DOMAIN].pop("master_switches_added", None)
    runtime.hass.data[DOMAIN].pop("master_switch_entities", None)

    registry = runtime.hass.entity_registry
    orphan_local = "switch.orphan_local"
    orphan_master = "switch.orphan_master"
    keep_auto = "switch.auto_sync_keep"
    registry.register(
        orphan_local,
        unique_id=f"{runtime.entry.entry_id}_scheduler_gone",
    )
    registry.register(
        orphan_master,
        unique_id=f"{DOMAIN}_master_scheduler_gone",
    )
    registry.register(
        keep_auto,
        unique_id=f"{runtime.entry.entry_id}_auto_sync",
    )

    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.switch.async_get_master_store",
        AsyncMock(return_value=SimpleNamespace(tasks={})),
    )

    await async_setup_entry(runtime.hass, runtime.entry, lambda _ents: None)

    assert orphan_local in registry.removed
    assert orphan_master in registry.removed
    assert registry.async_get(keep_auto) is not None
    assert (
        registry.async_get_entity_id(
            "switch", DOMAIN, f"{runtime.entry.entry_id}_scheduler_gone"
        )
        is None
    )


@pytest.mark.asyncio
async def test_upsert_adds_switch_and_reload_skips_deleted(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeStore()
    runtime = _runtime(store)
    coordinator = PanelCoordinator(runtime)
    runtime.hass.data[DOMAIN][runtime.entry.entry_id] = {"coordinator": coordinator}
    runtime.hass.data[DOMAIN].pop("holiday_switch_added", None)
    runtime.hass.data[DOMAIN].pop("master_switches_added", None)
    runtime.hass.data[DOMAIN].pop("master_switch_entities", None)

    added_batches: list[list[Any]] = []

    def _capture(entities: list[Any]) -> None:
        added_batches.append(list(entities))
        for ent in entities:
            if isinstance(ent, (ConXSchedulerTaskSwitch, ConXMasterSchedulerTaskSwitch)):
                ent.hass = runtime.hass
                ent.entity_id = f"switch.dyn_{ent._task_id}"
                runtime.hass.entity_registry.register(
                    ent.entity_id,
                    unique_id=ent.unique_id,
                )

    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.switch.async_get_master_store",
        AsyncMock(return_value=SimpleNamespace(tasks={})),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_get_master_store",
        AsyncMock(return_value=SimpleNamespace(tasks={})),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_track_point_in_time",
        lambda *_a, **_k: (lambda: None),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.master_holiday_enabled",
        lambda _hass: False,
    )

    await async_setup_entry(runtime.hass, runtime.entry, _capture)
    assert not any(isinstance(e, ConXSchedulerTaskSwitch) for batch in added_batches for e in batch)

    await coordinator.async_upsert_scheduler_task(
        {
            "id": "evening",
            "name": "Evening",
            "enabled": True,
            "weekdays": list(range(7)),
            "months": list(range(1, 13)),
            "ranges": [{"start": "17:00", "end": "22:00", "profile_id": "scenes"}],
        }
    )
    created = [
        e
        for batch in added_batches
        for e in batch
        if isinstance(e, ConXSchedulerTaskSwitch) and e._task_id == "evening"
    ]
    assert len(created) == 1
    entity_id = created[0].entity_id
    assert runtime.hass.entity_registry.async_get(entity_id) is not None

    await coordinator.async_set_scheduler_task_enabled("evening", False)
    assert store.data.scheduler_tasks["evening"].enabled is False
    await coordinator.async_set_scheduler_task_enabled("evening", True)
    assert store.data.scheduler_tasks["evening"].enabled is True

    await coordinator.async_delete_scheduler_task("evening")
    assert "evening" not in store.data.scheduler_tasks
    assert entity_id in runtime.hass.entity_registry.removed

    # Simulate entry reload: only tasks still in store get switches.
    runtime.hass.data[DOMAIN].pop("holiday_switch_added", None)
    runtime.hass.data[DOMAIN].pop("master_switches_added", None)
    runtime.hass.data[DOMAIN].pop("master_switch_entities", None)
    added_batches.clear()
    await async_setup_entry(runtime.hass, runtime.entry, _capture)
    reloaded = [
        e for batch in added_batches for e in batch if isinstance(e, ConXSchedulerTaskSwitch)
    ]
    assert reloaded == []
    # Deleted unique_id must not remain in the registry to be restored unavailable.
    assert (
        runtime.hass.entity_registry.async_get_entity_id(
            "switch", DOMAIN, f"{runtime.entry.entry_id}_scheduler_evening"
        )
        is None
    )
