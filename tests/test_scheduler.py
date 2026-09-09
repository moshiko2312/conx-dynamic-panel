"""Tests for the internal profile scheduler engine."""

from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

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
from custom_components.conx_dynamic_panel.scheduler import (
    find_schedule_conflicts,
    parse_hhmm,
    resolve_desired_profile_id,
    validate_tasks_no_conflicts,
)
from custom_components.conx_dynamic_panel.storage import _migrate
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker


def test_parse_hhmm() -> None:
    assert parse_hhmm("08:00") == 8 * 60
    assert parse_hhmm("23:59") == 23 * 60 + 59
    with pytest.raises(ValueError):
        parse_hhmm("25:00")
    with pytest.raises(ValueError):
        parse_hhmm("bad")


def test_no_conflict_different_start_times() -> None:
    """Two ranges with different start times never conflict — no more duration overlap."""
    tasks = [
        SchedulerTask(
            id="morning",
            name="Morning",
            enabled=True,
            weekdays=[0, 1, 2, 3, 4],
            months=list(range(1, 13)),
            ranges=[ScheduleRange("08:00", "lighting")],
        ),
        SchedulerTask(
            id="evening",
            name="Evening",
            enabled=True,
            weekdays=[0, 1, 2, 3, 4],
            months=list(range(1, 13)),
            ranges=[ScheduleRange("12:00", "scenes")],
        ),
    ]
    assert find_schedule_conflicts(tasks) == []


def test_same_start_time_different_profile_conflicts() -> None:
    tasks = [
        SchedulerTask(id="a", name="A", ranges=[ScheduleRange("08:00", "lighting")]),
        SchedulerTask(id="b", name="B", ranges=[ScheduleRange("08:00", "scenes")]),
    ]
    conflicts = find_schedule_conflicts(tasks)
    assert len(conflicts) == 1
    with pytest.raises(ValueError, match="Conflict"):
        validate_tasks_no_conflicts(tasks)


def test_same_profile_same_start_allowed() -> None:
    """Same start + same profile is redundant, not conflicting."""
    tasks = [
        SchedulerTask(id="a", name="A", ranges=[ScheduleRange("08:00", "lighting")]),
        SchedulerTask(id="b", name="B", ranges=[ScheduleRange("08:00", "lighting")]),
    ]
    assert find_schedule_conflicts(tasks) == []


def test_no_conflict_when_weekdays_disjoint() -> None:
    tasks = [
        SchedulerTask(
            id="a", name="A", weekdays=[0], ranges=[ScheduleRange("08:00", "lighting")]
        ),
        SchedulerTask(
            id="b", name="B", weekdays=[1], ranges=[ScheduleRange("08:00", "scenes")]
        ),
    ]
    assert find_schedule_conflicts(tasks) == []


def test_no_conflict_when_months_disjoint() -> None:
    tasks = [
        SchedulerTask(id="a", name="A", months=[1], ranges=[ScheduleRange("08:00", "lighting")]),
        SchedulerTask(id="b", name="B", months=[2], ranges=[ScheduleRange("08:00", "scenes")]),
    ]
    assert find_schedule_conflicts(tasks) == []


def test_conditions_do_not_remove_static_conflicts() -> None:
    from custom_components.conx_dynamic_panel.models import ScheduleCondition

    tasks = [
        SchedulerTask(
            id="a",
            name="A",
            ranges=[ScheduleRange("08:00", "lighting")],
            conditions=[ScheduleCondition("binary_sensor.a", "eq", "on")],
        ),
        SchedulerTask(
            id="b",
            name="B",
            ranges=[ScheduleRange("08:00", "scenes")],
            conditions=[ScheduleCondition("binary_sensor.b", "eq", "off")],
        ),
    ]
    assert len(find_schedule_conflicts(tasks)) == 1


def test_resolve_desired_stays_active_until_next_trigger_same_day() -> None:
    """Before the first trigger fires, fall back to default; after, hold the profile."""
    tasks = [
        SchedulerTask(
            id="day",
            name="Day",
            weekdays=list(range(7)),
            months=list(range(1, 13)),
            ranges=[ScheduleRange("08:00", "scenes")],
        )
    ]
    known = {"lighting", "scenes"}
    # Before 08:00 on the very first day the task could ever have fired (no
    # prior-day trigger reachable within the lookback because none exists yet
    # in this closed test universe) → default.
    assert (
        resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 2, 7, 0),
            known_profiles=known,
            lookback_days=0,
        )
        == "lighting"
    )
    # At/after 08:00 → the trigger has fired, scenes is active.
    assert (
        resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 2, 8, 0),
            known_profiles=known,
        )
        == "scenes"
    )
    # Still active well after 08:00 — no "end" to expire it.
    assert (
        resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 2, 20, 0),
            known_profiles=known,
        )
        == "scenes"
    )


def test_resolve_desired_persists_across_midnight_until_next_trigger() -> None:
    """A trigger fired yesterday keeps its profile active into the next day
    until a later trigger (today) supersedes it — the "keep support for
    multiple ranges, active until the next trigger" model."""
    tasks = [
        SchedulerTask(
            id="day",
            name="Day",
            weekdays=list(range(7)),
            months=list(range(1, 13)),
            ranges=[
                ScheduleRange("08:00", "scenes"),
                ScheduleRange("17:00", "lighting"),
            ],
        )
    ]
    known = {"lighting", "scenes"}
    # Tuesday 03:00 — yesterday's (Monday) 17:00 trigger is still the most
    # recent one; today's 08:00 hasn't fired yet.
    assert (
        resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 3, 3, 0),
            known_profiles=known,
        )
        == "lighting"
    )
    # Tuesday 09:00 — today's 08:00 trigger superseded yesterday's 17:00.
    assert (
        resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 3, 9, 0),
            known_profiles=known,
        )
        == "scenes"
    )


def test_resolve_desired_multiple_ranges_recency_wins_within_day() -> None:
    tasks = [
        SchedulerTask(
            id="day",
            name="Day",
            weekdays=list(range(7)),
            months=list(range(1, 13)),
            ranges=[
                ScheduleRange("08:00", "scenes"),
                ScheduleRange("17:00", "lighting"),
            ],
        )
    ]
    known = {"lighting", "scenes"}
    assert (
        resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 2, 12, 0),
            known_profiles=known,
        )
        == "scenes"
    )
    assert (
        resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 2, 17, 0),
            known_profiles=known,
        )
        == "lighting"
    )


def test_resolve_desired_beyond_lookback_uses_default() -> None:
    tasks = [
        SchedulerTask(
            id="day",
            name="Day",
            weekdays=list(range(7)),
            months=list(range(1, 13)),
            ranges=[ScheduleRange("08:00", "scenes")],
        )
    ]
    assert (
        resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 2, 12, 0),
            known_profiles={"lighting", "scenes"},
            lookback_days=0,
        )
        == "scenes"
    )
    # Before the trigger's first same-day firing, with lookback disabled
    # entirely there is nothing to find → default.
    assert (
        resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 2, 7, 0),
            known_profiles={"lighting", "scenes"},
            lookback_days=0,
        )
        == "lighting"
    )


def test_holiday_suppresses_scheduler() -> None:
    tasks = [
        SchedulerTask(id="day", name="Day", ranges=[ScheduleRange("00:00", "scenes")])
    ]
    assert (
        resolve_desired_profile_id(
            holiday_mode=True,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 2, 12, 0),
            known_profiles={"lighting", "scenes"},
        )
        is None
    )


def test_disabled_task_ignored() -> None:
    tasks = [
        SchedulerTask(
            id="day", name="Day", enabled=False, ranges=[ScheduleRange("00:00", "scenes")]
        )
    ]
    assert (
        resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 2, 12, 0),
            known_profiles={"lighting", "scenes"},
        )
        == "lighting"
    )


def test_storage_migration_to_v3_preserves_profiles() -> None:
    migrated = _migrate(
        {
            "schema_version": 2,
            "active_profile_id": "lighting",
            "profiles": {
                "lighting": {"id": "lighting", "name": "Lighting"},
                "scenes": {"id": "scenes", "name": "Scenes"},
            },
            "applied_snapshot": {"id": "lighting", "name": "Lighting"},
        }
    )
    assert migrated["schema_version"] == 5
    assert migrated["default_profile_id"] == "lighting"
    assert migrated["scheduler_tasks"] == {}
    assert migrated["holiday_mode"] is False
    assert "lighting" in migrated["profiles"]
    assert migrated["applied_snapshot"]["id"] == "lighting"


def test_storage_migration_to_v4_adds_conditions_scope() -> None:
    """Legacy ranges (with a now-dropped ``end`` key) survive the raw dict migration untouched."""
    migrated = _migrate(
        {
            "schema_version": 3,
            "active_profile_id": "lighting",
            "default_profile_id": "lighting",
            "profiles": {"lighting": {"id": "lighting", "name": "Lighting"}},
            "scheduler_tasks": {
                "day": {
                    "id": "day",
                    "name": "Day",
                    "enabled": True,
                    "weekdays": list(range(7)),
                    "months": list(range(1, 13)),
                    "ranges": [{"start": "08:00", "end": "17:00", "profile_id": "lighting"}],
                }
            },
            "applied_snapshot": {"id": "lighting", "name": "Lighting"},
        }
    )
    assert migrated["schema_version"] == 5
    assert migrated["holiday_mode"] is False
    task = migrated["scheduler_tasks"]["day"]
    assert task["scope"] == "local"
    assert task["entry_ids"] == []
    assert task["conditions"] == []
    assert migrated["applied_snapshot"]["id"] == "lighting"


def test_panel_storage_roundtrip_scheduler() -> None:
    data = PanelStorageData()
    data.ensure_defaults()
    data.default_profile_id = "scenes"
    data.scheduler_tasks["morning"] = SchedulerTask(
        id="morning",
        name="Morning",
        ranges=[ScheduleRange("06:00", "lighting")],
        notes="wake",
    )
    restored = PanelStorageData.from_dict(data.to_dict())
    assert restored.default_profile_id == "scenes"
    assert restored.holiday_mode is False
    assert restored.scheduler_tasks["morning"].ranges[0].start == "06:00"
    assert restored.scheduler_tasks["morning"].notes == "wake"


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
    def __init__(self) -> None:
        self.apply_calls: list[Profile] = []
        self.apply_result = SyncResult(success=True, confirmed_steps=["names"])

    async def async_apply_profile(self, profile: Profile) -> SyncResult:
        self.apply_calls.append(profile)
        return self.apply_result

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


def _runtime(adapter: FakeAdapter, store: FakeStore, *, holiday: bool = False) -> Any:
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
    holiday_store = SimpleNamespace(holiday_mode=holiday, master_holiday=holiday)

    async def _noop(*_a: Any, **_k: Any) -> None:
        return None

    hass = SimpleNamespace(
        services=SimpleNamespace(has_service=lambda *_a, **_k: True, async_call=AsyncMock()),
        states=SimpleNamespace(get=lambda *_a, **_k: None),
        bus=SimpleNamespace(async_fire=_noop),
        data={"conx_dynamic_panel": {"holiday_store": holiday_store}},
        async_create_task=lambda coro: coro.close() if hasattr(coro, "close") else None,
        loop=SimpleNamespace(call_later=lambda *_a, **_k: None),
    )
    entry = SimpleNamespace(entry_id="entry-1", options={}, data={})
    return SimpleNamespace(
        hass=hass,
        entry=entry,
        mapping=mapping,
        store=store,
        adapter=adapter,
        suppression=SuppressionTracker(),
        sync_lock=__import__("asyncio").Lock(),
        cover=CoverRuntime(),
        momentary=MomentaryRuntime(),
        multiclick=MultiClickRuntime(),
        unloading=False,
        listeners=[],
        update_callbacks=[],
        auto_sync=False,
        confirm_timeout=5.0,
        sync_timeout=30.0,
        async_add_listener=lambda cb: (lambda: None),
        async_notify=lambda: None,
    )


@pytest.mark.asyncio
async def test_scheduler_tick_activates_with_sync(monkeypatch: pytest.MonkeyPatch) -> None:
    store = FakeStore()
    store.data.applied_snapshot = store.data.profiles["lighting"].to_dict()
    store.data.default_profile_id = "lighting"
    store.data.scheduler_tasks["day"] = SchedulerTask(
        id="day",
        name="Day",
        weekdays=list(range(7)),
        months=list(range(1, 13)),
        ranges=[ScheduleRange("00:00", "scenes")],
    )
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)

    fixed = datetime(2026, 3, 2, 12, 0)

    class _DT:
        @staticmethod
        def now():
            return fixed

    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.dt_util",
        _DT,
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_track_point_in_time",
        lambda *_a, **_k: (lambda: None),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_get_holiday_store",
        AsyncMock(return_value=runtime.hass.data["conx_dynamic_panel"]["holiday_store"]),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.master_holiday_enabled",
        lambda _hass: False,
    )

    await coordinator.async_scheduler_tick(reason="setup")
    assert store.data.active_profile_id == "scenes"
    assert adapter.apply_calls
    assert adapter.apply_calls[-1].id == "scenes"


@pytest.mark.asyncio
async def test_scheduler_tick_holiday_restores_snapshot(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeStore()
    lighting = store.data.profiles["lighting"]
    store.data.applied_snapshot = lighting.to_dict()
    store.data.active_profile_id = "lighting"
    store.data.scheduler_tasks["day"] = SchedulerTask(
        id="day",
        name="Day",
        ranges=[ScheduleRange("00:00", "scenes")],
    )
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store, holiday=True)
    coordinator = PanelCoordinator(runtime)

    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_track_point_in_time",
        lambda *_a, **_k: (lambda: None),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.master_holiday_enabled",
        lambda _hass: True,
    )

    await coordinator.async_scheduler_tick(reason="setup")
    assert store.data.active_profile_id == "lighting"
    assert adapter.apply_calls
    assert adapter.apply_calls[-1].id == "lighting"


@pytest.mark.asyncio
async def test_upsert_task_blocks_conflicts() -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)
    await coordinator.async_upsert_scheduler_task(
        {
            "id": "a",
            "name": "A",
            "enabled": True,
            "weekdays": list(range(7)),
            "months": list(range(1, 13)),
            "ranges": [{"start": "08:00", "profile_id": "lighting"}],
        }
    )
    with pytest.raises(ValueError, match="Conflict"):
        await coordinator.async_upsert_scheduler_task(
            {
                "id": "b",
                "name": "B",
                "enabled": True,
                "weekdays": list(range(7)),
                "months": list(range(1, 13)),
                "ranges": [{"start": "08:00", "profile_id": "scenes"}],
            }
        )
    assert "b" not in store.data.scheduler_tasks


def test_condition_pass_fail_and_missing_entity() -> None:
    from custom_components.conx_dynamic_panel.models import ScheduleCondition
    from custom_components.conx_dynamic_panel.scheduler import (
        evaluate_condition_state,
        resolve_desired_profile_id,
    )

    cond = ScheduleCondition(entity_id="binary_sensor.gate", operator="eq", value="on")
    assert evaluate_condition_state(SimpleNamespace(state="on"), cond) is True
    assert evaluate_condition_state(SimpleNamespace(state="off"), cond) is False
    assert evaluate_condition_state(None, cond) is False
    assert evaluate_condition_state(SimpleNamespace(state="unavailable"), cond) is False
    assert (
        evaluate_condition_state(
            SimpleNamespace(state="21.5"),
            ScheduleCondition("sensor.t", "gte", "20"),
        )
        is True
    )
    assert (
        evaluate_condition_state(
            SimpleNamespace(state="warm"),
            ScheduleCondition("sensor.t", "gt", "20"),
        )
        is False
    )

    task = SchedulerTask(
        id="day",
        name="Day",
        weekdays=list(range(7)),
        months=list(range(1, 13)),
        ranges=[ScheduleRange("00:00", "scenes")],
        conditions=[cond],
    )
    when = datetime(2026, 3, 2, 12, 0)
    known = {"lighting", "scenes"}
    assert (
        resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=[task],
            when=when,
            known_profiles=known,
            conditions_ok=lambda _t: False,
        )
        == "lighting"
    )
    assert (
        resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=[task],
            when=when,
            known_profiles=known,
            conditions_ok=lambda _t: True,
        )
        == "scenes"
    )


def test_find_next_scheduler_change_edges_and_hide() -> None:
    from custom_components.conx_dynamic_panel.scheduler import find_next_scheduler_change

    tasks = [
        SchedulerTask(
            id="day",
            name="Day",
            weekdays=list(range(7)),
            months=list(range(1, 13)),
            ranges=[ScheduleRange("08:00", "scenes")],
        )
    ]
    names = {"lighting": "Lighting", "scenes": "Scenes"}
    # Before today's trigger → next resolvable edge is today's 08:00.
    before = find_next_scheduler_change(
        holiday_mode=False,
        default_profile_id="lighting",
        tasks=tasks,
        when=datetime(2026, 3, 2, 7, 0),
        known_profiles=names,
    )
    assert before is not None
    assert before.profile_id == "scenes"
    assert before.to_dict()["at_time"] == "08:00"
    assert before.to_dict()["profile_name"] == "Scenes"
    # After today's trigger, with no other range to change to, the next edge
    # is tomorrow's repeat of the same trigger (no identity change anywhere,
    # so Pass 2 — "next resolvable range start" — returns it).
    inside = find_next_scheduler_change(
        holiday_mode=False,
        default_profile_id="lighting",
        tasks=tasks,
        when=datetime(2026, 3, 2, 12, 0),
        known_profiles=names,
    )
    assert inside is not None
    assert inside.profile_id == "scenes"
    assert inside.to_dict()["at_time"] == "08:00"
    assert inside.at.date() == datetime(2026, 3, 3).date()
    # Holiday / no tasks → None (footer hidden)
    assert (
        find_next_scheduler_change(
            holiday_mode=True,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 2, 7, 0),
            known_profiles=names,
        )
        is None
    )
    assert (
        find_next_scheduler_change(
            holiday_mode=False,
            default_profile_id="lighting",
            tasks=[],
            when=datetime(2026, 3, 2, 7, 0),
            known_profiles=names,
        )
        is None
    )


def test_find_next_real_identity_change_same_day() -> None:
    """Two triggers in one task: the later one is a genuine profile change (Pass 1)."""
    from custom_components.conx_dynamic_panel.scheduler import find_next_scheduler_change

    tasks = [
        SchedulerTask(
            id="day",
            name="Day",
            weekdays=list(range(7)),
            months=list(range(1, 13)),
            ranges=[
                ScheduleRange("08:00", "scenes"),
                ScheduleRange("17:00", "lighting"),
            ],
        )
    ]
    names = {"lighting": "Lighting", "scenes": "Scenes"}
    nxt = find_next_scheduler_change(
        holiday_mode=False,
        default_profile_id="lighting",
        tasks=tasks,
        when=datetime(2026, 3, 2, 12, 0),
        known_profiles=names,
    )
    assert nxt is not None
    assert nxt.profile_id == "lighting"
    assert nxt.to_dict()["at_time"] == "17:00"
    assert nxt.at.date() == datetime(2026, 3, 2).date()


def test_find_next_same_profile_as_default_still_returns_range_start() -> None:
    """Root cause of missing footer: range profile == default → still show the range start."""
    from custom_components.conx_dynamic_panel.scheduler import find_next_scheduler_change

    tasks = [
        SchedulerTask(
            id="day",
            name="Day",
            weekdays=list(range(7)),
            months=list(range(1, 13)),
            ranges=[ScheduleRange("08:00", "lighting")],
        )
    ]
    names = {"lighting": "Lighting", "scenes": "Scenes"}
    before = find_next_scheduler_change(
        holiday_mode=False,
        default_profile_id="lighting",
        tasks=tasks,
        when=datetime(2026, 3, 2, 7, 0),
        known_profiles=names,
    )
    assert before is not None
    assert before.profile_id == "lighting"
    assert before.to_dict()["at_time"] == "08:00"


def test_find_next_weekend_only_from_monday_within_14_days() -> None:
    from custom_components.conx_dynamic_panel.scheduler import find_next_scheduler_change

    # Monday 2026-03-02 → next Saturday is day_offset 5
    tasks = [
        SchedulerTask(
            id="weekend",
            name="Weekend",
            weekdays=[5, 6],
            months=list(range(1, 13)),
            ranges=[ScheduleRange("10:00", "scenes")],
        )
    ]
    names = {"lighting": "Lighting", "scenes": "Scenes"}
    nxt = find_next_scheduler_change(
        holiday_mode=False,
        default_profile_id="lighting",
        tasks=tasks,
        when=datetime(2026, 3, 2, 12, 0),
        known_profiles=names,
        days_ahead=14,
    )
    assert nxt is not None
    assert nxt.profile_id == "scenes"
    assert nxt.at.weekday() == 5
    assert nxt.to_dict()["at_time"] == "10:00"


@pytest.mark.asyncio
async def test_panel_holiday_suspends_only_that_entry(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeStore()
    store.data.scheduler_tasks["day"] = SchedulerTask(
        id="day",
        name="Day",
        ranges=[ScheduleRange("00:00", "scenes")],
    )
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store, holiday=False)
    coordinator = PanelCoordinator(runtime)
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_track_point_in_time",
        lambda *_a, **_k: (lambda: None),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_get_holiday_store",
        AsyncMock(return_value=runtime.hass.data["conx_dynamic_panel"]["holiday_store"]),
    )

    await coordinator.async_set_holiday_mode(True, scope="panel")
    assert store.data.holiday_mode is True
    assert coordinator.effective_holiday_mode() is True
    fields = coordinator.holiday_fields()
    assert fields["holiday_mode"] is True
    assert fields["panel_holiday_mode"] is True
    assert fields["master_holiday_mode"] is False
    payload = coordinator._scheduler_next_payload()
    assert payload["scheduler_active"] is False
    assert payload["scheduler_next"] is None

    await coordinator.async_set_holiday_mode(False, scope="panel")
    assert store.data.holiday_mode is False
    assert coordinator.effective_holiday_mode() is False


@pytest.mark.asyncio
async def test_master_holiday_forces_all_panels(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store, holiday=False)
    coordinator = PanelCoordinator(runtime)
    holiday_store = runtime.hass.data["conx_dynamic_panel"]["holiday_store"]

    async def _set(enabled: bool) -> bool:
        holiday_store.master_holiday = bool(enabled)
        holiday_store.holiday_mode = bool(enabled)
        return holiday_store.master_holiday

    holiday_store.async_set = _set  # type: ignore[attr-defined]

    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_track_point_in_time",
        lambda *_a, **_k: (lambda: None),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_get_holiday_store",
        AsyncMock(return_value=holiday_store),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.master_holiday_enabled",
        lambda _hass: bool(holiday_store.master_holiday),
    )
    # Panel local holiday stays off; master forces effective ON.
    store.data.holiday_mode = False
    await coordinator.async_set_holiday_mode(True, scope="master")
    assert holiday_store.master_holiday is True
    assert store.data.holiday_mode is False
    assert coordinator.effective_holiday_mode() is True
    fields = coordinator.holiday_fields()
    assert fields["master_holiday_mode"] is True
    assert fields["panel_holiday_mode"] is False
    assert fields["holiday_mode"] is True


def test_holiday_still_wins_over_passing_conditions() -> None:
    from custom_components.conx_dynamic_panel.models import ScheduleCondition

    tasks = [
        SchedulerTask(
            id="day",
            name="Day",
            ranges=[ScheduleRange("00:00", "scenes")],
            conditions=[ScheduleCondition("binary_sensor.gate", "eq", "on")],
        )
    ]
    assert (
        resolve_desired_profile_id(
            holiday_mode=True,
            default_profile_id="lighting",
            tasks=tasks,
            when=datetime(2026, 3, 2, 12, 0),
            known_profiles={"lighting", "scenes"},
            conditions_ok=lambda _t: True,
        )
        is None
    )


@pytest.mark.asyncio
async def test_master_task_applies_to_multiple_entries(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from custom_components.conx_dynamic_panel.master_store import MasterSchedulerStore

    store_a = FakeStore()
    store_b = FakeStore()
    store_a.data.default_profile_id = "lighting"
    store_b.data.default_profile_id = "lighting"
    adapter_a = FakeAdapter()
    adapter_b = FakeAdapter()
    runtime_a = _runtime(adapter_a, store_a)
    runtime_b = _runtime(adapter_b, store_b)
    # Share one hass before constructing coordinators (they capture hass at init).
    runtime_b.hass = runtime_a.hass
    runtime_b.entry = SimpleNamespace(entry_id="entry-2", options={}, data={})
    runtime_b.mapping = EntityMapping(
        panel_name="Hall",
        adapter_type="zemismart_4gang",
        relay_entities=("switch.h1", "switch.h2", "switch.h3", "switch.h4"),
        name_entities=("text.h1", "text.h2", "text.h3", "text.h4"),
        color_off_entity="select.off2",
        color_on_entity="select.on2",
        radar_entity="select.radar2",
        backlight_entity="switch.backlight2",
        child_lock_entity="switch.lock2",
    )
    coord_a = PanelCoordinator(runtime_a)
    coord_b = PanelCoordinator(runtime_b)

    master = MasterSchedulerStore(runtime_a.hass)
    runtime_a.hass.data["conx_dynamic_panel"]["master_store"] = master
    runtime_a.hass.data["conx_dynamic_panel"]["entry-1"] = {"coordinator": coord_a}
    runtime_a.hass.data["conx_dynamic_panel"]["entry-2"] = {"coordinator": coord_b}
    fixed = datetime(2026, 3, 2, 12, 0)

    class _DT:
        @staticmethod
        def now():
            return fixed

    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.dt_util",
        _DT,
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_track_point_in_time",
        lambda *_a, **_k: (lambda: None),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.async_get_master_store",
        AsyncMock(return_value=master),
    )
    monkeypatch.setattr(
        "custom_components.conx_dynamic_panel.coordinator.master_holiday_enabled",
        lambda _hass: False,
    )

    await coord_a.async_upsert_scheduler_task(
        {
            "id": "master_day",
            "name": "Master day",
            "scope": "master",
            "entry_ids": ["entry-1", "entry-2"],
            "enabled": True,
            "weekdays": list(range(7)),
            "months": list(range(1, 13)),
            "ranges": [{"start": "00:00", "profile_id": "scenes"}],
        }
    )
    assert "master_day" in master.tasks
    assert store_a.data.active_profile_id == "scenes"
    assert store_b.data.active_profile_id == "scenes"
    # Disabling a local task on A does not remove master effect
    store_a.data.scheduler_tasks["local_off"] = SchedulerTask(
        id="local_off",
        name="Local",
        enabled=False,
        ranges=[ScheduleRange("00:00", "lighting")],
    )
    await coord_a.async_scheduler_tick(reason="test")
    assert store_a.data.active_profile_id == "scenes"


@pytest.mark.asyncio
async def test_master_conflicts_with_local() -> None:
    from custom_components.conx_dynamic_panel.master_store import MasterSchedulerStore

    store = FakeStore()
    adapter = FakeAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)
    master = MasterSchedulerStore(runtime.hass)
    runtime.hass.data["conx_dynamic_panel"]["master_store"] = master
    runtime.hass.data["conx_dynamic_panel"]["entry-1"] = {"coordinator": coordinator}

    await coordinator.async_upsert_scheduler_task(
        {
            "id": "local",
            "name": "Local",
            "enabled": True,
            "weekdays": list(range(7)),
            "months": list(range(1, 13)),
            "ranges": [{"start": "08:00", "profile_id": "lighting"}],
        }
    )
    with pytest.raises(ValueError, match="Conflict"):
        await coordinator.async_upsert_scheduler_task(
            {
                "id": "master_x",
                "name": "Master",
                "scope": "master",
                "entry_ids": ["entry-1"],
                "enabled": True,
                "weekdays": list(range(7)),
                "months": list(range(1, 13)),
                "ranges": [{"start": "08:00", "profile_id": "scenes"}],
            }
        )
    assert "master_x" not in master.tasks
