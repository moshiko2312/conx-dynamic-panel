"""Orchestration, listeners, sync state, and profile engine."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable, Iterable
from datetime import UTC, datetime
from typing import Any

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event, callback
from homeassistant.helpers.event import (
    async_track_point_in_time,
    async_track_state_change_event,
)
from homeassistant.util import dt as dt_util

from .const import (
    ATTR_CLICK_COUNT,
    BUTTON_COUNT,
    BUTTON_ROLE_COVER_CLOSE,
    BUTTON_ROLE_COVER_OPEN,
    BUTTON_ROLE_MOMENTARY,
    BUTTON_ROLE_RADIO,
    CLICK_COUNT_DOUBLE,
    COVER_COMMAND_OPEN,
    COVER_COMMAND_STOP,
    COVER_COMMANDS,
    COVER_DIRECTION_CLOSE,
    COVER_DIRECTION_OPEN,
    COVER_HA_MIRROR_SUPPRESS_MARGIN_S,
    COVER_HA_MIRROR_SUPPRESS_S,
    COVER_OPPOSITE_STOP_THEN_REVERSE,
    COVER_POST_START_OFF_GRACE_S,
    COVER_REASON_ABORT,
    COVER_REASON_COMMAND,
    COVER_REASON_ENTITY,
    COVER_REASON_ERROR,
    COVER_REASON_PRESS,
    COVER_REASON_SAFETY,
    COVER_REASON_STOP_PRESS,
    COVER_REASON_TRAVEL_COMPLETE,
    DOMAIN,
    EVENT_BUTTON_PRESS,
    EVENT_COVER_STATE,
    EXPORT_SCOPE_SCHEDULER,
    HOLIDAY_SCOPE_MASTER,
    HOLIDAY_SCOPE_PANEL,
    MODE_COVER,
    MODE_MIXED,
    MODE_RADIO_MANDATORY,
    MODE_RADIO_OPTIONAL,
    MODE_RADIO_SPLIT,
    MODE_TOGGLE,
    MULTI_CLICK_MAX,
    PROFILES_EXPORT_LEGACY_STORAGE_SCHEMA_VERSIONS,
    PROFILES_EXPORT_SCHEMA_VERSION,
    SCHEDULER_EXPORT_SCHEMA_VERSION,
    SCHEDULER_SCOPE_LOCAL,
    SCHEDULER_SCOPE_MASTER,
    SUPPORTED_MODES,
    SYNC_ERROR,
    SYNC_OUT_OF_SYNC,
    SYNC_PENDING,
    SYNC_SYNCED,
    SYNC_SYNCING,
)
from .entity_relay import (
    CoverEntityBinding,
    EntityRelayBinding,
    cover_ha_command_from_transition,
    iter_cover_entity_bindings,
    iter_entity_relay_bindings,
    resolve_radio_selected_from_entities,
    state_value_to_relay_on,
)
from .exceptions import (
    ActionExecutionError,
    ProfileNotFoundError,
    SyncInProgressError,
)
from .holiday_store import async_get_holiday_store, master_holiday_enabled
from .master_store import (
    async_get_master_store,
    list_panel_summaries,
    master_tasks_payload,
)
from .models import (
    ButtonAction,
    CoverConfig,
    EntityMapping,
    HardwareState,
    PanelStorageData,
    Profile,
    SchedulerTask,
    SyncResult,
    capability_defaults,
    validate_covers,
    validate_mixed_profile,
    validate_radio_groups,
)
from .multiclick import (
    MultiClickPending,
    action_for_click_count,
    button_has_multi_click,
    classify_click_count,
    pending_token,
    should_restore_relay_after_double,
)
from .runtime import CoverMotion, PanelRuntime
from .scheduler import (
    condition_entity_ids,
    find_next_scheduler_change,
    next_scheduler_check_at,
    resolve_desired_profile_id,
    scheduler_has_enabled_tasks,
    task_conditions_pass,
    validate_tasks_no_conflicts,
)

_LOGGER = logging.getLogger(__name__)


class PanelCoordinator:
    """Coordinates runtime behavior for one panel entry."""

    def __init__(self, runtime: PanelRuntime) -> None:
        self.runtime = runtime
        self.hass = runtime.hass
        # When True, config-entry update listener skips a full reload (panel rename).
        self.skip_next_reload = False
        # Live HA entity → panel relay listeners (separate from mapped hardware).
        self._entity_relay_unsubs: list[Callable[[], None]] = []
        self._entity_relay_bindings: dict[str, list[EntityRelayBinding]] = {}
        # Live HA cover.* → cover-engine bindings (open/close indication + motor).
        self._cover_entity_bindings: dict[str, list[CoverEntityBinding]] = {}
        # entity_id → monotonic deadline: ignore echoes of our own HA mirrors.
        self._cover_ha_mirror_suppress_until: dict[str, float] = {}
        self._scheduler_unsub: Callable[[], None] | None = None
        self._scheduler_condition_unsub: Callable[[], None] | None = None
        self._scheduler_entity_adder: Callable[[str], None] | None = None
        self._scheduler_entity_remover: Callable[[str], Awaitable[None] | None] | None = None
        self._master_entity_adder: Callable[[str], None] | None = None
        self._master_entity_remover: Callable[[str], Awaitable[None] | None] | None = None
        self._scheduler_applying = False

    @property
    def data(self) -> PanelStorageData:
        """Shortcut to storage data."""
        return self.runtime.store.data

    def register_scheduler_entity_hooks(
        self,
        *,
        adder: Callable[[str], None] | None = None,
        remover: Callable[[str], Awaitable[None] | None] | None = None,
        master_adder: Callable[[str], None] | None = None,
        master_remover: Callable[[str], Awaitable[None] | None] | None = None,
    ) -> None:
        """Allow the switch platform to add/remove per-task enable entities."""
        self._scheduler_entity_adder = adder
        self._scheduler_entity_remover = remover
        self._master_entity_adder = master_adder
        self._master_entity_remover = master_remover

    async def _async_call_scheduler_entity_remover(
        self, remover: Callable[[str], Awaitable[None] | None] | None, task_id: str
    ) -> None:
        """Await switch-platform purge hooks (registry + state)."""
        if remover is None:
            return
        result = remover(task_id)
        if result is not None:
            await result

    async def async_setup(self) -> None:
        """Load storage, attach listeners, and apply the effective profile now.

        Persistence survives HA restart via versioned Store. Draft profiles stay
        as saved for the editor. The internal scheduler (when not in holiday mode)
        activates the profile that should be live *now* with sync; otherwise
        hardware is restored from ``applied_snapshot``.
        """
        await async_get_holiday_store(self.hass)
        await async_get_master_store(self.hass)
        await self.runtime.store.async_load()
        self.data.refresh_pending_status()
        self._attach_listeners()
        self._rebuild_entity_relay_listeners()
        self._rebuild_scheduler_condition_listeners()
        # A restart must never inherit an energized motor: start from both off so
        # the engine's belief and the hardware agree.
        await self._async_cover_abort(COVER_REASON_SAFETY)
        # Drop any armed pulse timers and force momentary relays OFF.
        await self._async_momentary_abort()
        self._multi_click_abort()
        await self.async_scheduler_tick(reason="setup")
        self.runtime.async_notify()

    def _attach_listeners(self) -> None:
        relay_ids = list(self.runtime.mapping.relay_entities)
        # Also watch names/colors/radar/backlight/lock so external Zigbee/HA
        # changes refresh the card and can mark out_of_sync vs applied snapshot.
        other_ids = [
            entity_id
            for entity_id in self.runtime.mapping.all_entities()
            if entity_id not in relay_ids
        ]

        @callback
        def _on_relay_change(event: Event) -> None:
            self.hass.async_create_task(self._async_handle_relay_event(event))

        @callback
        def _on_mapped_change(event: Event) -> None:
            self.hass.async_create_task(self._async_handle_mapped_entity_event(event))

        self.runtime.listeners.append(
            async_track_state_change_event(self.hass, relay_ids, _on_relay_change)
        )
        if other_ids:
            self.runtime.listeners.append(
                async_track_state_change_event(self.hass, other_ids, _on_mapped_change)
            )

    def _clear_entity_relay_listeners(self) -> None:
        """Detach live linked-entity → relay / cover subscriptions."""
        for remove in self._entity_relay_unsubs:
            remove()
        self._entity_relay_unsubs.clear()
        self._entity_relay_bindings.clear()
        self._cover_entity_bindings.clear()

    def _rebuild_entity_relay_listeners(self) -> None:
        """Subscribe to linked HA entities for the active profile (live LED sync).

        Toggle/safe-radio bindings match Sync. Cover motors with
        ``covers[].ha_entity_id`` drive the cover engine (opening/closing →
        direction relay ON; open/closed/stopped → both OFF) without
        re-mirroring back to HA. Momentary never latches from entity state.
        Rebuild after profile/sync changes; unload clears subscriptions.
        """
        self._clear_entity_relay_listeners()
        if self.runtime.unloading:
            return
        profile = self.data.active_profile()
        if profile is None:
            return
        by_entity: dict[str, list[EntityRelayBinding]] = {}
        for relay_binding in iter_entity_relay_bindings(profile):
            by_entity.setdefault(relay_binding.entity_id, []).append(relay_binding)
        self._entity_relay_bindings = by_entity

        by_cover_entity: dict[str, list[CoverEntityBinding]] = {}
        for cover_binding in iter_cover_entity_bindings(profile):
            by_cover_entity.setdefault(cover_binding.entity_id, []).append(cover_binding)
        self._cover_entity_bindings = by_cover_entity

        entity_ids = list({*by_entity, *by_cover_entity})
        if not entity_ids:
            return

        @callback
        def _on_linked_entity_change(event: Event) -> None:
            self.hass.async_create_task(self._async_handle_linked_entity_event(event))

        self._entity_relay_unsubs.append(
            async_track_state_change_event(self.hass, entity_ids, _on_linked_entity_change)
        )

    async def _async_handle_linked_entity_event(self, event: Event) -> None:
        """Mirror linked HA on/off or cover state onto the panel (suppressed write)."""
        if self.runtime.unloading:
            return
        if self.data.sync_status == SYNC_SYNCING or self.runtime.sync_lock.locked():
            return
        entity_id = event.data.get("entity_id")
        old_state = event.data.get("old_state")
        new_state = event.data.get("new_state")
        if entity_id is None or new_state is None:
            return

        cover_bindings = self._cover_entity_bindings.get(str(entity_id)) or []
        if cover_bindings:
            # Position-aware covers can report an unchanged `state` string
            # (e.g. "open" the whole time) while `current_position` moves —
            # do not bail out here on a matching old/new state string.
            await self._async_handle_cover_entity_event(
                str(entity_id), old_state, new_state
            )
            return

        if old_state is not None and old_state.state == new_state.state:
            return

        desired = state_value_to_relay_on(str(entity_id), new_state.state)
        if desired is None:
            return
        bindings = self._entity_relay_bindings.get(str(entity_id)) or []
        if not bindings:
            return
        profile = self.data.active_profile()
        if profile is None:
            return

        handled_radio: set[tuple[int, ...]] = set()
        for binding in bindings:
            if binding.radio_members is not None:
                if binding.radio_members in handled_radio:
                    continue
                handled_radio.add(binding.radio_members)
                await self._async_live_sync_radio_group(
                    profile,
                    list(binding.radio_members),
                    require_selection=binding.radio_require_selection,
                )
            else:
                await self._async_live_set_relay(binding.button_index, desired)
        self.runtime.async_notify()

    async def _async_handle_cover_entity_event(
        self, entity_id: str, old_state: Any, new_state: Any
    ) -> None:
        """Drive cover open/close indication from a linked HA cover.* transition."""
        suppress_until = self._cover_ha_mirror_suppress_until.get(entity_id, 0.0)
        if self._monotonic() < suppress_until:
            return
        command = cover_ha_command_from_transition(old_state, new_state)
        if command is None:
            return
        bindings = self._cover_entity_bindings.get(entity_id) or []
        if not bindings:
            return
        profile = self.data.active_profile()
        if profile is None or profile.mode not in {MODE_COVER, MODE_MIXED}:
            return
        for binding in bindings:
            try:
                cover = self._resolve_cover(profile, binding.cover_id)
            except ValueError:
                continue
            await self._async_live_sync_cover_from_ha(profile, cover, command)

    async def _async_live_sync_cover_from_ha(
        self,
        profile: Profile,
        cover: CoverConfig,
        command: str,
    ) -> None:
        """Match panel cover relays/indication to an external HA cover command.

        Does not mirror back to HA (the entity already changed). Uses the same
        hard-mutex start/halt/reverse paths as card/service commands.
        """
        if not self._cover_is_usable(profile, cover):
            return
        async with self.runtime.cover.lock:
            motion = self.runtime.cover.get(cover.id)
            if command == COVER_COMMAND_STOP:
                if motion.moving:
                    await self._async_cover_halt(
                        cover, reason=COVER_REASON_ENTITY, mirror_ha=False
                    )
                else:
                    # Idle but ensure both direction LEDs/relays are OFF.
                    await self._async_cover_ensure_pair_off(cover)
                    self.runtime.async_notify()
                return

            direction = (
                COVER_DIRECTION_OPEN
                if command == COVER_COMMAND_OPEN
                else COVER_DIRECTION_CLOSE
            )
            if motion.direction == direction:
                return
            if motion.moving:
                if cover.opposite_press == COVER_OPPOSITE_STOP_THEN_REVERSE:
                    await self._async_cover_reverse_to(
                        cover,
                        profile,
                        direction,
                        COVER_REASON_ENTITY,
                        mirror_ha=False,
                    )
                else:
                    await self._async_cover_halt(
                        cover, reason=COVER_REASON_ENTITY, mirror_ha=False
                    )
                    await self._async_cover_start(
                        cover,
                        profile,
                        direction,
                        COVER_REASON_ENTITY,
                        mirror_ha=False,
                    )
                return
            await self._async_cover_start(
                cover,
                profile,
                direction,
                COVER_REASON_ENTITY,
                mirror_ha=False,
            )

    async def _async_live_set_relay(self, index: int, state: bool) -> None:
        """Write a relay only when it differs (transition suppression on write)."""
        if self.runtime.adapter.relay_is_on(index) == state:
            return
        await self.runtime.adapter.async_set_relay(index, state, suppress_event=True)

    async def _async_live_sync_radio_group(
        self,
        profile: Profile,
        members: list[int],
        *,
        require_selection: bool,
    ) -> None:
        """Recompute radio exclusivity from linked entity states (live)."""
        if not members:
            return
        member_set = set(members)
        selected_fallback = (
            profile.selected_button if profile.selected_button in member_set else None
        )
        selection = resolve_radio_selected_from_entities(
            self.hass,
            profile,
            members,
            selected_fallback=selected_fallback,
            require_selection=require_selection,
        )
        if selection.leave_unchanged:
            return
        selected = selection.selected
        if selected is not None and profile.mode in {
            MODE_RADIO_MANDATORY,
            MODE_RADIO_OPTIONAL,
        }:
            profile.selected_button = selected
        for index in sorted(members):
            await self._async_live_set_relay(index, selected == index)

    async def async_unload(self) -> None:
        """Stop the motor, detach listeners, and mark unloading."""
        # De-energize before dropping listeners so a cover can never be left
        # travelling by an unload, reload, or Home Assistant shutdown.
        await self._async_cover_abort(COVER_REASON_ABORT)
        await self._async_momentary_abort()
        self._multi_click_abort()
        self.runtime.unloading = True
        self._cancel_scheduler_timer()
        self._clear_scheduler_condition_listeners()
        self._clear_entity_relay_listeners()
        self._cover_ha_mirror_suppress_until.clear()
        for remove in self.runtime.listeners:
            remove()
        self.runtime.listeners.clear()
        self.runtime.suppression.clear()

    def _iter_panel_coordinators(self) -> list[PanelCoordinator]:
        """Return all loaded panel coordinators."""
        domain = self.hass.data.get(DOMAIN) or {}
        out: list[PanelCoordinator] = []
        for entry_data in domain.values():
            if not isinstance(entry_data, dict):
                continue
            coordinator = entry_data.get("coordinator")
            if isinstance(coordinator, PanelCoordinator):
                out.append(coordinator)
        return out

    def _master_tasks_for_this_entry(self) -> list[SchedulerTask]:
        """Master tasks that include this panel."""
        domain = self.hass.data.get(DOMAIN) or {}
        store = domain.get("master_store")
        if store is None:
            return []
        entry_id = self.runtime.entry.entry_id
        return list(store.tasks_for_entry(entry_id))

    def _effective_scheduler_tasks(self) -> list[SchedulerTask]:
        """Local tasks plus master tasks targeting this panel."""
        return [*self.data.scheduler_tasks.values(), *self._master_tasks_for_this_entry()]

    def _clear_scheduler_condition_listeners(self) -> None:
        """Detach HA entity listeners used for scheduler conditions."""
        if self._scheduler_condition_unsub is not None:
            self._scheduler_condition_unsub()
            self._scheduler_condition_unsub = None

    def _rebuild_scheduler_condition_listeners(self) -> None:
        """Subscribe to condition entity state changes for local + master tasks."""
        self._clear_scheduler_condition_listeners()
        if self.runtime.unloading:
            return
        entity_ids = condition_entity_ids(self._effective_scheduler_tasks())
        if not entity_ids:
            return

        @callback
        def _on_condition_change(_event: Event) -> None:
            self.hass.async_create_task(
                self.async_scheduler_tick(reason="condition_state")
            )

        self._scheduler_condition_unsub = async_track_state_change_event(
            self.hass, entity_ids, _on_condition_change
        )

    def _cancel_scheduler_timer(self) -> None:
        """Cancel the pending point-in-time scheduler callback."""
        if self._scheduler_unsub is not None:
            self._scheduler_unsub()
            self._scheduler_unsub = None

    def _schedule_next_scheduler_tick(self) -> None:
        """Arm the next realtime scheduler evaluation."""
        self._cancel_scheduler_timer()
        if self.runtime.unloading:
            return
        now = dt_util.now()
        when = next_scheduler_check_at(self._effective_scheduler_tasks(), now)

        @callback
        def _fire(_now: datetime) -> None:
            self._scheduler_unsub = None
            self.hass.async_create_task(self.async_scheduler_tick(reason="timer"))

        self._scheduler_unsub = async_track_point_in_time(self.hass, _fire, when)

    async def async_scheduler_tick(self, *, reason: str = "tick") -> None:
        """Evaluate the desired profile now and activate+sync when it changes.

        Holiday mode suppresses scheduler activations (hardware falls back to the
        applied-snapshot restore path on setup only). Outside holiday, covering
        ranges win when their entity conditions pass; otherwise the panel default
        profile is applied. Master multi-panel tasks are merged with local tasks.
        """
        if self.runtime.unloading:
            return
        if self._scheduler_applying:
            self._schedule_next_scheduler_tick()
            return

        holiday = self.effective_holiday_mode()
        now = dt_util.now()
        tasks = self._effective_scheduler_tasks()
        desired = resolve_desired_profile_id(
            holiday_mode=holiday,
            default_profile_id=self.data.default_profile_id,
            tasks=tasks,
            when=now,
            known_profiles=set(self.data.profiles),
            conditions_ok=lambda task: task_conditions_pass(self.hass, task),
        )
        has_enabled_tasks = any(task.enabled for task in tasks)

        try:
            self._scheduler_applying = True
            # Holiday / no desired profile: never activate from scheduler.
            # Panels without enabled tasks keep classic applied-snapshot restore.
            if holiday or desired is None:
                if reason == "setup":
                    await self._async_restore_applied_to_hardware()
            elif has_enabled_tasks or desired != self.data.active_profile_id:
                if desired != self.data.active_profile_id or reason == "setup":
                    _LOGGER.debug(
                        "Scheduler (%s) activating profile %s for panel %s",
                        reason,
                        desired,
                        self.runtime.mapping.panel_name,
                    )
                    await self.async_activate_profile(desired, sync=True)
            elif reason == "setup":
                await self._async_restore_applied_to_hardware()
        finally:
            self._scheduler_applying = False
            self._schedule_next_scheduler_tick()
            self.runtime.async_notify()

    async def _async_tick_entries(
        self, entry_ids: Iterable[str] | None = None, *, reason: str
    ) -> None:
        """Re-evaluate schedulers for selected panels (or all when None)."""
        wanted = set(entry_ids) if entry_ids is not None else None
        for coordinator in self._iter_panel_coordinators():
            if wanted is not None and coordinator.runtime.entry.entry_id not in wanted:
                continue
            coordinator._rebuild_scheduler_condition_listeners()
            await coordinator.async_scheduler_tick(reason=reason)

    def _tasks_for_entry_validation(self, entry_id: str) -> list[SchedulerTask]:
        """Local + master tasks that affect ``entry_id`` (for conflict checks)."""
        tasks: list[SchedulerTask] = []
        for coordinator in self._iter_panel_coordinators():
            if coordinator.runtime.entry.entry_id != entry_id:
                continue
            tasks.extend(coordinator.data.scheduler_tasks.values())
            break
        domain = self.hass.data.get(DOMAIN) or {}
        store = domain.get("master_store")
        if store is not None:
            tasks.extend(store.tasks_for_entry(entry_id))
        return tasks

    async def async_set_default_profile(self, profile_id: str) -> None:
        """Persist the panel default profile used outside timeline ranges."""
        if profile_id not in self.data.profiles:
            raise ProfileNotFoundError(profile_id)
        self.data.default_profile_id = profile_id
        await self.runtime.store.async_save()
        await self.async_scheduler_tick(reason="default_profile")
        self.runtime.async_notify()

    async def async_upsert_scheduler_task(self, payload: dict[str, Any]) -> SchedulerTask:
        """Create or update a local or master scheduler task after conflict validation."""
        raw = dict(payload)
        scope = str(raw.get("scope") or SCHEDULER_SCOPE_LOCAL).strip().lower()
        if scope == SCHEDULER_SCOPE_MASTER:
            return await self.async_upsert_master_scheduler_task(raw)

        raw["scope"] = SCHEDULER_SCOPE_LOCAL
        raw["entry_ids"] = []
        task = SchedulerTask.from_dict(raw)
        for rng in task.ranges:
            if rng.profile_id not in self.data.profiles:
                raise ProfileNotFoundError(rng.profile_id)
        proposed = dict(self.data.scheduler_tasks)
        is_new = task.id not in proposed
        proposed[task.id] = task
        # Include master tasks that hit this panel in static conflict checks.
        combined = [*proposed.values(), *self._master_tasks_for_this_entry()]
        # When updating, master list already excludes this local id; replace local.
        validate_tasks_no_conflicts(combined)
        self.data.scheduler_tasks[task.id] = task
        await self.runtime.store.async_save()
        if is_new and self._scheduler_entity_adder is not None:
            self._scheduler_entity_adder(task.id)
        self._rebuild_scheduler_condition_listeners()
        await self.async_scheduler_tick(reason="task_upsert")
        self.runtime.async_notify()
        return task

    async def async_upsert_master_scheduler_task(
        self, payload: dict[str, Any]
    ) -> SchedulerTask:
        """Create or update a multi-panel master task."""
        raw = dict(payload)
        raw["scope"] = SCHEDULER_SCOPE_MASTER
        task = SchedulerTask.from_dict(raw)
        store = await async_get_master_store(self.hass)

        # Validate profile IDs exist on every targeted panel.
        for entry_id in task.entry_ids:
            coordinator = next(
                (
                    item
                    for item in self._iter_panel_coordinators()
                    if item.runtime.entry.entry_id == entry_id
                ),
                None,
            )
            if coordinator is None:
                raise ValueError(f"Unknown panel entry_id: {entry_id}")
            for rng in task.ranges:
                if rng.profile_id not in coordinator.data.profiles:
                    raise ProfileNotFoundError(
                        f"{rng.profile_id} (missing on panel {entry_id})"
                    )

        # Conflict-check per targeted entry against that entry's local + masters.
        for entry_id in task.entry_ids:
            combined = [
                item
                for item in self._tasks_for_entry_validation(entry_id)
                if item.id != task.id
            ]
            combined.append(task)
            validate_tasks_no_conflicts(combined)

        is_new = task.id not in store.tasks
        await store.async_upsert(task)
        if is_new:
            for coordinator in self._iter_panel_coordinators():
                if coordinator._master_entity_adder is not None:
                    coordinator._master_entity_adder(task.id)
                    break
        await self._async_tick_entries(task.entry_ids, reason="master_upsert")
        self.runtime.async_notify()
        return task

    async def async_delete_scheduler_task(self, task_id: str) -> None:
        """Delete a local or master scheduler task."""
        store = await async_get_master_store(self.hass)
        if task_id in store.tasks:
            affected = list(store.tasks[task_id].entry_ids)
            await store.async_delete(task_id)
            for coordinator in self._iter_panel_coordinators():
                if coordinator._master_entity_remover is not None:
                    await self._async_call_scheduler_entity_remover(
                        coordinator._master_entity_remover, task_id
                    )
                    break
            await self._async_tick_entries(affected, reason="master_delete")
            self.runtime.async_notify()
            return
        if task_id not in self.data.scheduler_tasks:
            raise ValueError(f"Unknown scheduler task: {task_id}")
        del self.data.scheduler_tasks[task_id]
        await self.runtime.store.async_save()
        await self._async_call_scheduler_entity_remover(
            self._scheduler_entity_remover, task_id
        )
        self._rebuild_scheduler_condition_listeners()
        await self.async_scheduler_tick(reason="task_delete")
        self.runtime.async_notify()

    async def async_set_scheduler_task_enabled(self, task_id: str, enabled: bool) -> None:
        """Enable or disable a local or master task. Re-validates conflicts when enabling."""
        store = await async_get_master_store(self.hass)
        if task_id in store.tasks:
            task = store.tasks[task_id]
            if bool(enabled) == task.enabled:
                return
            updated = SchedulerTask.from_dict({**task.to_dict(), "enabled": bool(enabled)})
            if enabled:
                for entry_id in updated.entry_ids:
                    combined = [
                        item
                        for item in self._tasks_for_entry_validation(entry_id)
                        if item.id != task_id
                    ]
                    combined.append(updated)
                    validate_tasks_no_conflicts(combined)
            await store.async_upsert(updated)
            await self._async_tick_entries(updated.entry_ids, reason="master_enabled")
            self.runtime.async_notify()
            return

        task = self.data.scheduler_tasks.get(task_id)
        if task is None:
            raise ValueError(f"Unknown scheduler task: {task_id}")
        if bool(enabled) == task.enabled:
            return
        proposed = dict(self.data.scheduler_tasks)
        updated = SchedulerTask.from_dict({**task.to_dict(), "enabled": bool(enabled)})
        proposed[task_id] = updated
        if enabled:
            validate_tasks_no_conflicts(
                [*proposed.values(), *self._master_tasks_for_this_entry()]
            )
        self.data.scheduler_tasks[task_id] = updated
        await self.runtime.store.async_save()
        self._rebuild_scheduler_condition_listeners()
        await self.async_scheduler_tick(reason="task_enabled")
        self.runtime.async_notify()

    def effective_holiday_mode(self) -> bool:
        """True when this panel's schedulers are suspended (local or master)."""
        return bool(self.data.holiday_mode) or master_holiday_enabled(self.hass)

    def holiday_fields(self) -> dict[str, Any]:
        """Holiday flags for get_config / subscribe / scheduler payloads."""
        master = master_holiday_enabled(self.hass)
        panel = bool(self.data.holiday_mode)
        return {
            # Effective: faceplate icon + scheduler pause for THIS panel.
            "holiday_mode": panel or master,
            "panel_holiday_mode": panel,
            "master_holiday_mode": master,
        }

    async def async_set_holiday_mode(
        self, enabled: bool, *, scope: str = HOLIDAY_SCOPE_PANEL
    ) -> bool:
        """Set panel or master holiday and re-evaluate affected coordinators.

        ``scope=panel`` (default): only this entry's ``holiday_mode``.
        ``scope=master``: domain master holiday — forces holiday on every panel
        (legacy global holiday migrates here).
        """
        scope_norm = str(scope or HOLIDAY_SCOPE_PANEL).strip().lower()
        if scope_norm == HOLIDAY_SCOPE_MASTER:
            store = await async_get_holiday_store(self.hass)
            value = await store.async_set(enabled)
            for coordinator in self._iter_panel_coordinators():
                await coordinator.async_scheduler_tick(reason="master_holiday")
                coordinator.runtime.async_notify()
            return value

        self.data.holiday_mode = bool(enabled)
        await self.runtime.store.async_save()
        await self.async_scheduler_tick(reason="panel_holiday")
        self.runtime.async_notify()
        return self.effective_holiday_mode()

    def scheduler_payload(self) -> dict[str, Any]:
        """Return scheduler fields for the card / get_config."""
        return {
            "default_profile_id": self.data.default_profile_id,
            **self.holiday_fields(),
            "scheduler_tasks": {
                key: task.to_dict() for key, task in self.data.scheduler_tasks.items()
            },
            **master_tasks_payload(self.hass),
            "panels": list_panel_summaries(self.hass),
            **self._scheduler_next_payload(),
        }

    def _scheduler_next_payload(self) -> dict[str, Any]:
        """Faceplate footer fields: next profile change, or null when inactive."""
        holiday = self.effective_holiday_mode()
        tasks = self._effective_scheduler_tasks()
        active = (not holiday) and scheduler_has_enabled_tasks(tasks)
        if not active:
            return {"scheduler_active": False, "scheduler_next": None}
        names = {pid: profile.name for pid, profile in self.data.profiles.items()}
        event = find_next_scheduler_change(
            holiday_mode=False,
            default_profile_id=self.data.default_profile_id,
            tasks=tasks,
            when=dt_util.now(),
            known_profiles=names,
            conditions_ok=lambda task: task_conditions_pass(self.hass, task),
        )
        return {
            "scheduler_active": True,
            "scheduler_next": event.to_dict() if event is not None else None,
        }

    def get_runtime_payload(self) -> dict[str, Any]:
        """Return live runtime fields for card refresh (never includes drafts)."""
        return {
            "entry_id": self.runtime.entry.entry_id,
            "sync_status": self.data.sync_status,
            "last_sync": self.data.last_sync,
            "last_error": self.data.last_error,
            "auto_sync": self.runtime.auto_sync,
            **self.holiday_fields(),
            "default_profile_id": self.data.default_profile_id,
            "active_profile_id": self.data.active_profile_id,
            "relay_entities": list(self.runtime.mapping.relay_entities),
            "relay_states": self._relay_states_payload(),
            "panel_available": self._panel_available(),
            "momentary_active": sorted(self.runtime.momentary.timers),
            "cover_state": self.cover_state_payload(),
            **self._scheduler_next_payload(),
        }

    def get_config_payload(self) -> dict[str, Any]:
        """Return frontend configuration payload."""
        colors = self.runtime.adapter.supported_colors()
        radar = self.runtime.adapter.supported_radar()
        defaults = capability_defaults()
        defaults["colors"] = colors
        defaults["radar"] = radar
        return {
            "entry_id": self.runtime.entry.entry_id,
            "panel_name": self.runtime.mapping.panel_name,
            "adapter_type": self.runtime.mapping.adapter_type,
            "active_profile_id": self.data.active_profile_id,
            "default_profile_id": self.data.default_profile_id,
            **self.holiday_fields(),
            "scheduler_tasks": {
                key: task.to_dict() for key, task in self.data.scheduler_tasks.items()
            },
            **master_tasks_payload(self.hass),
            "panels": list_panel_summaries(self.hass),
            **self._scheduler_next_payload(),
            "sync_status": self.data.sync_status,
            "last_sync": self.data.last_sync,
            "last_error": self.data.last_error,
            "auto_sync": self.runtime.auto_sync,
            "capabilities": defaults,
            "profiles": {key: profile.to_dict() for key, profile in self.data.profiles.items()},
            "applied_snapshot": self.data.applied_snapshot,
            "relay_entities": list(self.runtime.mapping.relay_entities),
            "relay_states": self._relay_states_payload(),
            "panel_available": self._panel_available(),
            "momentary_active": sorted(self.runtime.momentary.timers),
            "cover_state": self.cover_state_payload(),
        }

    async def _async_handle_relay_event(self, event: Event) -> None:
        if self.runtime.unloading:
            return
        entity_id = event.data.get("entity_id")
        old_state = event.data.get("old_state")
        new_state = event.data.get("new_state")
        if entity_id is None or old_state is None or new_state is None:
            return
        if new_state.state in {STATE_UNKNOWN, STATE_UNAVAILABLE}:
            # Z2M/MQTT offline → HA unavailable: refresh panel_available for the card.
            if old_state.state != new_state.state:
                self.runtime.async_notify()
            return
        if old_state.state == new_state.state:
            return
        if (
            old_state.state in {STATE_UNKNOWN, STATE_UNAVAILABLE}
            and self.data.sync_status == SYNC_ERROR
        ):
            # Hardware just came back online after a failed startup restore
            # (e.g. Zigbee2MQTT reconnecting after HA); retry instead of
            # treating this recovery as a physical button press.
            await self._async_restore_applied_to_hardware()
            self.runtime.async_notify()
            return
        # Always refresh card-visible runtime after a real entity change, even
        # when the transition is integration-driven (suppressed).
        self.runtime.async_notify()
        if self.runtime.suppression.should_suppress(entity_id, new_state.state):
            return
        try:
            index = list(self.runtime.mapping.relay_entities).index(entity_id) + 1
        except ValueError:
            return
        turned_on = new_state.state == "on"
        await self._async_handle_physical_press(index, turned_on)
        self.runtime.async_notify()

    async def _async_handle_mapped_entity_event(self, event: Event) -> None:
        """Refresh UI and drift status when non-relay mapped entities change."""
        if self.runtime.unloading:
            return
        if self.data.sync_status == SYNC_SYNCING:
            return
        new_state = event.data.get("new_state")
        old_state = event.data.get("old_state")
        if new_state is None or old_state is None:
            return
        if new_state.state in {STATE_UNKNOWN, STATE_UNAVAILABLE}:
            # Z2M/MQTT offline → HA unavailable: refresh panel_available for the card.
            if old_state.state != new_state.state:
                self.runtime.async_notify()
            return
        if old_state.state == new_state.state:
            return
        if (
            old_state.state in {STATE_UNKNOWN, STATE_UNAVAILABLE}
            and self.data.sync_status == SYNC_ERROR
        ):
            # Mapped entity just came back online after a failed startup
            # restore; retry instead of waiting for a manual reload.
            await self._async_restore_applied_to_hardware()
            self.runtime.async_notify()
            return
        self.runtime.async_notify()
        if not self.data.applied_snapshot:
            return
        try:
            hardware = await self.runtime.adapter.async_read_hardware_state()
        except Exception:  # noqa: BLE001
            return
        if self._hardware_differs_from_snapshot(hardware) and self.data.sync_status not in {
            SYNC_SYNCING,
            SYNC_ERROR,
        }:
            self.data.sync_status = SYNC_OUT_OF_SYNC  # type: ignore[assignment]
            self.runtime.async_notify()

    async def _async_restore_applied_to_hardware(self) -> None:
        """Re-apply last successful Sync after HA restart / entry setup.

        Draft profiles are not overwritten. Only ``applied_snapshot`` is written
        to the panel so hardware matches the last known-good configuration.
        """
        snapshot = self.data.applied_snapshot
        if not snapshot:
            _LOGGER.debug("No applied snapshot to restore for %s", self.runtime.entry.entry_id)
            return
        try:
            applied = Profile.from_dict(dict(snapshot))
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Applied snapshot is invalid; skipping hardware restore: %s", err)
            self.data.last_error = f"Applied snapshot invalid on startup: {err}"
            self.data.sync_status = SYNC_ERROR  # type: ignore[assignment]
            await self.runtime.store.async_save()
            return

        if self.runtime.sync_lock.locked():
            return
        async with self.runtime.sync_lock:
            try:
                result = await asyncio.wait_for(
                    self.runtime.adapter.async_apply_profile(applied),
                    timeout=self.runtime.sync_timeout,
                )
            except TimeoutError:
                result = SyncResult(
                    success=False,
                    error=f"Startup restore timed out after {self.runtime.sync_timeout:.0f}s",
                    confirmed_steps=[],
                )
            if result.success:
                _LOGGER.info(
                    "Restored panel '%s' from applied snapshot (%s)",
                    self.runtime.mapping.panel_name,
                    applied.id,
                )
                self.data.last_error = None
                try:
                    hardware = await self.runtime.adapter.async_read_hardware_state()
                    if self._hardware_differs_from_snapshot(hardware):
                        self.data.sync_status = SYNC_OUT_OF_SYNC  # type: ignore[assignment]
                    else:
                        # refresh_pending_status() no-ops while status is still
                        # "error" from a prior failed attempt; clear it first so a
                        # successful retry actually recomputes synced/pending.
                        self.data.sync_status = SYNC_PENDING  # type: ignore[assignment]
                        self.data.refresh_pending_status()
                except Exception:  # noqa: BLE001
                    self.data.sync_status = SYNC_PENDING  # type: ignore[assignment]
                    self.data.refresh_pending_status()
            else:
                self.data.last_error = result.error or "Startup restore failed"
                self.data.sync_status = SYNC_ERROR  # type: ignore[assignment]
                _LOGGER.error(
                    "Startup restore failed for '%s': %s",
                    self.runtime.mapping.panel_name,
                    self.data.last_error,
                )
            await self.runtime.store.async_save()

    async def _async_handle_physical_press(self, index: int, turned_on: bool) -> None:
        profile = self.data.active_profile()
        if profile is None:
            return
        if profile.mode == MODE_COVER:
            await self._async_cover_press(profile, index, turned_on)
            return
        if profile.mode == MODE_MIXED:
            await self._async_mixed_press(profile, index, turned_on)
            return
        if profile.mode == MODE_TOGGLE:
            await self._async_route_button_action(profile, index, turned_on)
            return
        if profile.mode == MODE_RADIO_SPLIT:
            await self._async_radio_split(profile, index, turned_on)
            return
        # Independent toggles inside a radio profile skip exclusivity.
        if not profile.is_radio_member(index):
            await self._async_route_button_action(profile, index, turned_on)
            return
        if profile.mode == MODE_RADIO_MANDATORY:
            await self._async_radio_mandatory(profile, index, turned_on)
            return
        if profile.mode == MODE_RADIO_OPTIONAL:
            await self._async_radio_optional(profile, index, turned_on)

    # ------------------------------------------------------------------
    # Mixed mode — per-button roles
    #
    # Each visible button has role: toggle | momentary | radio |
    # cover_open | cover_close. Engines below reuse the dedicated cover /
    # radio / pulse helpers so safety contracts stay identical.
    # ------------------------------------------------------------------

    async def _async_mixed_press(self, profile: Profile, index: int, turned_on: bool) -> None:
        """Route a physical press by the button's mixed-mode role."""
        role = profile.button_role(index)
        if role in {BUTTON_ROLE_COVER_OPEN, BUTTON_ROLE_COVER_CLOSE}:
            await self._async_cover_press(profile, index, turned_on)
            return
        if role == BUTTON_ROLE_MOMENTARY:
            await self._async_momentary_press(profile, index, turned_on)
            return
        if role == BUTTON_ROLE_RADIO:
            await self._async_radio_split(profile, index, turned_on)
            return
        await self._async_route_button_action(profile, index, turned_on)

    # ------------------------------------------------------------------
    # Momentary (timed pulse) engine — used by mixed role=momentary
    #
    # Press contract:
    #   * Physical ON → arm OFF after pulse_time_s immediately, then run
    #     the HA action once (action I/O must not delay/cancel the pulse).
    #   * Re-press while ON/timer armed → cancel timer and force OFF
    #     (fail-safe; no second action). On latching panels the re-press
    #     arrives as physical OFF; an ON while a timer is already armed
    #     is treated the same way.
    #   * Timer expiry → force OFF with transition suppression (no action).
    # ------------------------------------------------------------------

    async def _async_momentary_press(self, profile: Profile, index: int, turned_on: bool) -> None:
        """Handle a physical press for a momentary-role button."""
        button = profile.button_by_index(index)
        if button is None or button.role != BUTTON_ROLE_MOMENTARY:
            await self._async_route_button_action(profile, index, turned_on)
            return

        run_action = False
        force_off = False
        async with self.runtime.momentary.lock:
            armed = index in self.runtime.momentary.timers
            if not turned_on:
                # Latching re-press: relay is already going OFF — drop the pulse.
                self.runtime.momentary.cancel_timer(index)
                return
            if armed:
                self.runtime.momentary.cancel_timer(index)
                force_off = True
            else:
                # Arm before any action I/O so a slow/hung service cannot
                # leave the relay latched ON without an OFF timer.
                self._arm_momentary_timer(profile.id, index, button.pulse_time_s)
                run_action = True

        if force_off:
            try:
                await self.runtime.adapter.async_set_relay(index, False, suppress_event=True)
            except Exception as err:  # noqa: BLE001
                _LOGGER.error("Momentary re-press failed to turn off button %s: %s", index, err)
            self.runtime.async_notify()
            return
        if run_action:
            await self._async_route_button_action(profile, index, True)

    def _arm_momentary_timer(self, profile_id: str, index: int, duration: float) -> None:
        """Schedule relay OFF after ``duration`` seconds. Caller holds the lock."""
        self.runtime.momentary.cancel_timer(index)
        token: object = object()
        self.runtime.momentary.tokens[index] = token
        loop = getattr(self.hass, "loop", None) or asyncio.get_running_loop()

        @callback
        def _fire(_now: Any = None) -> None:
            # Never block the loop; the async OFF path validates ``token``.
            self.hass.async_create_task(self._async_momentary_pulse_off(profile_id, index, token))

        self.runtime.momentary.timers[index] = loop.call_later(duration, _fire)

    async def _async_momentary_pulse_off(self, profile_id: str, index: int, token: object) -> None:
        """Turn a momentary relay OFF after the configured pulse time."""
        async with self.runtime.momentary.lock:
            # Stale expiry after cancel / re-arm must not touch hardware.
            if self.runtime.momentary.tokens.get(index) is not token:
                return
            self.runtime.momentary.cancel_timer(index)
        try:
            await self.runtime.adapter.async_set_relay(index, False, suppress_event=True)
        except Exception as err:  # noqa: BLE001
            _LOGGER.error(
                "Momentary pulse OFF failed for button %s (profile %s): %s",
                index,
                profile_id,
                err,
            )
        self.runtime.async_notify()

    async def _async_momentary_abort(self) -> None:
        """Cancel all pulse timers and force momentary-role relays OFF.

        Non-momentary buttons are left alone so latched toggles / radio /
        cover engines are not disturbed. Remembered timer indexes are always
        forced OFF even after leaving mixed mode.
        """
        async with self.runtime.momentary.lock:
            indexes = set(self.runtime.momentary.timers)
            self.runtime.momentary.cancel_all()
            profile = self.data.active_profile()
            if profile is not None and profile.mode == MODE_MIXED:
                indexes.update(profile.momentary_button_indexes())
            for index in sorted(indexes):
                try:
                    await self.runtime.adapter.async_set_relay(index, False, suppress_event=True)
                except Exception as err:  # noqa: BLE001
                    _LOGGER.error("Momentary abort failed to turn off button %s: %s", index, err)

    async def _async_radio_split(self, profile: Profile, index: int, turned_on: bool) -> None:
        """Handle radio_split: exclusivity only within the button's group."""
        group = profile.radio_group_for(index)
        if group is None:
            # Ungrouped buttons behave as independent toggles.
            await self._async_route_button_action(profile, index, turned_on)
            return
        members = list(group.buttons)
        if turned_on:
            await self._async_route_button_action(profile, index, True)
            for other in members:
                if other != index:
                    await self.runtime.adapter.async_set_relay(other, False, suppress_event=True)
            return
        # Classic radio within group: keep exactly one ON (restore; no self-toggle-off).
        await self.runtime.adapter.async_set_relay(index, True, suppress_event=True)

    async def _async_radio_mandatory(self, profile: Profile, index: int, turned_on: bool) -> None:
        members = profile.radio_member_indexes()
        if turned_on:
            await self._async_route_button_action(profile, index, True)
            profile.selected_button = index
            for other in members:
                if other != index:
                    await self.runtime.adapter.async_set_relay(other, False, suppress_event=True)
            await self.runtime.store.async_save()
            self.runtime.async_notify()
            return
        # Keep at least one radio member ON.
        if profile.selected_button == index or profile.selected_button is None:
            profile.selected_button = index
            await self.runtime.adapter.async_set_relay(index, True, suppress_event=True)
            await self.runtime.store.async_save()
            self.runtime.async_notify()

    async def _async_radio_optional(self, profile: Profile, index: int, turned_on: bool) -> None:
        """Classic radio among members: exactly one ON; no self-toggle-off."""
        await self._async_radio_mandatory(profile, index, turned_on)

    # ------------------------------------------------------------------
    # Cover / shutter engine
    #
    # Safety contract (per cover):
    #   * Only one direction relay of a given cover may ever be energized.
    #   * Every start de-energizes that cover's opposite relay first.
    #   * Any failure, abort, unload, or timer expiry forces that cover OFF.
    #   * All decisions run under one lock so presses cannot interleave.
    # Different covers may travel at the same time when their buttons differ.
    # ------------------------------------------------------------------

    async def _async_cover_press(self, profile: Profile, index: int, turned_on: bool) -> None:
        """Route a physical relay transition while a cover profile is active."""
        if profile.mode == MODE_MIXED:
            profile.sync_covers_from_roles()
        cover = profile.cover_for_button(index)
        if cover is None:
            # Buttons outside every cover pair stay independent toggles.
            await self._async_route_button_action(profile, index, turned_on)
            return
        direction = cover.direction_for(index)
        if direction is None:
            await self._async_route_button_action(profile, index, turned_on)
            return
        if not self._cover_is_usable(profile, cover):
            await self._async_cover_abort(COVER_REASON_ERROR)
            return

        async with self.runtime.cover.lock:
            motion = self.runtime.cover.get(cover.id)
            if not turned_on:
                # OFF on the inactive direction must not abort travel. After
                # reverse the previous direction often reports a duplicate OFF.
                if motion.moving and motion.direction != direction:
                    return
                if motion.moving and motion.direction == direction:
                    opposite_dir = cover.opposite_direction(direction)
                    opposite_btn = cover.button_for(opposite_dir)
                    # Latching panels often turn the old direction OFF when the
                    # user presses reverse (hardware mutex). If the opposite
                    # relay is already ON, continue travel that way — do not
                    # treat this OFF as a full stop.
                    if (
                        cover.opposite_press == COVER_OPPOSITE_STOP_THEN_REVERSE
                        and self.runtime.adapter.relay_is_on(opposite_btn)
                    ):
                        await self._async_cover_reverse_to(
                            cover,
                            profile,
                            opposite_dir,
                            COVER_REASON_PRESS,
                        )
                        return
                    # Stale OFF echo shortly after reverse start.
                    if (
                        motion.suppress_stale_off_until is not None
                        and self._monotonic() < motion.suppress_stale_off_until
                    ):
                        target = cover.button_for(direction)
                        if not self.runtime.adapter.relay_is_on(target):
                            try:
                                await self.runtime.adapter.async_set_relay(
                                    target, True, suppress_event=True
                                )
                            except Exception as err:  # noqa: BLE001
                                _LOGGER.error(
                                    "Cover %s failed to re-assert %s after stale OFF: %s",
                                    cover.id,
                                    direction,
                                    err,
                                )
                                await self._async_cover_halt(
                                    cover, reason=COVER_REASON_ERROR
                                )
                        return
                    await self._async_cover_halt(
                        cover, reason=COVER_REASON_STOP_PRESS
                    )
                    return
                await self._async_cover_halt(cover, reason=COVER_REASON_SAFETY)
                return
            if motion.moving:
                previous = motion.direction
                if previous == direction:
                    # Same direction while moving = stop.
                    await self._async_cover_halt(
                        cover, reason=COVER_REASON_STOP_PRESS
                    )
                    return
                if cover.opposite_press != COVER_OPPOSITE_STOP_THEN_REVERSE:
                    await self._async_cover_halt(
                        cover, reason=COVER_REASON_STOP_PRESS
                    )
                    return
                # Reverse: never pulse the newly pressed relay OFF→ON.
                await self._async_cover_reverse_to(
                    cover, profile, direction, COVER_REASON_PRESS
                )
                return
            await self._async_cover_start(cover, profile, direction, COVER_REASON_PRESS)

    async def async_cover_command(
        self, command: str, cover_id: str | None = None
    ) -> dict[str, Any]:
        """Drive one cover from the card, a service, or an automation."""
        if command not in COVER_COMMANDS:
            raise ValueError(f"Unsupported cover command: {command}")
        profile = self.data.active_profile()
        if profile is None:
            raise ProfileNotFoundError("No active profile")
        if profile.mode == MODE_COVER:
            validate_covers(profile.covers, gang_count=profile.gang_count)
        elif profile.mode == MODE_MIXED:
            profile.sync_covers_from_roles()
            validate_mixed_profile(profile)
            if not profile.active_covers():
                raise ValueError("Mixed profile has no cover roles configured")
        else:
            raise ValueError("Active profile is not in cover mode")
        cover = self._resolve_cover(profile, cover_id)

        async with self.runtime.cover.lock:
            motion = self.runtime.cover.get(cover.id)
            if command == COVER_COMMAND_STOP:
                await self._async_cover_halt(cover, reason=COVER_REASON_COMMAND)
                return self.cover_state_payload(cover_id=cover.id)
            direction = (
                COVER_DIRECTION_OPEN if command == COVER_COMMAND_OPEN else COVER_DIRECTION_CLOSE
            )
            if motion.moving:
                previous = motion.direction
                if previous == direction:
                    # Same direction command while moving = stop.
                    await self._async_cover_halt(cover, reason=COVER_REASON_COMMAND)
                    return self.cover_state_payload(cover_id=cover.id)
                if cover.opposite_press != COVER_OPPOSITE_STOP_THEN_REVERSE:
                    await self._async_cover_halt(cover, reason=COVER_REASON_COMMAND)
                    return self.cover_state_payload(cover_id=cover.id)
                await self._async_cover_reverse_to(
                    cover, profile, direction, COVER_REASON_COMMAND
                )
            else:
                await self._async_cover_start(cover, profile, direction, COVER_REASON_COMMAND)
        return self.cover_state_payload(cover_id=cover.id)

    async def _async_cover_reverse_to(
        self,
        cover: CoverConfig,
        profile: Profile,
        new_direction: str,
        reason: str,
        *,
        mirror_ha: bool = True,
    ) -> None:
        """Switch travel to ``new_direction`` without pulsing that relay OFF→ON.

        Latching Zemismart panels: the user already turned the reverse relay ON.
        The old halt-both-OFF then force-ON path killed travel (buttons swapped
        then the new action died). Here we only de-energize the previous
        direction, settle, keep/ensure the new relay ON, and arm a fresh timer.
        """
        motion = self.runtime.cover.get(cover.id)
        previous = motion.direction
        if previous == new_direction:
            return

        target = cover.button_for(new_direction)
        old = cover.button_for(previous) if previous else None

        timer = motion.timer
        motion.timer = None
        if timer is not None and timer is not asyncio.current_task():
            timer.cancel()
        # Bookkeeping cleared until we re-arm; relays handled explicitly below.
        motion.direction = None
        motion.started_at = None
        motion.duration = None
        motion.suppress_stale_off_until = None
        motion.last_reason = reason

        if old is not None and old != target:
            if not await self._async_cover_relay_off(old):
                await self._async_cover_halt(cover, reason=COVER_REASON_ERROR)
                return

        settle = float(cover.direction_settle_s or 0.0)
        if settle > 0:
            await asyncio.sleep(settle)
            if old is not None and old != target:
                await self._async_cover_relay_off(old)

        # Never turn the reverse target OFF here — only ensure it is ON.
        if not self.runtime.adapter.relay_is_on(target):
            try:
                await self.runtime.adapter.async_set_relay(
                    target, True, suppress_event=True
                )
            except Exception as err:  # noqa: BLE001
                _LOGGER.error(
                    "Cover %s reverse to %s failed to energize relay %s: %s",
                    cover.id,
                    new_direction,
                    target,
                    err,
                )
                await self._async_cover_halt(cover, reason=COVER_REASON_ERROR)
                return

        duration = cover.duration_for(new_direction)
        motion.direction = new_direction
        motion.duration = duration
        motion.started_at = self._monotonic()
        motion.last_reason = reason
        motion.relays = cover.relay_indexes()
        motion.suppress_stale_off_until = motion.started_at + COVER_POST_START_OFF_GRACE_S
        motion.timer = self.hass.async_create_task(
            self._async_cover_travel_timer(profile.id, cover.id, new_direction, duration)
        )
        self._fire_cover_event(profile, cover, new_direction, reason)
        # Mirror only the final direction — never stop_cover mid-reverse.
        if mirror_ha:
            await self._async_cover_mirror_ha(cover, new_direction)
        self.runtime.async_notify()

    def _resolve_cover(self, profile: Profile, cover_id: str | None) -> CoverConfig:
        """Resolve a cover by id, defaulting to the first active cover on the profile."""
        covers = profile.active_covers() if profile.mode == MODE_MIXED else list(profile.covers)
        if cover_id:
            for cover in covers:
                if cover.id == cover_id:
                    return cover
            # Fall back to full list for clearer errors on stale ids.
            found = profile.cover_by_id(cover_id)
            if found is None:
                raise ValueError(f"Unknown cover id: {cover_id}")
            if profile.mode == MODE_MIXED and found not in covers:
                raise ValueError(f"Cover '{cover_id}' is not bound to mixed cover roles")
            return found
        if not covers:
            raise ValueError("Cover mode requires at least one cover mapping")
        return covers[0]

    async def _async_cover_start(
        self,
        cover: CoverConfig,
        profile: Profile,
        direction: str,
        reason: str,
        *,
        force_energize: bool = False,
        mirror_ha: bool = True,
    ) -> None:
        """Energize one direction. Caller must hold the cover lock.

        Latching-relay hard mutex (Zemismart / Zigbee):
          1. Force only the OPPOSITE direction OFF and confirm.
          2. If the target is already ON (physical press from idle), do not
             pulse it OFF→ON — that chatter drives panels into feedback loops.
          3. Otherwise energize the target once (card/service, or reverse
             after halt when both relays were forced OFF).
          4. ``force_energize`` (stop_then_reverse after settle) always issues
             turn_on even if ``relay_is_on`` still looks stale-ON from the
             physical reverse press that we just halted off.
        Stop / travel-complete / abort still force both relays OFF.
        """
        if profile.mode == MODE_MIXED:
            profile.sync_covers_from_roles()
        motion = self.runtime.cover.get(cover.id)
        target = cover.button_for(direction)
        opposite = cover.button_for(cover.opposite_direction(direction))
        duration = cover.duration_for(direction)

        # Opposite OFF first — never both ON. Do not touch an already-ON target
        # unless this start must re-energize after an intentional halt.
        if not await self._async_cover_relay_off(opposite):
            await self._async_cover_halt(cover, reason=COVER_REASON_ERROR)
            return
        if force_energize or not self.runtime.adapter.relay_is_on(target):
            try:
                await self.runtime.adapter.async_set_relay(target, True, suppress_event=True)
            except Exception as err:  # noqa: BLE001
                _LOGGER.error(
                    "Cover %s %s failed to energize relay %s: %s",
                    cover.id,
                    direction,
                    target,
                    err,
                )
                await self._async_cover_halt(cover, reason=COVER_REASON_ERROR)
                return

        motion.direction = direction
        motion.duration = duration
        motion.started_at = self._monotonic()
        motion.last_reason = reason
        motion.relays = cover.relay_indexes()
        # Only reverse-after-halt needs the stale-OFF grace; idle starts must
        # still treat an immediate latching OFF as a deliberate stop.
        motion.suppress_stale_off_until = (
            motion.started_at + COVER_POST_START_OFF_GRACE_S if force_energize else None
        )
        motion.timer = self.hass.async_create_task(
            self._async_cover_travel_timer(profile.id, cover.id, direction, duration)
        )
        self._fire_cover_event(profile, cover, direction, reason)
        if mirror_ha:
            await self._async_cover_mirror_ha(cover, direction, duration_s=duration)
        self.runtime.async_notify()

    async def _async_cover_travel_timer(
        self, profile_id: str, cover_id: str, direction: str, duration: float
    ) -> None:
        """Force both relays OFF once the configured travel time elapses."""
        try:
            await asyncio.sleep(duration)
        except asyncio.CancelledError:
            raise
        async with self.runtime.cover.lock:
            motion = self.runtime.cover.get(cover_id)
            if not motion.moving or motion.direction != direction:
                return
            # Clear the handle first so the halt below never cancels this task.
            motion.timer = None
            profile = self.data.active_profile()
            cover = None
            if profile is not None and profile.id == profile_id:
                cover = profile.cover_by_id(cover_id)
            if cover is None:
                # Profile changed; still de-energize the remembered pair.
                await self._async_cover_halt_motion(
                    motion, cover=None, reason=COVER_REASON_TRAVEL_COMPLETE
                )
                return
            await self._async_cover_halt(cover, reason=COVER_REASON_TRAVEL_COMPLETE)

    async def _async_cover_halt(
        self,
        cover: CoverConfig | None,
        *,
        reason: str,
        mirror_ha: bool = True,
    ) -> None:
        """Cancel any travel timer and force both direction relays OFF for one cover.

        Caller must hold the cover lock. The relay pair that was last energized
        is always included, so a profile switch mid-travel still de-energizes the
        buttons that are actually wired to the motor.

        ``mirror_ha`` is False during stop_then_reverse transitions so a deferred
        ``cover.stop_cover`` cannot arrive after the reverse ``open/close_cover``
        and kill the newly started direction on linked HA cover entities.
        """
        if cover is None:
            return
        motion = self.runtime.cover.get(cover.id)
        await self._async_cover_halt_motion(
            motion, cover=cover, reason=reason, mirror_ha=mirror_ha
        )

    async def _async_cover_halt_motion(
        self,
        motion: CoverMotion,
        *,
        cover: CoverConfig | None,
        reason: str,
        mirror_ha: bool = True,
    ) -> None:
        """Halt one motion entry. Caller must hold the cover lock.

        Active direction (if known) is forced OFF first so a reverse press
        kills the running motor as fast as possible, then the opposite.
        """
        was_moving = motion.moving
        active_direction = motion.direction
        timer = motion.timer
        indexes: list[int] = []
        for pair in (motion.relays, cover.relay_indexes() if cover is not None else None):
            for index in pair or ():
                if index not in indexes:
                    indexes.append(index)
        # Prefer killing the currently energized direction first.
        if active_direction and cover is not None:
            active_button = cover.button_for(active_direction)
            if active_button in indexes:
                indexes.remove(active_button)
                indexes.insert(0, active_button)
        motion.reset(reason)
        if timer is not None and timer is not asyncio.current_task():
            timer.cancel()
        for index in indexes:
            await self._async_cover_relay_off(index)
        if (
            mirror_ha
            and cover is not None
            and (
                was_moving
                or reason
                in {
                    COVER_REASON_COMMAND,
                    COVER_REASON_STOP_PRESS,
                    COVER_REASON_TRAVEL_COMPLETE,
                }
            )
        ):
            await self._async_cover_mirror_ha(cover, "stop")
        if was_moving or reason in {COVER_REASON_SAFETY, COVER_REASON_ERROR}:
            profile = self.data.active_profile()
            if profile is not None and cover is not None:
                self._fire_cover_event(profile, cover, None, reason)
        self.runtime.async_notify()

    async def _async_cover_abort(self, reason: str) -> None:
        """Stop every cover and de-energize all known direction relays."""
        profile = self.data.active_profile()
        # Mixed mode may keep unused cover timing templates; only role-bound
        # covers are live. Forcing template L1/L2 OFF on every Save Draft was
        # fighting non-cover roles and leaving stale suppressions.
        covers = list(profile.active_covers()) if profile is not None else []
        state = self.runtime.cover
        if (
            not covers
            and not state.moving
            and not any(motion.relays is not None for motion in state.motions.values())
        ):
            state.reset_all(reason)
            return
        async with state.lock:
            # Halt every known motion first so remembered pairs are cleared even
            # when the active profile no longer lists them.
            cover_by_id = {cover.id: cover for cover in covers}
            for cover_id, motion in list(state.motions.items()):
                await self._async_cover_halt_motion(
                    motion,
                    cover=cover_by_id.get(cover_id),
                    reason=reason,
                )
            for cover in covers:
                await self._async_cover_halt(cover, reason=reason)

    async def _async_cover_ensure_pair_off(
        self, cover: CoverConfig, *, prefer_off_first: int | None = None
    ) -> bool:
        """Force both cover direction relays OFF (serialized). Return False on failure.

        ``prefer_off_first`` is written first when present (kill active / opposite
        ASAP). Never turns either relay ON.
        """
        open_i, close_i = cover.relay_indexes()
        order = [open_i, close_i]
        if prefer_off_first in order:
            order.remove(prefer_off_first)
            order.insert(0, prefer_off_first)
        ok = True
        for index in order:
            if not await self._async_cover_relay_off(index):
                ok = False
        return ok

    async def _async_cover_relay_off(self, index: int) -> bool:
        """Force one relay OFF, reporting success without raising."""
        try:
            await self.runtime.adapter.async_set_relay(index, False, suppress_event=True)
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Cover failed to de-energize relay %s: %s", index, err)
            self.data.last_error = f"Cover relay {index} could not be turned off: {err}"
            return False
        return True

    async def _async_cover_mirror_ha(
        self, cover: CoverConfig, command: str, *, duration_s: float | None = None
    ) -> None:
        """Best-effort mirror open/close/stop to an optional linked HA cover entity.

        Motor relay control must not fail when the HA service call fails.

        Reverse transitions must not call ``stop`` here: halt→start already
        settles the relays, and a deferred ``stop_cover`` after ``open/close_cover``
        can turn the linked cover (and any shared switches) back off.

        ``duration_s`` (the panel's own configured travel time for this move)
        scales the echo-suppression window for open/close mirrors so the
        linked entity's own state updates for the whole real move aren't
        reprocessed as new external commands. Without it, a short fixed
        window expires long before travel completes, letting the entity's
        own feedback flap the relay mid-move.
        """
        entity_id = (cover.ha_entity_id or "").strip()
        if not entity_id:
            return
        if command == COVER_DIRECTION_OPEN:
            service = "open_cover"
        elif command == COVER_DIRECTION_CLOSE:
            service = "close_cover"
        else:
            service = "stop_cover"
        try:
            if not self.hass.services.has_service("cover", service):
                _LOGGER.warning(
                    "Cover %s HA mirror skipped: service cover.%s missing for %s",
                    cover.id,
                    service,
                    entity_id,
                )
                return
            await self.hass.services.async_call(
                "cover",
                service,
                {"entity_id": entity_id},
                blocking=False,
            )
            # Suppress live HA→panel echoes of this mirror so open_cover cannot
            # bounce back through the cover entity listener as a second start.
            if command in (COVER_DIRECTION_OPEN, COVER_DIRECTION_CLOSE) and duration_s:
                suppress_s = duration_s + COVER_HA_MIRROR_SUPPRESS_MARGIN_S
            else:
                suppress_s = COVER_HA_MIRROR_SUPPRESS_S
            self._cover_ha_mirror_suppress_until[entity_id] = (
                self._monotonic() + suppress_s
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning(
                "Cover %s HA mirror cover.%s for %s failed: %s",
                cover.id,
                service,
                entity_id,
                err,
            )

    async def _async_cover_settle(self, cover: CoverConfig) -> None:
        """Dead time between directions. Both relays must stay OFF the whole time."""
        # Re-assert pair OFF before and after the wait so settle never bridges
        # a stale ON into the reverse start.
        await self._async_cover_ensure_pair_off(cover)
        if cover.direction_settle_s > 0:
            await asyncio.sleep(cover.direction_settle_s)
        await self._async_cover_ensure_pair_off(cover)

    def _cover_is_usable(self, profile: Profile, cover: CoverConfig) -> bool:
        try:
            if profile.mode == MODE_MIXED:
                profile.sync_covers_from_roles()
                validate_mixed_profile(profile)
                if cover.id not in {item.id for item in profile.active_covers()}:
                    raise ValueError(f"Cover '{cover.id}' is not bound to mixed cover roles")
            else:
                validate_covers(profile.covers, gang_count=profile.gang_count)
                if profile.cover_by_id(cover.id) is None:
                    raise ValueError(f"Unknown cover id: {cover.id}")
        except ValueError as err:
            _LOGGER.error("Cover configuration is unsafe, refusing to move: %s", err)
            return False
        return True

    def _monotonic(self) -> float:
        try:
            return asyncio.get_running_loop().time()
        except RuntimeError:  # pragma: no cover - defensive outside the loop
            return 0.0

    def _fire_cover_event(
        self,
        profile: Profile,
        cover: CoverConfig,
        direction: str | None,
        reason: str,
    ) -> None:
        motion = self.runtime.cover.get(cover.id)
        self.hass.bus.async_fire(
            EVENT_COVER_STATE,
            {
                "entry_id": self.runtime.entry.entry_id,
                "panel_id": self.runtime.mapping.panel_name,
                "profile_id": profile.id,
                "cover_id": cover.id,
                "state": direction or "idle",
                "reason": reason,
                "open_button": cover.open_button,
                "close_button": cover.close_button,
                "duration": motion.duration,
            },
        )

    def cover_state_payload(self, cover_id: str | None = None) -> dict[str, Any]:
        """Return live cover motion state for the card.

        When ``cover_id`` is set, top-level fields mirror that cover. Otherwise
        they mirror the first moving cover, else the first configured cover.
        """
        profile = self.data.active_profile()
        covers = (
            list(profile.covers)
            if profile is not None and profile.mode in {MODE_COVER, MODE_MIXED}
            else []
        )
        cover_states: list[dict[str, Any]] = []
        for cover in covers:
            motion = self.runtime.cover.get(cover.id)
            cover_states.append(
                {
                    "id": cover.id,
                    "state": motion.direction or "idle",
                    "direction": motion.direction,
                    "duration": motion.duration,
                    "reason": motion.last_reason,
                    "open_button": cover.open_button,
                    "close_button": cover.close_button,
                }
            )

        selected: dict[str, Any] | None = None
        if cover_id:
            selected = next((item for item in cover_states if item["id"] == cover_id), None)
        if selected is None:
            selected = next((item for item in cover_states if item["direction"]), None)
        if selected is None and cover_states:
            selected = cover_states[0]

        return {
            "active": bool(
                profile is not None
                and (
                    profile.mode == MODE_COVER
                    or (profile.mode == MODE_MIXED and bool(profile.all_cover_relay_indexes()))
                )
            ),
            "state": (selected or {}).get("state", "idle"),
            "direction": (selected or {}).get("direction"),
            "duration": (selected or {}).get("duration"),
            "reason": (selected or {}).get("reason"),
            "cover_id": (selected or {}).get("id"),
            "covers": cover_states,
        }

    async def _async_route_button_action(
        self, profile: Profile, index: int, new_relay_state: bool
    ) -> None:
        """Run the button HA action, deferring when multi-click slots are set.

        Hardware mode engines (radio exclusivity, momentary pulse, cover) still
        react immediately to each physical edge. Only the configured
        Home Assistant action is classified as single / double. On double,
        the relay is restored to pre-gesture state before ``action_double``.
        """
        button = profile.button_by_index(index)
        if button_has_multi_click(button):
            await self._async_multi_click_note(profile, index, new_relay_state)
            return
        await self._async_execute_button_action(
            profile, index, new_relay_state, click_count=1
        )

    def _multi_click_abort(self) -> None:
        """Drop every pending multi-click timer without firing actions."""
        self.runtime.multiclick.cancel_all()

    def _multi_click_radio_members(self, profile: Profile, index: int) -> list[int]:
        """Radio exclusivity group for a button, or empty when not a radio member."""
        if profile.mode == MODE_RADIO_SPLIT or (
            profile.mode == MODE_MIXED and profile.button_role(index) == BUTTON_ROLE_RADIO
        ):
            group = profile.radio_group_for(index)
            return list(group.buttons) if group is not None else []
        if profile.mode in {MODE_RADIO_MANDATORY, MODE_RADIO_OPTIONAL} and profile.is_radio_member(
            index
        ):
            return list(profile.radio_member_indexes())
        return []

    def _snapshot_radio_pre_states(
        self, profile: Profile, index: int, pre_relay_state: bool
    ) -> dict[int, bool] | None:
        """Capture radio-group relay states as they were before click 1."""
        members = self._multi_click_radio_members(profile, index)
        if not members:
            return None
        states: dict[int, bool] = {}
        for member in members:
            if member == index:
                states[member] = pre_relay_state
                continue
            try:
                states[member] = bool(self.runtime.adapter.relay_is_on(member))
            except Exception:  # noqa: BLE001
                states[member] = False
        return states

    async def _async_multi_click_restore_relay(
        self,
        profile: Profile,
        index: int,
        pre_relay_state: bool | None,
        pre_radio_states: dict[int, bool] | None,
    ) -> None:
        """Rewrite relays to the pre-gesture snapshot with transition suppression."""
        if pre_relay_state is None:
            return
        if not should_restore_relay_after_double(profile, index):
            return
        try:
            if pre_radio_states:
                for member, state in sorted(pre_radio_states.items()):
                    await self.runtime.adapter.async_set_relay(
                        member, state, suppress_event=True
                    )
                if profile.mode in {MODE_RADIO_MANDATORY, MODE_RADIO_OPTIONAL}:
                    on_member = next(
                        (member for member, state in pre_radio_states.items() if state),
                        None,
                    )
                    if on_member is not None and profile.selected_button != on_member:
                        profile.selected_button = on_member
                        await self.runtime.store.async_save()
            else:
                await self.runtime.adapter.async_set_relay(
                    index, pre_relay_state, suppress_event=True
                )
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Double-click relay restore failed for button %s: %s", index, err)
        self.runtime.async_notify()

    async def _async_multi_click_note(
        self, profile: Profile, index: int, new_relay_state: bool
    ) -> None:
        """Count one unsuppressed edge toward a deferred multi-click gesture."""
        token = pending_token()
        gap_s = self.runtime.multiclick.gap_s
        async with self.runtime.multiclick.lock:
            entry = self.runtime.multiclick.pending.get(index)
            if entry is None:
                entry = MultiClickPending()
                self.runtime.multiclick.pending[index] = entry
            if entry.handle is not None and not entry.handle.cancelled():
                entry.handle.cancel()
            is_first = entry.count == 0
            if is_first:
                # First edge already flipped hardware; snapshot state prior to click 1.
                entry.pre_relay_state = not new_relay_state
                entry.pre_radio_states = self._snapshot_radio_pre_states(
                    profile, index, entry.pre_relay_state
                )
            entry.count = min(entry.count + 1, MULTI_CLICK_MAX)
            entry.last_relay_state = new_relay_state
            entry.profile_id = profile.id
            entry.token = token
            loop = getattr(self.hass, "loop", None) or asyncio.get_running_loop()

            @callback
            def _fire(_now: Any = None) -> None:
                self.hass.async_create_task(self._async_multi_click_finalize(index, token))

            entry.handle = loop.call_later(gap_s, _fire)

    async def _async_multi_click_finalize(self, index: int, token: object) -> None:
        """Fire the action matching the finalized click count for one button."""
        async with self.runtime.multiclick.lock:
            entry = self.runtime.multiclick.pending.get(index)
            if entry is None or entry.token is not token:
                return
            count = classify_click_count(entry.count)
            relay_state = entry.last_relay_state
            pre_relay_state = entry.pre_relay_state
            pre_radio_states = (
                dict(entry.pre_radio_states) if entry.pre_radio_states else None
            )
            profile_id = entry.profile_id
            self.runtime.multiclick.cancel(index)

        if self.runtime.unloading:
            return
        profile = self.data.active_profile()
        if profile is None or profile.id != profile_id:
            return
        if count == CLICK_COUNT_DOUBLE:
            await self._async_multi_click_restore_relay(
                profile, index, pre_relay_state, pre_radio_states
            )
            if pre_relay_state is not None and should_restore_relay_after_double(
                profile, index
            ):
                relay_state = pre_relay_state
        await self._async_execute_button_action(
            profile, index, relay_state, click_count=count
        )

    async def _async_execute_button_action(
        self,
        profile: Profile,
        index: int,
        new_relay_state: bool,
        *,
        click_count: int = 1,
    ) -> None:
        button = next((item for item in profile.buttons if item.index == index), None)
        if button is None:
            return
        classified = classify_click_count(click_count)
        action = action_for_click_count(button, classified)
        if action is not None:
            try:
                await self._async_run_action(action)
            except ActionExecutionError as err:
                _LOGGER.error("Button action failed (click_count=%s): %s", classified, err)
        self.hass.bus.async_fire(
            EVENT_BUTTON_PRESS,
            {
                "entry_id": self.runtime.entry.entry_id,
                "panel_id": self.runtime.mapping.panel_name,
                "profile_id": profile.id,
                "button": index,
                "button_name": button.name,
                "mode": profile.mode,
                "new_relay_state": "on" if new_relay_state else "off",
                ATTR_CLICK_COUNT: classified,
            },
        )

    async def _async_run_action(self, action: ButtonAction) -> None:
        if "." not in action.action:
            raise ActionExecutionError(f"Invalid action: {action.action}")
        domain, service = action.action.split(".", 1)
        if not self.hass.services.has_service(domain, service):
            raise ActionExecutionError(f"Service does not exist: {action.action}")
        service_data = dict(action.data)
        target = dict(action.target)
        if "entity_id" in target and "entity_id" not in service_data:
            service_data["entity_id"] = target["entity_id"]
        try:
            await self.hass.services.async_call(
                domain,
                service,
                service_data,
                blocking=True,
            )
        except Exception as err:  # noqa: BLE001
            raise ActionExecutionError(str(err)) from err

    async def async_sync(self) -> None:
        """Sync active profile draft to hardware."""
        if self.runtime.sync_lock.locked():
            raise SyncInProgressError("A sync operation is already running")
        async with self.runtime.sync_lock:
            profile = self.data.active_profile()
            if profile is None:
                raise ProfileNotFoundError("No active profile")
            # Never rewrite relays while a motor or pulse is running.
            await self._async_cover_abort(COVER_REASON_ABORT)
            await self._async_momentary_abort()
            self._multi_click_abort()
            self.data.sync_status = SYNC_SYNCING  # type: ignore[assignment]
            self.data.last_error = None
            self.runtime.async_notify()
            try:
                result = await asyncio.wait_for(
                    self.runtime.adapter.async_apply_profile(profile),
                    timeout=self.runtime.sync_timeout,
                )
            except TimeoutError:
                result = SyncResult(
                    success=False,
                    error=f"Sync timed out after {self.runtime.sync_timeout:.0f}s",
                    confirmed_steps=[],
                )
            if result.success:
                self.data.applied_snapshot = profile.to_dict()
                self.data.last_sync = datetime.now(UTC).isoformat()
                self.data.last_error = None
                self.data.sync_status = SYNC_SYNCED  # type: ignore[assignment]
            else:
                self.data.last_error = result.error
                self.data.sync_status = SYNC_ERROR  # type: ignore[assignment]
            await self.runtime.store.async_save()
            self._rebuild_entity_relay_listeners()
            self.runtime.async_notify()
            if not result.success:
                raise RuntimeError(result.error or "Sync failed")

    async def async_pull_from_panel(self) -> None:
        """Pull hardware state into the active profile draft."""
        profile = self.data.active_profile()
        if profile is None:
            raise ProfileNotFoundError("No active profile")
        hardware = await self.runtime.adapter.async_read_hardware_state()
        drifted = self._hardware_differs_from_snapshot(hardware)
        for button, name in zip(profile.buttons, hardware.names, strict=True):
            button.name = name
        profile.color_on = hardware.color_on or profile.color_on
        profile.color_off = hardware.color_off or profile.color_off
        profile.radar = hardware.radar or profile.radar
        profile.backlight = hardware.backlight
        if hardware.backlight_brightness is not None:
            profile.backlight_brightness = hardware.backlight_brightness
        profile.child_lock = hardware.child_lock
        if profile.mode in {MODE_RADIO_MANDATORY, MODE_RADIO_OPTIONAL}:
            members = set(profile.radio_member_indexes())
            on_indexes = [
                index + 1
                for index, value in enumerate(hardware.relays)
                if value and (index + 1) in members
            ]
            profile.selected_button = on_indexes[0] if on_indexes else None
        if drifted:
            self.data.sync_status = SYNC_OUT_OF_SYNC  # type: ignore[assignment]
        else:
            self.data.refresh_pending_status()
        await self.runtime.store.async_save()
        self.runtime.async_notify()

    def _hardware_differs_from_snapshot(self, hardware: HardwareState) -> bool:
        """Return True when hardware settings differ from the last applied snapshot."""
        snapshot = self.data.applied_snapshot
        if not snapshot:
            return False
        buttons = sorted(snapshot.get("buttons") or [], key=lambda item: item.get("index", 0))
        snapshot_names = tuple(str(button.get("name") or "") for button in buttons)
        if len(snapshot_names) != BUTTON_COUNT:
            snapshot_names = (snapshot_names + ("", "", "", ""))[:BUTTON_COUNT]
        brightness_differs = False
        if hardware.backlight_brightness is not None and "backlight_brightness" in snapshot:
            brightness_differs = int(hardware.backlight_brightness) != int(
                snapshot.get("backlight_brightness") or 0
            )
        return (
            hardware.names != snapshot_names
            or hardware.color_on != snapshot.get("color_on")
            or hardware.color_off != snapshot.get("color_off")
            or hardware.radar != snapshot.get("radar")
            or bool(hardware.backlight) != bool(snapshot.get("backlight"))
            or brightness_differs
            or bool(hardware.child_lock) != bool(snapshot.get("child_lock"))
        )

    async def async_activate_profile(self, profile_id: str, *, sync: bool = False) -> None:
        """Activate a profile, optionally syncing immediately."""
        if profile_id not in self.data.profiles:
            raise ProfileNotFoundError(profile_id)
        changed = profile_id != self.data.active_profile_id
        if changed:
            # Stop engines on the outgoing profile, then switch and safe-start
            # the incoming one so latched leftovers cannot swallow the first press.
            await self._async_cover_abort(COVER_REASON_ABORT)
            await self._async_momentary_abort()
            self._multi_click_abort()
            self.data.active_profile_id = profile_id
            await self._async_cover_abort(COVER_REASON_ABORT)
            await self._async_momentary_abort()
            self._multi_click_abort()
        self.data.refresh_pending_status()
        await self.runtime.store.async_save()
        self._rebuild_entity_relay_listeners()
        self.runtime.async_notify()
        if sync or self.runtime.auto_sync:
            await self.async_sync()

    async def async_create_profile(self, payload: dict[str, Any]) -> Profile:
        """Create a profile from validated payload."""
        profile = Profile.from_dict(payload)
        if profile.id in self.data.profiles:
            raise ValueError(f"Profile already exists: {profile.id}")
        self._validate_profile_actions(profile)
        self.data.profiles[profile.id] = profile
        if not self.data.active_profile_id:
            self.data.active_profile_id = profile.id
        self.data.refresh_pending_status()
        await self._async_after_draft_change()
        return profile

    async def async_update_profile(self, profile_id: str, payload: dict[str, Any]) -> Profile:
        """Update an existing profile draft."""
        if profile_id not in self.data.profiles:
            raise ProfileNotFoundError(profile_id)
        payload = dict(payload)
        payload["id"] = profile_id
        profile = Profile.from_dict(payload)
        self._validate_profile_actions(profile)
        # Persist first, then reset engines against the *saved* active profile.
        # Abort-before-store used the previous draft, so a newly assigned
        # momentary/cover role could stay latched ON — the next physical press
        # produced no state change and looked dead.
        self.data.profiles[profile_id] = profile
        if profile_id == self.data.active_profile_id:
            await self._async_cover_abort(COVER_REASON_ABORT)
            await self._async_momentary_abort()
            self._multi_click_abort()
        self.data.refresh_pending_status()
        await self._async_after_draft_change()
        return profile

    def _validate_profile_actions(self, profile: Profile) -> None:
        """Validate mode and action service existence when practical."""
        if profile.mode not in SUPPORTED_MODES:
            raise ValueError(f"Unsupported mode: {profile.mode}")
        if profile.mode == MODE_RADIO_SPLIT:
            validate_radio_groups(profile.radio_groups)
        if profile.mode == MODE_MIXED:
            validate_mixed_profile(profile)
        if profile.mode == MODE_COVER:
            validate_covers(profile.covers, gang_count=profile.gang_count)
        for button in profile.buttons:
            action = button.action
            if action is None:
                continue
            if "." not in action.action:
                raise ValueError(f"Invalid action on button {button.index}: {action.action}")
            domain, service = action.action.split(".", 1)
            if not self.hass.services.has_service(domain, service):
                raise ValueError(
                    f"Service does not exist for button {button.index}: {action.action}"
                )

    def _scheduler_tasks_referencing_profile(self, profile_id: str) -> list[SchedulerTask]:
        """Local + master tasks that reference ``profile_id`` in any range."""
        blocking: list[SchedulerTask] = []
        for task in self._effective_scheduler_tasks():
            if any(rng.profile_id == profile_id for rng in task.ranges):
                blocking.append(task)
        return blocking

    async def async_delete_profile(self, profile_id: str) -> None:
        """Delete a profile draft.

        Blocks when this is the last profile or when any scheduler task (local or
        master targeting this panel) still references the profile. Active and
        default profile ids are reassigned to a remaining profile when needed.
        """
        if profile_id not in self.data.profiles:
            raise ProfileNotFoundError(profile_id)
        if len(self.data.profiles) <= 1:
            raise ValueError("At least one profile must remain")
        blocking = self._scheduler_tasks_referencing_profile(profile_id)
        if blocking:
            labels: list[str] = []
            seen: set[str] = set()
            for task in blocking:
                label = (task.name or "").strip() or task.id
                if label in seen:
                    continue
                seen.add(label)
                labels.append(label)
            raise ValueError(
                "Cannot delete profile "
                f"'{profile_id}': used by scheduler task(s): {', '.join(labels)}"
            )
        if profile_id == self.data.active_profile_id:
            await self._async_cover_abort(COVER_REASON_ABORT)
            await self._async_momentary_abort()
            self._multi_click_abort()
        del self.data.profiles[profile_id]
        if self.data.active_profile_id == profile_id:
            self.data.active_profile_id = next(iter(self.data.profiles))
        if self.data.default_profile_id == profile_id:
            self.data.default_profile_id = self.data.active_profile_id
        elif (
            self.data.default_profile_id
            and self.data.default_profile_id not in self.data.profiles
        ):
            self.data.default_profile_id = self.data.active_profile_id
        self.data.refresh_pending_status()
        await self._async_after_draft_change()
        await self.async_scheduler_tick(reason="profile_delete")

    async def async_duplicate_profile(
        self, profile_id: str, new_id: str, new_name: str | None = None
    ) -> Profile:
        """Duplicate an existing profile with optional custom display name."""
        source = self.data.profiles.get(profile_id)
        if source is None:
            raise ProfileNotFoundError(profile_id)
        cleaned_id = (new_id or "").strip()
        if not cleaned_id:
            raise ValueError("new_id is required")
        if cleaned_id in self.data.profiles:
            raise ValueError(f"Profile already exists: {cleaned_id}")
        profile = source.clone(cleaned_id, new_name)
        self.data.profiles[cleaned_id] = profile
        self.data.refresh_pending_status()
        await self._async_after_draft_change()
        return profile

    def export_profiles(self) -> dict[str, Any]:
        """Return a portable JSON payload of stored profiles.

        Scope is profiles + active_profile_id only. Scheduler tasks,
        ``default_profile_id``, holiday flags, and ``applied_snapshot`` are
        intentionally excluded — use ``export_scheduler`` for schedules.
        """
        return {
            "schema_version": PROFILES_EXPORT_SCHEMA_VERSION,
            "active_profile_id": self.data.active_profile_id,
            "profiles": {key: profile.to_dict() for key, profile in self.data.profiles.items()},
        }

    @staticmethod
    def profiles_export_schema_accepted(schema_version: int) -> bool:
        """Whether a profiles-export ``schema_version`` can be imported."""
        if schema_version < 1:
            return False
        if schema_version <= PROFILES_EXPORT_SCHEMA_VERSION:
            return True
        return schema_version in PROFILES_EXPORT_LEGACY_STORAGE_SCHEMA_VERSIONS

    @staticmethod
    def normalize_import_profiles(raw_profiles: Any) -> dict[str, Any]:
        """Normalize profiles object/list into an id→profile mapping."""
        if isinstance(raw_profiles, dict):
            if not raw_profiles:
                raise ValueError("Import payload must include a non-empty profiles object")
            return raw_profiles
        if isinstance(raw_profiles, list):
            if not raw_profiles:
                raise ValueError("Import payload must include a non-empty profiles object")
            normalized: dict[str, Any] = {}
            for index, item in enumerate(raw_profiles):
                if not isinstance(item, dict):
                    raise ValueError(f"Invalid profile payload at index {index}")
                profile_id = str(item.get("id") or "").strip()
                if not profile_id:
                    raise ValueError(f"Profile at index {index} is missing id")
                normalized[profile_id] = item
            return normalized
        raise ValueError("Import payload must include a non-empty profiles object")

    async def async_import_profiles(
        self, payload: dict[str, Any], *, mode: str = "merge"
    ) -> dict[str, Any]:
        """Import profiles from a portable JSON payload.

        mode=merge updates/adds by profile id.
        mode=replace replaces the full profile set (at least one profile required).

        Expected portable file shape (same as export_profiles / card download)::

            {
              "schema_version": 2,
              "active_profile_id": "lighting",
              "profiles": {
                "lighting": { "id": "lighting", "name": "...", ... }
              }
            }

        Files that mistakenly stamped panel ``STORAGE_VERSION`` (3–5) into
        ``schema_version`` are accepted when they still carry a ``profiles``
        object (card export bug / raw storage dump with profiles). Scheduler,
        holiday, and snapshot fields in such dumps are ignored here.
        """
        if mode not in {"merge", "replace"}:
            raise ValueError(f"Unsupported import mode: {mode}")
        if not isinstance(payload, dict):
            raise ValueError("Import payload must be an object")

        schema_version = payload.get("schema_version", PROFILES_EXPORT_SCHEMA_VERSION)
        try:
            schema_version_int = int(schema_version)
        except (TypeError, ValueError) as err:
            raise ValueError("schema_version must be an integer") from err
        if not self.profiles_export_schema_accepted(schema_version_int):
            raise ValueError(
                f"Unsupported export schema_version {schema_version_int}; "
                f"current is {PROFILES_EXPORT_SCHEMA_VERSION}"
            )

        raw_profiles = self.normalize_import_profiles(payload.get("profiles"))

        imported: dict[str, Profile] = {}
        for profile_id, raw in raw_profiles.items():
            if not isinstance(raw, dict):
                raise ValueError(f"Invalid profile payload for {profile_id}")
            data = dict(raw)
            data["id"] = str(data.get("id") or profile_id)
            profile = Profile.from_dict(data)
            self._validate_profile_actions(profile)
            imported[profile.id] = profile

        await self._async_cover_abort(COVER_REASON_ABORT)
        await self._async_momentary_abort()
        self._multi_click_abort()
        if mode == "replace":
            self.data.profiles = imported
        else:
            self.data.profiles.update(imported)

        requested_active = payload.get("active_profile_id")
        if isinstance(requested_active, str) and requested_active in self.data.profiles:
            self.data.active_profile_id = requested_active
        elif self.data.active_profile_id not in self.data.profiles:
            self.data.active_profile_id = next(iter(self.data.profiles))

        self.data.refresh_pending_status()
        await self._async_after_draft_change()
        return self.get_config_payload()

    def export_scheduler(self) -> dict[str, Any]:
        """Return a portable JSON payload of this panel's scheduler configuration.

        Includes local tasks, ``default_profile_id``, and master tasks that
        target this entry. Holiday mode is domain-global and intentionally
        excluded (documented in ``notes``).
        """
        entry_id = self.runtime.entry.entry_id
        masters = {
            task.id: task.to_dict()
            for task in self._master_tasks_for_this_entry()
        }
        return {
            "schema_version": SCHEDULER_EXPORT_SCHEMA_VERSION,
            "scope": EXPORT_SCOPE_SCHEDULER,
            "entry_id": entry_id,
            "default_profile_id": self.data.default_profile_id,
            "scheduler_tasks": {
                key: task.to_dict() for key, task in self.data.scheduler_tasks.items()
            },
            "master_scheduler_tasks": masters,
            "notes": (
                "Holiday mode is domain-global and is not included in scheduler "
                "exports. Profiles and button mappings are not included — only "
                "profile_id references. On import, unknown profile_ids are "
                "skipped with warnings. Replace mode replaces local tasks only; "
                "master tasks in the file are merged/updated by id."
            ),
        }

    @staticmethod
    def normalize_import_scheduler_tasks(raw_tasks: Any) -> dict[str, Any]:
        """Normalize scheduler_tasks object/list into an id→task mapping."""
        if raw_tasks is None:
            return {}
        if isinstance(raw_tasks, dict):
            return raw_tasks
        if isinstance(raw_tasks, list):
            normalized: dict[str, Any] = {}
            for index, item in enumerate(raw_tasks):
                if not isinstance(item, dict):
                    raise ValueError(f"Invalid scheduler task payload at index {index}")
                task_id = str(item.get("id") or "").strip()
                if not task_id:
                    raise ValueError(f"Scheduler task at index {index} is missing id")
                normalized[task_id] = item
            return normalized
        raise ValueError("scheduler_tasks must be an object or array")

    def _filter_task_ranges_for_profiles(
        self,
        task: SchedulerTask,
        *,
        known_profiles: set[str],
        warnings: list[str],
    ) -> SchedulerTask | None:
        """Drop ranges whose profile_id is missing; skip task if none remain."""
        kept = [rng for rng in task.ranges if rng.profile_id in known_profiles]
        skipped = [rng.profile_id for rng in task.ranges if rng.profile_id not in known_profiles]
        if skipped:
            warnings.append(
                f"Task '{task.id}': skipped ranges with unknown profile_id(s): "
                + ", ".join(sorted(set(skipped)))
            )
        if not kept:
            warnings.append(f"Task '{task.id}' skipped: no ranges with known profiles")
            return None
        data = task.to_dict()
        data["ranges"] = [rng.to_dict() for rng in kept]
        return SchedulerTask.from_dict(data)

    def _known_panel_entry_ids(self) -> set[str]:
        """Return entry_ids of loaded panel coordinators."""
        return {item.runtime.entry.entry_id for item in self._iter_panel_coordinators()}

    def _master_entry_ids_for_import(
        self,
        raw_entry_ids: list[str],
        *,
        warnings: list[str],
        task_id: str,
    ) -> list[str]:
        """Keep existing panels from the payload and always include this entry."""
        current = self.runtime.entry.entry_id
        known = self._known_panel_entry_ids()
        kept = sorted({eid for eid in raw_entry_ids if eid in known})
        dropped = sorted({eid for eid in raw_entry_ids if eid not in known})
        if dropped:
            warnings.append(
                f"Master task '{task_id}': dropped unknown entry_id(s): "
                + ", ".join(dropped)
            )
        if current not in kept:
            kept.append(current)
            kept = sorted(set(kept))
        return kept

    async def async_import_scheduler(
        self, payload: dict[str, Any], *, mode: str = "merge"
    ) -> dict[str, Any]:
        """Import scheduler tasks from a portable JSON payload.

        mode=merge upserts local and master tasks by id.
        mode=replace replaces this entry's local tasks entirely; master tasks
        present in the file are still merged/updated (domain-wide masters are
        never wiped by a single-panel replace).

        Holiday mode is never imported. Unknown profile_ids are skipped with
        warnings. Static time conflicts reject the whole import.
        """
        if mode not in {"merge", "replace"}:
            raise ValueError(f"Unsupported import mode: {mode}")
        if not isinstance(payload, dict):
            raise ValueError("Import payload must be an object")

        scope = str(payload.get("scope") or EXPORT_SCOPE_SCHEDULER).strip().lower()
        if scope and scope != EXPORT_SCOPE_SCHEDULER:
            raise ValueError(
                f"Unsupported export scope '{scope}'; expected '{EXPORT_SCOPE_SCHEDULER}'"
            )

        schema_version = payload.get("schema_version", SCHEDULER_EXPORT_SCHEMA_VERSION)
        try:
            schema_version_int = int(schema_version)
        except (TypeError, ValueError) as err:
            raise ValueError("schema_version must be an integer") from err
        if schema_version_int < 1:
            raise ValueError("schema_version must be a positive integer")
        if schema_version_int > SCHEDULER_EXPORT_SCHEMA_VERSION:
            raise ValueError(
                f"Unsupported scheduler export schema_version {schema_version_int}; "
                f"current is {SCHEDULER_EXPORT_SCHEMA_VERSION}"
            )

        warnings: list[str] = []
        known_profiles = set(self.data.profiles)
        raw_local = self.normalize_import_scheduler_tasks(payload.get("scheduler_tasks"))
        raw_master = self.normalize_import_scheduler_tasks(
            payload.get("master_scheduler_tasks")
        )

        imported_local: dict[str, SchedulerTask] = {}
        for task_id, raw in raw_local.items():
            if not isinstance(raw, dict):
                raise ValueError(f"Invalid scheduler task payload for {task_id}")
            data = dict(raw)
            data["id"] = str(data.get("id") or task_id)
            data["scope"] = SCHEDULER_SCOPE_LOCAL
            data["entry_ids"] = []
            try:
                task = SchedulerTask.from_dict(data)
            except ValueError as err:
                warnings.append(f"Local task '{data['id']}' skipped: {err}")
                continue
            filtered = self._filter_task_ranges_for_profiles(
                task, known_profiles=known_profiles, warnings=warnings
            )
            if filtered is None:
                continue
            imported_local[filtered.id] = filtered

        imported_master: dict[str, SchedulerTask] = {}
        for task_id, raw in raw_master.items():
            if not isinstance(raw, dict):
                raise ValueError(f"Invalid master scheduler task payload for {task_id}")
            data = dict(raw)
            data["id"] = str(data.get("id") or task_id)
            data["scope"] = SCHEDULER_SCOPE_MASTER
            raw_ids = data.get("entry_ids") or []
            if not isinstance(raw_ids, list):
                raise ValueError(f"Master task '{data['id']}' entry_ids must be a list")
            data["entry_ids"] = self._master_entry_ids_for_import(
                [str(item).strip() for item in raw_ids if str(item).strip()],
                warnings=warnings,
                task_id=str(data["id"]),
            )
            try:
                task = SchedulerTask.from_dict(data)
            except ValueError as err:
                warnings.append(f"Master task '{data['id']}' skipped: {err}")
                continue
            # Validate profile_ids on every targeted panel that is loaded.
            missing_on: list[str] = []
            for entry_id in list(task.entry_ids):
                coordinator = next(
                    (
                        item
                        for item in self._iter_panel_coordinators()
                        if item.runtime.entry.entry_id == entry_id
                    ),
                    None,
                )
                if coordinator is None:
                    continue
                for rng in task.ranges:
                    if rng.profile_id not in coordinator.data.profiles:
                        missing_on.append(f"{rng.profile_id}@{entry_id}")
            if missing_on:
                # Keep only panels where every range profile exists.
                valid_entries: list[str] = []
                for entry_id in task.entry_ids:
                    coordinator = next(
                        (
                            item
                            for item in self._iter_panel_coordinators()
                            if item.runtime.entry.entry_id == entry_id
                        ),
                        None,
                    )
                    if coordinator is None:
                        continue
                    if all(
                        rng.profile_id in coordinator.data.profiles for rng in task.ranges
                    ):
                        valid_entries.append(entry_id)
                if self.runtime.entry.entry_id not in valid_entries:
                    warnings.append(
                        f"Master task '{task.id}' skipped: profile_id(s) missing on "
                        f"this panel ({', '.join(sorted(set(missing_on)))})"
                    )
                    continue
                if set(valid_entries) != set(task.entry_ids):
                    warnings.append(
                        f"Master task '{task.id}': limited entry_ids to panels with "
                        f"matching profiles: {', '.join(valid_entries)}"
                    )
                task = SchedulerTask.from_dict(
                    {**task.to_dict(), "entry_ids": valid_entries}
                )
            imported_master[task.id] = task

        if mode == "replace":
            proposed_local = dict(imported_local)
        else:
            proposed_local = dict(self.data.scheduler_tasks)
            proposed_local.update(imported_local)

        store = await async_get_master_store(self.hass)
        # Build the master view as it would look after upserts for conflict checks
        # on this entry (other masters that still target this entry remain).
        proposed_masters_for_entry: dict[str, SchedulerTask] = {
            task.id: task
            for task in store.tasks_for_entry(self.runtime.entry.entry_id)
            if task.id not in imported_master
        }
        for task in imported_master.values():
            if self.runtime.entry.entry_id in task.entry_ids:
                proposed_masters_for_entry[task.id] = task

        validate_tasks_no_conflicts(
            [*proposed_local.values(), *proposed_masters_for_entry.values()]
        )

        # Conflict-check other panels affected by imported masters.
        other_entries: set[str] = set()
        for task in imported_master.values():
            for entry_id in task.entry_ids:
                if entry_id != self.runtime.entry.entry_id:
                    other_entries.add(entry_id)
        for entry_id in other_entries:
            combined = [
                item
                for item in self._tasks_for_entry_validation(entry_id)
                if item.id not in imported_master
            ]
            for task in imported_master.values():
                if entry_id in task.entry_ids:
                    combined.append(task)
            validate_tasks_no_conflicts(combined)

        previous_local_ids = set(self.data.scheduler_tasks)
        previous_master_ids = set(store.tasks)

        self.data.scheduler_tasks = proposed_local

        requested_default = payload.get("default_profile_id")
        if isinstance(requested_default, str) and requested_default.strip():
            default_id = requested_default.strip()
            if default_id in self.data.profiles:
                self.data.default_profile_id = default_id
            else:
                warnings.append(
                    f"default_profile_id '{default_id}' not found; left unchanged"
                )

        for task in imported_master.values():
            await store.async_upsert(task)

        await self.runtime.store.async_save()

        new_local_ids = set(self.data.scheduler_tasks)
        for removed in previous_local_ids - new_local_ids:
            await self._async_call_scheduler_entity_remover(
                self._scheduler_entity_remover, removed
            )
        for added in new_local_ids - previous_local_ids:
            if self._scheduler_entity_adder is not None:
                self._scheduler_entity_adder(added)

        for task_id in imported_master:
            if task_id not in previous_master_ids and self._master_entity_adder is not None:
                self._master_entity_adder(task_id)

        self._rebuild_scheduler_condition_listeners()
        affected = {self.runtime.entry.entry_id}
        for task in imported_master.values():
            affected.update(task.entry_ids)
        await self._async_tick_entries(sorted(affected), reason="scheduler_import")
        self.runtime.async_notify()

        result = self.get_config_payload()
        result["scheduler_import_warnings"] = warnings
        return result

    async def _async_after_draft_change(self) -> None:
        if self.data.sync_status != SYNC_SYNCING:
            self.data.sync_status = (
                SYNC_SYNCED if self.data.draft_matches_snapshot() else SYNC_PENDING
            )  # type: ignore[assignment]
        await self.runtime.store.async_save()
        self._rebuild_entity_relay_listeners()
        self.runtime.async_notify()
        if self.runtime.auto_sync and self.data.sync_status == SYNC_PENDING:
            await self.async_sync()

    def _relay_currently_on(self, index: int) -> bool | None:
        """Return mapped relay on/off, or None when unknown."""
        states = self._relay_states_payload()
        if index < 1 or index > len(states):
            return None
        return states[index - 1]

    async def async_execute_button(self, button: int) -> None:
        """Simulate a physical press from the card or service (drives hardware).

        Physical presses arrive as relay state transitions; card/service presses
        must flip/drive the relay first, then run the same engines so the panel
        and HA actions stay in sync. Never mutates the editor draft.
        """
        profile = self.data.active_profile()
        if profile is None:
            raise ProfileNotFoundError("No active profile")
        if button < 1 or button > BUTTON_COUNT:
            raise ValueError("Button must be 1-4")
        if button > int(profile.gang_count or BUTTON_COUNT):
            raise ValueError(f"Button {button} is outside gang_count {profile.gang_count}")
        await self._async_virtual_press(profile, button)

    async def _async_virtual_press(self, profile: Profile, index: int) -> None:
        """Drive hardware then run the same press path as a physical transition."""
        if profile.mode == MODE_COVER and profile.is_cover_button(index):
            # Cover engine owns both direction relays.
            await self._async_cover_press(profile, index, True)
            return
        if profile.mode == MODE_MIXED:
            await self._async_virtual_mixed_press(profile, index)
            return
        if profile.mode == MODE_TOGGLE:
            await self._async_virtual_toggle_press(profile, index)
            return
        if profile.mode == MODE_RADIO_SPLIT:
            await self._async_virtual_radio_split_press(profile, index)
            return
        if not profile.is_radio_member(index):
            await self._async_virtual_toggle_press(profile, index)
            return
        if profile.mode in {MODE_RADIO_MANDATORY, MODE_RADIO_OPTIONAL}:
            await self._async_virtual_radio_press(profile, index)
            return

    async def _async_virtual_toggle_press(self, profile: Profile, index: int) -> None:
        """Flip the relay (like a latching physical press) then run the action."""
        current = self._relay_currently_on(index)
        new_state = True if current is None else (not current)
        try:
            await self.runtime.adapter.async_set_relay(index, new_state, suppress_event=True)
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Virtual toggle failed for button %s: %s", index, err)
            raise
        await self._async_route_button_action(profile, index, new_state)
        self.runtime.async_notify()

    async def _async_virtual_radio_press(self, profile: Profile, index: int) -> None:
        """Select a classic radio member: energize it, exclusivity, then action."""
        current = self._relay_currently_on(index)
        if profile.selected_button == index and current is True:
            # Classic radio: re-pressing the selected member is a no-op.
            return
        try:
            await self.runtime.adapter.async_set_relay(index, True, suppress_event=True)
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Virtual radio press failed for button %s: %s", index, err)
            raise
        await self._async_radio_mandatory(profile, index, True)

    async def _async_virtual_radio_split_press(self, profile: Profile, index: int) -> None:
        """Radio-split virtual press: group exclusivity or independent toggle."""
        group = profile.radio_group_for(index)
        if group is None:
            await self._async_virtual_toggle_press(profile, index)
            return
        current = self._relay_currently_on(index)
        if current is True:
            # Classic radio within group: re-pressing selected is a no-op.
            return
        try:
            await self.runtime.adapter.async_set_relay(index, True, suppress_event=True)
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Virtual radio-split press failed for button %s: %s", index, err)
            raise
        await self._async_radio_split(profile, index, True)

    async def _async_virtual_mixed_press(self, profile: Profile, index: int) -> None:
        """Route a card/service press by mixed-mode role, driving hardware."""
        role = profile.button_role(index)
        if role in {BUTTON_ROLE_COVER_OPEN, BUTTON_ROLE_COVER_CLOSE}:
            await self._async_cover_press(profile, index, True)
            return
        if role == BUTTON_ROLE_MOMENTARY:
            await self._async_virtual_momentary_press(profile, index)
            return
        if role == BUTTON_ROLE_RADIO:
            await self._async_virtual_radio_split_press(profile, index)
            return
        await self._async_virtual_toggle_press(profile, index)

    async def _async_virtual_momentary_press(self, profile: Profile, index: int) -> None:
        """Card/service momentary: energize (+ pulse) or cancel like a re-press."""
        armed = index in self.runtime.momentary.timers
        current = self._relay_currently_on(index)
        if armed:
            # Same as physical ON while armed / re-press cancel.
            await self._async_momentary_press(profile, index, True)
            return
        if current is True:
            # Latched ON without an armed timer — force OFF (fail-safe).
            try:
                await self.runtime.adapter.async_set_relay(index, False, suppress_event=True)
            except Exception as err:  # noqa: BLE001
                _LOGGER.error("Virtual momentary cancel failed for button %s: %s", index, err)
            self.runtime.async_notify()
            return
        try:
            await self.runtime.adapter.async_set_relay(index, True, suppress_event=True)
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Virtual momentary ON failed for button %s: %s", index, err)
            raise
        await self._async_momentary_press(profile, index, True)
        self.runtime.async_notify()

    async def async_update_panel_name(self, panel_name: str) -> dict[str, Any]:
        """Rename the panel in mapping, config entry title/data, and device registry."""
        name = str(panel_name or "").strip()
        if not name:
            raise ValueError("Panel name cannot be empty")
        if name == self.runtime.mapping.panel_name:
            return self.get_config_payload()

        mapping_dict = self.runtime.mapping.to_dict()
        mapping_dict["panel_name"] = name
        self.runtime.mapping = EntityMapping.from_dict(mapping_dict)

        entry = self.runtime.entry
        self.skip_next_reload = True
        try:
            self.hass.config_entries.async_update_entry(
                entry,
                title=name,
                data=mapping_dict,
            )
        except Exception:  # noqa: BLE001
            self.skip_next_reload = False
            raise

        try:
            from homeassistant.helpers import device_registry as dr

            device_registry = dr.async_get(self.hass)
            device = device_registry.async_get_device(identifiers={(DOMAIN, entry.entry_id)})
            if device is not None:
                device_registry.async_update_device(device.id, name=name)
        except Exception:  # noqa: BLE001
            _LOGGER.debug("Could not update device registry name", exc_info=True)

        self.runtime.async_notify()
        return self.get_config_payload()

    def _relay_states_payload(self) -> list[bool | None]:
        """Return on/off/unknown for each mapped relay (card faceplate source)."""
        states: list[bool | None] = []
        hass_states = getattr(self.hass, "states", None)
        for entity_id in self.runtime.mapping.relay_entities:
            if hass_states is None:
                states.append(None)
                continue
            state = hass_states.get(entity_id)
            if state is None or state.state in {STATE_UNKNOWN, STATE_UNAVAILABLE}:
                states.append(None)
            else:
                states.append(state.state == "on")
        return states

    def _panel_available(self) -> bool:
        """True when the mapped panel device looks online via HA entity states.

        Zigbee2MQTT / MQTT device availability is surfaced by Home Assistant as
        ``unavailable`` (or ``unknown``) across every entity of the offline
        device. Scan all mapped hardware entities (relays, color/radar selects,
        backlight, child lock, brightness) — not just relays — so the card
        still reflects reality if the relays happen to load before the selects
        (or vice versa). A single flaky entity does not mark the whole panel
        offline while any sibling still reports a real state.
        """
        mapping = self.runtime.mapping
        entities = [
            *mapping.relay_entities,
            mapping.color_off_entity,
            mapping.color_on_entity,
            mapping.radar_entity,
            mapping.backlight_entity,
            mapping.child_lock_entity,
        ]
        if mapping.backlight_brightness_entity:
            entities.append(mapping.backlight_brightness_entity)
        if not entities:
            return False
        hass_states = getattr(self.hass, "states", None)
        if hass_states is None:
            return True
        saw_entity = False
        for entity_id in entities:
            state = hass_states.get(entity_id)
            if state is None:
                continue
            saw_entity = True
            if state.state not in {STATE_UNKNOWN, STATE_UNAVAILABLE}:
                return True
        # False when every known entity is unavailable/unknown; True on startup
        # race when none of the mapped entities are in the state machine yet.
        return not saw_entity
