"""Internal profile scheduler engine (time ranges, conflicts, desired profile).

Weekdays use Python ``datetime.weekday()``: Monday=0 … Sunday=6.
Months are 1–12. Time ranges use ``HH:MM``. When ``start > end``, the range
crosses midnight (e.g. 22:00–06:00). Coverage is half-open at minute
resolution: start inclusive, end exclusive (so 08:00–12:00 is active through
11:59; at 12:00 the next range may begin). Adjacent ranges that share a
boundary therefore do not conflict.

Entity conditions are evaluated at runtime only. Static conflict detection still
blocks overlapping timeline ranges regardless of conditions.
"""

from __future__ import annotations

from collections.abc import Callable, Iterable
from dataclasses import dataclass
from datetime import datetime, time, timedelta
from typing import Any

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant

from .const import (
    CONDITION_NUMERIC_OPS,
    CONDITION_OP_EQ,
    CONDITION_OP_GT,
    CONDITION_OP_GTE,
    CONDITION_OP_LT,
    CONDITION_OP_LTE,
    CONDITION_OP_NEQ,
)
from .models import ScheduleCondition, ScheduleRange, SchedulerTask

WEEKDAY_COUNT = 7
MONTH_COUNT = 12
MINUTES_PER_DAY = 24 * 60

ConditionChecker = Callable[[SchedulerTask], bool]


def parse_hhmm(value: Any) -> int:
    """Parse ``HH:MM`` into minutes since midnight (0–1439)."""
    text = str(value or "").strip()
    if len(text) != 5 or text[2] != ":":
        raise ValueError(f"Invalid time '{value}'; expected HH:MM")
    hour_s, minute_s = text.split(":", 1)
    try:
        hour = int(hour_s)
        minute = int(minute_s)
    except ValueError as err:
        raise ValueError(f"Invalid time '{value}'; expected HH:MM") from err
    if hour < 0 or hour > 23 or minute < 0 or minute > 59:
        raise ValueError(f"Invalid time '{value}'; expected HH:MM")
    return hour * 60 + minute


def format_hhmm(minutes: int) -> str:
    """Format minutes since midnight as ``HH:MM``."""
    minutes = int(minutes) % MINUTES_PER_DAY
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def minutes_covered(start_minutes: int, end_minutes: int) -> set[int]:
    """Return clock minutes covered by a range (start inclusive, end exclusive).

    When ``start == end``, the range covers that single minute (degenerate).
    When ``start > end``, the range crosses midnight and still excludes ``end``.
    """
    start = int(start_minutes) % MINUTES_PER_DAY
    end = int(end_minutes) % MINUTES_PER_DAY
    if start == end:
        return {start}
    if start < end:
        return set(range(start, end))
    return set(range(start, MINUTES_PER_DAY)) | set(range(0, end))


def time_to_minutes(value: time) -> int:
    """Convert a ``datetime.time`` to minutes since midnight."""
    return value.hour * 60 + value.minute


def time_in_range(now_minutes: int, start: str, end: str) -> bool:
    """Return whether ``now_minutes`` is in ``[start, end)`` (overnight OK)."""
    return now_minutes in minutes_covered(parse_hhmm(start), parse_hhmm(end))


def normalize_weekdays(values: Any) -> list[int]:
    """Normalize weekdays to sorted unique Monday=0…Sunday=6."""
    if values is None:
        return list(range(WEEKDAY_COUNT))
    if not isinstance(values, (list, tuple, set)):
        raise ValueError("weekdays must be a list")
    out: set[int] = set()
    for item in values:
        day = int(item)
        if day < 0 or day > 6:
            raise ValueError(f"Invalid weekday {day}; expected 0–6 (Mon–Sun)")
        out.add(day)
    return sorted(out)


def normalize_months(values: Any) -> list[int]:
    """Normalize months to sorted unique 1–12."""
    if values is None:
        return list(range(1, MONTH_COUNT + 1))
    if not isinstance(values, (list, tuple, set)):
        raise ValueError("months must be a list")
    out: set[int] = set()
    for item in values:
        month = int(item)
        if month < 1 or month > 12:
            raise ValueError(f"Invalid month {month}; expected 1–12")
        out.add(month)
    return sorted(out)


def task_matches_date(task: SchedulerTask, when: datetime) -> bool:
    """Return whether the task's day/month filters include ``when``."""
    if when.weekday() not in task.weekdays:
        return False
    return when.month in task.months


def _try_float(value: str) -> float | None:
    text = str(value).strip()
    try:
        return float(text)
    except ValueError:
        return None


def evaluate_condition_state(state: Any | None, condition: ScheduleCondition) -> bool:
    """Return whether a single condition passes given an HA state object."""
    if state is None:
        return False
    actual_raw = getattr(state, "state", None)
    if actual_raw is None or actual_raw in {STATE_UNKNOWN, STATE_UNAVAILABLE}:
        return False
    actual = str(actual_raw)
    expected = str(condition.value)
    op = condition.operator
    if op == CONDITION_OP_EQ:
        return actual == expected
    if op == CONDITION_OP_NEQ:
        return actual != expected
    if op in CONDITION_NUMERIC_OPS:
        left = _try_float(actual)
        right = _try_float(expected)
        if left is None or right is None:
            return False
        if op == CONDITION_OP_GT:
            return left > right
        if op == CONDITION_OP_LT:
            return left < right
        if op == CONDITION_OP_GTE:
            return left >= right
        if op == CONDITION_OP_LTE:
            return left <= right
    return False


def evaluate_condition(hass: HomeAssistant, condition: ScheduleCondition) -> bool:
    """Evaluate one structured condition against live HA state."""
    return evaluate_condition_state(hass.states.get(condition.entity_id), condition)


def task_conditions_pass(hass: HomeAssistant, task: SchedulerTask) -> bool:
    """Return True when the task has no conditions or all conditions pass."""
    if not task.conditions:
        return True
    return all(evaluate_condition(hass, condition) for condition in task.conditions)


def condition_entity_ids(tasks: Iterable[SchedulerTask]) -> list[str]:
    """Unique entity IDs referenced by task conditions."""
    ids: set[str] = set()
    for task in tasks:
        for condition in task.conditions:
            if condition.entity_id:
                ids.add(condition.entity_id)
    return sorted(ids)


@dataclass(frozen=True, slots=True)
class ActiveRangeHit:
    """One timeline range active at a moment."""

    task_id: str
    task_name: str
    start: str
    end: str
    profile_id: str


def active_range_hits(
    tasks: Iterable[SchedulerTask],
    when: datetime,
    *,
    conditions_ok: ConditionChecker | None = None,
) -> list[ActiveRangeHit]:
    """Return all enabled task ranges covering ``when``.

    When ``conditions_ok`` is provided, tasks that fail conditions are skipped
    (treated as inactive for this evaluation).
    """
    now_minutes = time_to_minutes(when.time())
    hits: list[ActiveRangeHit] = []
    for task in tasks:
        if not task.enabled:
            continue
        if conditions_ok is not None and not conditions_ok(task):
            continue
        if not task_matches_date(task, when):
            continue
        for rng in task.ranges:
            if time_in_range(now_minutes, rng.start, rng.end):
                hits.append(
                    ActiveRangeHit(
                        task_id=task.id,
                        task_name=task.name,
                        start=rng.start,
                        end=rng.end,
                        profile_id=rng.profile_id,
                    )
                )
    return hits


def resolve_desired_profile_id(
    *,
    holiday_mode: bool,
    default_profile_id: str | None,
    tasks: Iterable[SchedulerTask],
    when: datetime,
    known_profiles: set[str] | frozenset[str],
    conditions_ok: ConditionChecker | None = None,
) -> str | None:
    """Return the profile the scheduler wants active now, or None to suppress.

    Holiday mode suppresses all scheduler activations (returns None).
    When a covering range exists, its profile wins (stable order by task id then
    start). Outside all ranges, the panel default profile is used when present.
    Failed entity conditions make a task inactive for this evaluation only;
    they do not affect static conflict detection.
    """
    if holiday_mode:
        return None
    hits = active_range_hits(tasks, when, conditions_ok=conditions_ok)
    if hits:
        hits_sorted = sorted(hits, key=lambda h: (h.task_id, h.start, h.profile_id))
        for hit in hits_sorted:
            if hit.profile_id in known_profiles:
                return hit.profile_id
        return None
    if default_profile_id and default_profile_id in known_profiles:
        return default_profile_id
    return None


@dataclass(frozen=True, slots=True)
class ScheduleConflict:
    """Two ranges that would activate different profiles at an overlapping time."""

    task_a_id: str
    task_a_name: str
    range_a: ScheduleRange
    task_b_id: str
    task_b_name: str
    range_b: ScheduleRange
    weekdays: tuple[int, ...]
    months: tuple[int, ...]

    def to_dict(self) -> dict[str, Any]:
        """Serialize for WebSocket / UI dialogs."""
        return {
            "task_a_id": self.task_a_id,
            "task_a_name": self.task_a_name,
            "range_a": self.range_a.to_dict(),
            "task_b_id": self.task_b_id,
            "task_b_name": self.task_b_name,
            "range_b": self.range_b.to_dict(),
            "weekdays": list(self.weekdays),
            "months": list(self.months),
            "message": (
                f"Conflict: '{self.task_a_name}' ({self.range_a.start}–{self.range_a.end} → "
                f"{self.range_a.profile_id}) overlaps '{self.task_b_name}' "
                f"({self.range_b.start}–{self.range_b.end} → {self.range_b.profile_id})"
            ),
        }


def _ranges_overlap_clock(a: ScheduleRange, b: ScheduleRange) -> bool:
    covered_a = minutes_covered(parse_hhmm(a.start), parse_hhmm(a.end))
    covered_b = minutes_covered(parse_hhmm(b.start), parse_hhmm(b.end))
    return bool(covered_a & covered_b)


def find_schedule_conflicts(tasks: Iterable[SchedulerTask]) -> list[ScheduleConflict]:
    """Find enabled ranges that overlap in day/month and clock with different profiles.

    Same-profile overlaps are allowed. Disabled tasks are ignored.
    Conditions are ignored — static time overlaps still conflict (safer).
    """
    enabled = [task for task in tasks if task.enabled]
    conflicts: list[ScheduleConflict] = []
    for index, task_a in enumerate(enabled):
        for task_b in enabled[index:]:
            same_task = task_a.id == task_b.id
            weekdays = sorted(set(task_a.weekdays) & set(task_b.weekdays))
            months = sorted(set(task_a.months) & set(task_b.months))
            if not weekdays or not months:
                continue
            ranges_a = task_a.ranges
            ranges_b = task_b.ranges
            for ra_i, range_a in enumerate(ranges_a):
                start_b = ra_i + 1 if same_task else 0
                for range_b in ranges_b[start_b:]:
                    if range_a.profile_id == range_b.profile_id:
                        continue
                    if not _ranges_overlap_clock(range_a, range_b):
                        continue
                    conflicts.append(
                        ScheduleConflict(
                            task_a_id=task_a.id,
                            task_a_name=task_a.name,
                            range_a=range_a,
                            task_b_id=task_b.id,
                            task_b_name=task_b.name,
                            range_b=range_b,
                            weekdays=tuple(weekdays),
                            months=tuple(months),
                        )
                    )
    return conflicts


def validate_tasks_no_conflicts(tasks: Iterable[SchedulerTask]) -> None:
    """Raise ``ValueError`` with structured conflict payload when conflicts exist."""
    conflicts = find_schedule_conflicts(tasks)
    if not conflicts:
        return
    payload = [conflict.to_dict() for conflict in conflicts]
    error = ValueError(payload[0]["message"])
    error.conflicts = payload  # type: ignore[attr-defined]
    raise error


def next_scheduler_check_at(
    tasks: Iterable[SchedulerTask],
    when: datetime,
) -> datetime:
    """Return the next datetime when scheduler membership may change.

    Candidates are range start/end edges on matching days within the next 8 days,
    falling back to the top of the next minute.
    """
    candidates: list[datetime] = []
    # Always re-evaluate at the next minute boundary as a safety net.
    next_minute = when.replace(second=0, microsecond=0) + timedelta(minutes=1)
    candidates.append(next_minute)

    task_list = [task for task in tasks if task.enabled and task.ranges]
    if not task_list:
        return next_minute

    for day_offset in range(0, 8):
        day = (when + timedelta(days=day_offset)).date()
        probe = datetime.combine(day, time(0, 0), tzinfo=when.tzinfo)
        for task in task_list:
            if probe.weekday() not in task.weekdays:
                continue
            if probe.month not in task.months:
                continue
            for rng in task.ranges:
                start_m = parse_hhmm(rng.start)
                end_m = parse_hhmm(rng.end)
                # End is exclusive: membership changes at the end minute itself.
                for edge in (start_m, end_m):
                    edge_dt = datetime.combine(
                        day,
                        time(edge // 60, edge % 60),
                        tzinfo=when.tzinfo,
                    )
                    if edge_dt <= when:
                        continue
                    candidates.append(edge_dt)
    return min(candidates)


@dataclass(frozen=True, slots=True)
class SchedulerNextEvent:
    """Next scheduled effective-profile change for the faceplate footer."""

    profile_id: str
    profile_name: str
    at: datetime

    def to_dict(self) -> dict[str, Any]:
        """Serialize for get_config / subscribe payloads."""
        return {
            "profile_id": self.profile_id,
            "profile_name": self.profile_name,
            "at": self.at.isoformat(),
            "at_time": format_hhmm(time_to_minutes(self.at.time())),
        }


def scheduler_has_enabled_tasks(tasks: Iterable[SchedulerTask]) -> bool:
    """Return True when at least one enabled task has timeline ranges."""
    return any(task.enabled and task.ranges for task in tasks)


# Faceplate "next" look-ahead: cover a full week-plus so weekday-filtered
# tasks (e.g. weekends only) still surface a footer from mid-week.
DEFAULT_SCHEDULER_LOOKAHEAD_DAYS = 14


def iter_scheduler_edge_datetimes(
    tasks: Iterable[SchedulerTask],
    when: datetime,
    *,
    days_ahead: int = DEFAULT_SCHEDULER_LOOKAHEAD_DAYS,
) -> list[datetime]:
    """Sorted unique range start/end edges strictly after ``when``."""
    edges: set[datetime] = set()
    task_list = [task for task in tasks if task.enabled and task.ranges]
    for day_offset in range(0, max(1, days_ahead)):
        day = (when + timedelta(days=day_offset)).date()
        probe = datetime.combine(day, time(0, 0), tzinfo=when.tzinfo)
        for task in task_list:
            if probe.weekday() not in task.weekdays:
                continue
            if probe.month not in task.months:
                continue
            for rng in task.ranges:
                for edge in (parse_hhmm(rng.start), parse_hhmm(rng.end)):
                    edge_dt = datetime.combine(
                        day,
                        time(edge // 60, edge % 60),
                        tzinfo=when.tzinfo,
                    )
                    if edge_dt > when:
                        edges.add(edge_dt)
    return sorted(edges)


def _edge_is_range_start(tasks: Iterable[SchedulerTask], edge: datetime) -> bool:
    """Return True when ``edge`` matches an enabled range start on that date."""
    edge_minutes = time_to_minutes(edge.time())
    for task in tasks:
        if not task.enabled or not task.ranges:
            continue
        if not task_matches_date(task, edge):
            continue
        for rng in task.ranges:
            if parse_hhmm(rng.start) == edge_minutes:
                return True
    return False


def find_next_scheduler_change(
    *,
    holiday_mode: bool,
    default_profile_id: str | None,
    tasks: Iterable[SchedulerTask],
    when: datetime,
    known_profiles: dict[str, str] | set[str] | frozenset[str],
    conditions_ok: ConditionChecker | None = None,
    days_ahead: int = DEFAULT_SCHEDULER_LOOKAHEAD_DAYS,
) -> SchedulerNextEvent | None:
    """Return the next upcoming scheduled profile event, or None.

    Holiday mode or no enabled tasks → None (faceplate footer hidden).
    Prefers the next edge where the *effective* profile id changes. When the
    range profile matches the default (no identity change), falls back to the
    next range-start edge so the faceplate still shows a scheduled profile +
    time. Uses exclusive-end edges; ``known_profiles`` may be ``{id: name}`` or
    a set of ids.
    """
    if holiday_mode:
        return None
    task_list = list(tasks)
    if not scheduler_has_enabled_tasks(task_list):
        return None

    if isinstance(known_profiles, dict):
        profile_ids: set[str] | frozenset[str] = set(known_profiles)
        names = known_profiles
    else:
        profile_ids = known_profiles
        names = {pid: pid for pid in known_profiles}

    def _desired_at(moment: datetime) -> str | None:
        return resolve_desired_profile_id(
            holiday_mode=False,
            default_profile_id=default_profile_id,
            tasks=task_list,
            when=moment,
            known_profiles=profile_ids,
            conditions_ok=conditions_ok,
        )

    def _event(profile_id: str, at: datetime) -> SchedulerNextEvent:
        return SchedulerNextEvent(
            profile_id=profile_id,
            profile_name=str(names.get(profile_id, profile_id)),
            at=at,
        )

    current = _desired_at(when)
    edges = iter_scheduler_edge_datetimes(task_list, when, days_ahead=days_ahead)

    # Pass 1: true effective-profile change.
    for edge in edges:
        desired = _desired_at(edge)
        if desired is None or desired == current:
            continue
        return _event(desired, edge)

    # Pass 2: next range start (even if profile equals current/default) so a
    # newly saved same-profile task still populates the faceplate footer.
    for edge in edges:
        if not _edge_is_range_start(task_list, edge):
            continue
        desired = _desired_at(edge)
        if desired is None:
            continue
        return _event(desired, edge)

    # Pass 3: any later edge with a resolvable desired profile.
    for edge in edges:
        desired = _desired_at(edge)
        if desired is None:
            continue
        return _event(desired, edge)
    return None
