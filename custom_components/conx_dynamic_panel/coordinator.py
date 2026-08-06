"""Orchestration, listeners, sync state, and profile engine."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event, callback
from homeassistant.helpers.event import async_track_state_change_event

from .const import (
    BUTTON_COUNT,
    BUTTON_ROLE_COVER_CLOSE,
    BUTTON_ROLE_COVER_OPEN,
    BUTTON_ROLE_MOMENTARY,
    BUTTON_ROLE_RADIO,
    COVER_COMMAND_OPEN,
    COVER_COMMAND_STOP,
    COVER_COMMANDS,
    COVER_DIRECTION_CLOSE,
    COVER_DIRECTION_OPEN,
    COVER_OPPOSITE_STOP_THEN_REVERSE,
    COVER_POST_START_OFF_GRACE_S,
    COVER_REASON_ABORT,
    COVER_REASON_COMMAND,
    COVER_REASON_ERROR,
    COVER_REASON_PRESS,
    COVER_REASON_SAFETY,
    COVER_REASON_STOP_PRESS,
    COVER_REASON_TRAVEL_COMPLETE,
    DOMAIN,
    EVENT_BUTTON_PRESS,
    EVENT_COVER_STATE,
    MODE_COVER,
    MODE_MIXED,
    MODE_RADIO_MANDATORY,
    MODE_RADIO_OPTIONAL,
    MODE_RADIO_SPLIT,
    MODE_TOGGLE,
    STORAGE_VERSION,
    SUPPORTED_MODES,
    SYNC_ERROR,
    SYNC_OUT_OF_SYNC,
    SYNC_PENDING,
    SYNC_SYNCED,
    SYNC_SYNCING,
)
from .entity_relay import (
    EntityRelayBinding,
    iter_entity_relay_bindings,
    resolve_radio_selected_from_entities,
    state_value_to_relay_on,
)
from .exceptions import (
    ActionExecutionError,
    ProfileNotFoundError,
    SyncInProgressError,
)
from .models import (
    ButtonAction,
    CoverConfig,
    EntityMapping,
    HardwareState,
    PanelStorageData,
    Profile,
    SyncResult,
    capability_defaults,
    validate_covers,
    validate_mixed_profile,
    validate_radio_groups,
)
from .runtime import CoverMotion, PanelRuntime

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

    @property
    def data(self) -> PanelStorageData:
        """Shortcut to storage data."""
        return self.runtime.store.data

    async def async_setup(self) -> None:
        """Load storage, attach listeners, and restore hardware from applied snapshot.

        Persistence survives HA restart via versioned Store. Draft profiles stay
        as saved for the editor; hardware is re-driven from ``applied_snapshot``
        (last successful Sync) so the panel matches the last known-good state.
        """
        await self.runtime.store.async_load()
        self.data.refresh_pending_status()
        self._attach_listeners()
        self._rebuild_entity_relay_listeners()
        # A restart must never inherit an energized motor: start from both off so
        # the engine's belief and the hardware agree.
        await self._async_cover_abort(COVER_REASON_SAFETY)
        # Drop any armed pulse timers and force momentary relays OFF.
        await self._async_momentary_abort()
        await self._async_restore_applied_to_hardware()
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
        """Detach live linked-entity → relay subscriptions."""
        for remove in self._entity_relay_unsubs:
            remove()
        self._entity_relay_unsubs.clear()
        self._entity_relay_bindings.clear()

    def _rebuild_entity_relay_listeners(self) -> None:
        """Subscribe to linked HA entities for the active profile (live LED sync).

        Uses the same toggle/safe-radio rules as Sync. Cover and momentary
        buttons are never tracked as latched ON. Rebuild after profile/sync
        changes; unload clears subscriptions.
        """
        self._clear_entity_relay_listeners()
        if self.runtime.unloading:
            return
        profile = self.data.active_profile()
        if profile is None:
            return
        by_entity: dict[str, list[EntityRelayBinding]] = {}
        for binding in iter_entity_relay_bindings(profile):
            by_entity.setdefault(binding.entity_id, []).append(binding)
        self._entity_relay_bindings = by_entity
        entity_ids = list(by_entity)
        if not entity_ids:
            return

        @callback
        def _on_linked_entity_change(event: Event) -> None:
            self.hass.async_create_task(self._async_handle_linked_entity_event(event))

        self._entity_relay_unsubs.append(
            async_track_state_change_event(self.hass, entity_ids, _on_linked_entity_change)
        )

    async def _async_handle_linked_entity_event(self, event: Event) -> None:
        """Mirror linked HA on/off state onto the panel relay (suppressed write)."""
        if self.runtime.unloading:
            return
        if self.data.sync_status == SYNC_SYNCING or self.runtime.sync_lock.locked():
            return
        entity_id = event.data.get("entity_id")
        old_state = event.data.get("old_state")
        new_state = event.data.get("new_state")
        if entity_id is None or new_state is None:
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
        self.runtime.unloading = True
        self._clear_entity_relay_listeners()
        for remove in self.runtime.listeners:
            remove()
        self.runtime.listeners.clear()
        self.runtime.suppression.clear()

    async def _async_handle_relay_event(self, event: Event) -> None:
        if self.runtime.unloading:
            return
        entity_id = event.data.get("entity_id")
        old_state = event.data.get("old_state")
        new_state = event.data.get("new_state")
        if entity_id is None or old_state is None or new_state is None:
            return
        if new_state.state in {STATE_UNKNOWN, STATE_UNAVAILABLE}:
            return
        if old_state.state == new_state.state:
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
            return
        if old_state.state == new_state.state:
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
                try:
                    hardware = await self.runtime.adapter.async_read_hardware_state()
                    if self._hardware_differs_from_snapshot(hardware):
                        self.data.sync_status = SYNC_OUT_OF_SYNC  # type: ignore[assignment]
                    else:
                        self.data.refresh_pending_status()
                except Exception:  # noqa: BLE001
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
            await self._async_execute_button_action(profile, index, turned_on)
            return
        if profile.mode == MODE_RADIO_SPLIT:
            await self._async_radio_split(profile, index, turned_on)
            return
        # Independent toggles inside a radio profile skip exclusivity.
        if not profile.is_radio_member(index):
            await self._async_execute_button_action(profile, index, turned_on)
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
        await self._async_execute_button_action(profile, index, turned_on)

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
            await self._async_execute_button_action(profile, index, turned_on)
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
            await self._async_execute_button_action(profile, index, True)

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
            await self._async_execute_button_action(profile, index, turned_on)
            return
        members = list(group.buttons)
        if turned_on:
            await self._async_execute_button_action(profile, index, True)
            for other in members:
                if other != index:
                    await self.runtime.adapter.async_set_relay(other, False, suppress_event=True)
            return
        # Classic radio within group: keep exactly one ON (restore; no self-toggle-off).
        await self.runtime.adapter.async_set_relay(index, True, suppress_event=True)

    async def _async_radio_mandatory(self, profile: Profile, index: int, turned_on: bool) -> None:
        members = profile.radio_member_indexes()
        if turned_on:
            await self._async_execute_button_action(profile, index, True)
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
            await self._async_execute_button_action(profile, index, turned_on)
            return
        direction = cover.direction_for(index)
        if direction is None:
            await self._async_execute_button_action(profile, index, turned_on)
            return
        if not self._cover_is_usable(profile, cover):
            await self._async_cover_abort(COVER_REASON_ERROR)
            return

        async with self.runtime.cover.lock:
            motion = self.runtime.cover.get(cover.id)
            if not turned_on:
                # OFF on the inactive direction must not abort travel. After
                # stop_then_reverse the previous direction often reports a
                # duplicate Zigbee OFF; treating that as a stop killed reverse.
                if motion.moving and motion.direction != direction:
                    return
                # After stop_then_reverse force_energize only: active-direction
                # OFF shortly after start is usually a deferred halt/settle echo
                # that lost the suppression race. Ignore it and re-assert ON if
                # HA flipped off. Idle starts still treat immediate OFF as stop.
                if (
                    motion.moving
                    and motion.direction == direction
                    and motion.suppress_stale_off_until is not None
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
                            await self._async_cover_halt(cover, reason=COVER_REASON_ERROR)
                    return
                # Active-direction OFF is a stop press; idle OFF is safety.
                await self._async_cover_halt(
                    cover,
                    reason=COVER_REASON_STOP_PRESS if motion.moving else COVER_REASON_SAFETY,
                )
                return
            if motion.moving:
                previous = motion.direction
                await self._async_cover_halt(cover, reason=COVER_REASON_STOP_PRESS)
                if (
                    previous == direction
                    or cover.opposite_press != COVER_OPPOSITE_STOP_THEN_REVERSE
                ):
                    return
                await self._async_cover_settle(cover)
                # Halt just forced both OFF — always re-energize reverse.
                await self._async_cover_start(
                    cover,
                    profile,
                    direction,
                    COVER_REASON_PRESS,
                    force_energize=True,
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
                await self._async_cover_halt(cover, reason=COVER_REASON_COMMAND)
                if (
                    previous == direction
                    or cover.opposite_press != COVER_OPPOSITE_STOP_THEN_REVERSE
                ):
                    return self.cover_state_payload(cover_id=cover.id)
                await self._async_cover_settle(cover)
                await self._async_cover_start(
                    cover,
                    profile,
                    direction,
                    COVER_REASON_COMMAND,
                    force_energize=True,
                )
            else:
                await self._async_cover_start(cover, profile, direction, COVER_REASON_COMMAND)
        return self.cover_state_payload(cover_id=cover.id)

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

    async def _async_cover_halt(self, cover: CoverConfig | None, *, reason: str) -> None:
        """Cancel any travel timer and force both direction relays OFF for one cover.

        Caller must hold the cover lock. The relay pair that was last energized
        is always included, so a profile switch mid-travel still de-energizes the
        buttons that are actually wired to the motor.
        """
        if cover is None:
            return
        motion = self.runtime.cover.get(cover.id)
        await self._async_cover_halt_motion(motion, cover=cover, reason=reason)

    async def _async_cover_halt_motion(
        self,
        motion: CoverMotion,
        *,
        cover: CoverConfig | None,
        reason: str,
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

    async def _async_execute_button_action(
        self, profile: Profile, index: int, new_relay_state: bool
    ) -> None:
        button = next((item for item in profile.buttons if item.index == index), None)
        if button is None:
            return
        if button.action is not None:
            try:
                await self._async_run_action(button.action)
            except ActionExecutionError as err:
                _LOGGER.error("Button action failed: %s", err)
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
            self.data.active_profile_id = profile_id
            await self._async_cover_abort(COVER_REASON_ABORT)
            await self._async_momentary_abort()
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

    async def async_delete_profile(self, profile_id: str) -> None:
        """Delete a profile draft."""
        if profile_id not in self.data.profiles:
            raise ProfileNotFoundError(profile_id)
        if len(self.data.profiles) <= 1:
            raise ValueError("At least one profile must remain")
        if profile_id == self.data.active_profile_id:
            await self._async_cover_abort(COVER_REASON_ABORT)
            await self._async_momentary_abort()
        del self.data.profiles[profile_id]
        if self.data.active_profile_id == profile_id:
            self.data.active_profile_id = next(iter(self.data.profiles))
        self.data.refresh_pending_status()
        await self._async_after_draft_change()

    async def async_duplicate_profile(
        self, profile_id: str, new_id: str, new_name: str | None = None
    ) -> Profile:
        """Duplicate an existing profile."""
        source = self.data.profiles.get(profile_id)
        if source is None:
            raise ProfileNotFoundError(profile_id)
        if new_id in self.data.profiles:
            raise ValueError(f"Profile already exists: {new_id}")
        profile = source.clone(new_id, new_name)
        self.data.profiles[new_id] = profile
        self.data.refresh_pending_status()
        await self._async_after_draft_change()
        return profile

    def export_profiles(self) -> dict[str, Any]:
        """Return a portable JSON payload of stored profiles."""
        return {
            "schema_version": STORAGE_VERSION,
            "active_profile_id": self.data.active_profile_id,
            "profiles": {key: profile.to_dict() for key, profile in self.data.profiles.items()},
        }

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
              "schema_version": 1,
              "active_profile_id": "lighting",
              "profiles": {
                "lighting": { "id": "lighting", "name": "...", ... }
              }
            }
        """
        if mode not in {"merge", "replace"}:
            raise ValueError(f"Unsupported import mode: {mode}")
        if not isinstance(payload, dict):
            raise ValueError("Import payload must be an object")

        schema_version = payload.get("schema_version", STORAGE_VERSION)
        try:
            schema_version_int = int(schema_version)
        except (TypeError, ValueError) as err:
            raise ValueError("schema_version must be an integer") from err
        if schema_version_int > STORAGE_VERSION:
            raise ValueError(
                f"Unsupported export schema_version {schema_version_int}; "
                f"current is {STORAGE_VERSION}"
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
        await self._async_execute_button_action(profile, index, new_state)
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

    def get_runtime_payload(self) -> dict[str, Any]:
        """Return live runtime fields for card refresh (never includes drafts)."""
        return {
            "entry_id": self.runtime.entry.entry_id,
            "sync_status": self.data.sync_status,
            "last_sync": self.data.last_sync,
            "last_error": self.data.last_error,
            "auto_sync": self.runtime.auto_sync,
            "relay_entities": list(self.runtime.mapping.relay_entities),
            "relay_states": self._relay_states_payload(),
            "momentary_active": sorted(self.runtime.momentary.timers),
            "cover_state": self.cover_state_payload(),
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
            "sync_status": self.data.sync_status,
            "last_sync": self.data.last_sync,
            "last_error": self.data.last_error,
            "auto_sync": self.runtime.auto_sync,
            "capabilities": defaults,
            "profiles": {key: profile.to_dict() for key, profile in self.data.profiles.items()},
            "applied_snapshot": self.data.applied_snapshot,
            "relay_entities": list(self.runtime.mapping.relay_entities),
            "relay_states": self._relay_states_payload(),
            "momentary_active": sorted(self.runtime.momentary.timers),
            "cover_state": self.cover_state_payload(),
        }
