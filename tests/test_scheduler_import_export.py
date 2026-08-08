"""Tests for scheduler-only export/import."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.const import (
    DOMAIN,
    EXPORT_SCOPE_SCHEDULER,
    SCHEDULER_EXPORT_SCHEMA_VERSION,
    SCHEDULER_SCOPE_MASTER,
)
from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.master_store import MasterSchedulerStore
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


class FakeStore:
    def __init__(self) -> None:
        self.data = PanelStorageData()
        self.data.ensure_defaults()
        self.saved = 0

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
            names=("A", "B", "C", "D"),
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


def _runtime(adapter: FakeAdapter, store: FakeStore, *, entry_id: str = "entry-1") -> Any:
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
    hass = SimpleNamespace(
        services=SimpleNamespace(
            has_service=lambda domain, service: True,
            async_call=AsyncMock(),
        ),
        bus=SimpleNamespace(async_fire=lambda *args, **kwargs: None),
        async_create_task=lambda coro: asyncio.create_task(coro),
        config_entries=SimpleNamespace(async_update_entry=lambda *a, **k: None),
        data={},
        states=SimpleNamespace(get=lambda entity_id: None),
    )
    entry = SimpleNamespace(
        entry_id=entry_id,
        options={"auto_sync": False},
        data={},
        title="Kitchen",
    )
    return SimpleNamespace(
        hass=hass,
        entry=entry,
        mapping=mapping,
        store=store,
        adapter=adapter,
        suppression=SuppressionTracker(),
        sync_lock=asyncio.Lock(),
        cover=CoverRuntime(),
        momentary=MomentaryRuntime(),
        multiclick=MultiClickRuntime(),
        unloading=False,
        listeners=[],
        update_callbacks=[],
        auto_sync=False,
        sync_timeout=30.0,
        confirm_timeout=10.0,
        async_notify=lambda: None,
    )


def _attach_master_store(
    coordinator: PanelCoordinator, monkeypatch: pytest.MonkeyPatch
) -> MasterSchedulerStore:
    store = MasterSchedulerStore(coordinator.hass)
    store.async_save = AsyncMock()  # type: ignore[method-assign]
    domain = coordinator.hass.data.setdefault(DOMAIN, {})
    domain["master_store"] = store
    domain[coordinator.runtime.entry.entry_id] = {"coordinator": coordinator}
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_get_master_store",
        AsyncMock(return_value=store),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.PanelCoordinator._async_tick_entries",
        AsyncMock(),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.master_holiday_enabled",
        lambda _hass: False,
    )
    return store


def _local_task(task_id: str, profile_id: str, start: str) -> SchedulerTask:
    return SchedulerTask(
        id=task_id,
        name=task_id.title(),
        enabled=True,
        weekdays=[0, 1, 2, 3, 4],
        months=list(range(1, 13)),
        ranges=[ScheduleRange(start, profile_id)],
    )


@pytest.mark.asyncio
async def test_export_scheduler_payload(monkeypatch: pytest.MonkeyPatch) -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    master = _attach_master_store(coordinator, monkeypatch)
    store.data.scheduler_tasks["morning"] = _local_task("morning", "lighting", "08:00")
    await master.async_upsert(
        SchedulerTask(
            id="evening_all",
            name="Evening",
            enabled=True,
            weekdays=list(range(7)),
            months=list(range(1, 13)),
            ranges=[ScheduleRange("18:00", "lighting")],
            scope=SCHEDULER_SCOPE_MASTER,
            entry_ids=["entry-1"],
        )
    )
    payload = coordinator.export_scheduler()
    assert payload["schema_version"] == SCHEDULER_EXPORT_SCHEMA_VERSION
    assert payload["scope"] == EXPORT_SCOPE_SCHEDULER
    assert payload["entry_id"] == "entry-1"
    assert payload["default_profile_id"] == store.data.default_profile_id
    assert "morning" in payload["scheduler_tasks"]
    assert "evening_all" in payload["master_scheduler_tasks"]
    assert "holiday" not in payload
    assert "profiles" not in payload


@pytest.mark.asyncio
async def test_import_scheduler_merge_and_replace(monkeypatch: pytest.MonkeyPatch) -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    _attach_master_store(coordinator, monkeypatch)
    store.data.scheduler_tasks["keep"] = _local_task("keep", "lighting", "06:00")

    result = await coordinator.async_import_scheduler(
        {
            "schema_version": 1,
            "scope": "scheduler",
            "default_profile_id": "lighting",
            "scheduler_tasks": {
                "morning": _local_task("morning", "lighting", "08:00").to_dict()
            },
        },
        mode="merge",
    )
    assert "keep" in coordinator.data.scheduler_tasks
    assert "morning" in coordinator.data.scheduler_tasks
    assert result["scheduler_import_warnings"] == []

    await coordinator.async_import_scheduler(
        {
            "schema_version": 1,
            "scope": "scheduler",
            "scheduler_tasks": {
                "only": _local_task("only", "lighting", "09:00").to_dict()
            },
        },
        mode="replace",
    )
    assert set(coordinator.data.scheduler_tasks) == {"only"}


@pytest.mark.asyncio
async def test_import_skips_unknown_profile_with_warning(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    _attach_master_store(coordinator, monkeypatch)
    result = await coordinator.async_import_scheduler(
        {
            "schema_version": 1,
            "scope": "scheduler",
            "scheduler_tasks": {
                "bad": _local_task("bad", "missing_profile", "08:00").to_dict(),
                "good": _local_task("good", "lighting", "10:00").to_dict(),
            },
        },
        mode="merge",
    )
    assert "bad" not in coordinator.data.scheduler_tasks
    assert "good" in coordinator.data.scheduler_tasks
    assert any("missing_profile" in item for item in result["scheduler_import_warnings"])


@pytest.mark.asyncio
async def test_import_rejects_time_conflict(monkeypatch: pytest.MonkeyPatch) -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    _attach_master_store(coordinator, monkeypatch)
    store.data.scheduler_tasks["morning"] = _local_task("morning", "lighting", "08:00")
    with pytest.raises(ValueError, match="Conflict|starts at the same time"):
        await coordinator.async_import_scheduler(
            {
                "schema_version": 1,
                "scope": "scheduler",
                "scheduler_tasks": {
                    "clash": _local_task("clash", "scenes", "08:00").to_dict()
                },
            },
            mode="merge",
        )


@pytest.mark.asyncio
async def test_import_master_merge_includes_current_entry(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    master = _attach_master_store(coordinator, monkeypatch)
    await coordinator.async_import_scheduler(
        {
            "schema_version": 1,
            "scope": "scheduler",
            "master_scheduler_tasks": {
                "shared": {
                    "id": "shared",
                    "name": "Shared",
                    "enabled": True,
                    "weekdays": list(range(7)),
                    "months": list(range(1, 13)),
                    # Legacy "end" key from pre-schema-2 exports must be ignored, not rejected.
                    "ranges": [{"start": "18:00", "end": "22:00", "profile_id": "lighting"}],
                    "scope": "master",
                    "entry_ids": ["other-panel"],
                }
            },
        },
        mode="merge",
    )
    task = master.tasks["shared"]
    assert "entry-1" in task.entry_ids
    assert "other-panel" not in task.entry_ids


@pytest.mark.asyncio
async def test_export_import_roundtrip(monkeypatch: pytest.MonkeyPatch) -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    _attach_master_store(coordinator, monkeypatch)
    store.data.scheduler_tasks["morning"] = _local_task("morning", "lighting", "08:00")
    store.data.default_profile_id = "lighting"
    exported = coordinator.export_scheduler()
    store.data.scheduler_tasks.clear()
    await coordinator.async_import_scheduler(exported, mode="replace")
    again = coordinator.export_scheduler()
    assert set(again["scheduler_tasks"]) == set(exported["scheduler_tasks"])
    assert again["default_profile_id"] == exported["default_profile_id"]


@pytest.mark.asyncio
async def test_import_rejects_future_schema(monkeypatch: pytest.MonkeyPatch) -> None:
    store = FakeStore()
    coordinator = PanelCoordinator(_runtime(FakeAdapter(), store))  # type: ignore[arg-type]
    _attach_master_store(coordinator, monkeypatch)
    with pytest.raises(ValueError, match="Unsupported scheduler export schema_version"):
        await coordinator.async_import_scheduler(
            {"schema_version": 99, "scope": "scheduler", "scheduler_tasks": {}},
            mode="merge",
        )
