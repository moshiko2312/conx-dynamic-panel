"""Orchestration, listeners, sync state, and profile engine."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event, callback
from homeassistant.helpers.event import async_track_state_change_event

from .const import (
    BUTTON_COUNT,
    EVENT_BUTTON_PRESS,
    MODE_RADIO_MANDATORY,
    MODE_RADIO_OPTIONAL,
    MODE_TOGGLE,
    SYNC_ERROR,
    SYNC_OUT_OF_SYNC,
    SYNC_PENDING,
    SYNC_SYNCED,
    SYNC_SYNCING,
)
from .exceptions import (
    ActionExecutionError,
    ProfileNotFoundError,
    SyncInProgressError,
)
from .models import ButtonAction, PanelStorageData, Profile, capability_defaults
from .runtime import PanelRuntime

_LOGGER = logging.getLogger(__name__)


class PanelCoordinator:
    """Coordinates runtime behavior for one panel entry."""

    def __init__(self, runtime: PanelRuntime) -> None:
        self.runtime = runtime
        self.hass = runtime.hass

    @property
    def data(self) -> PanelStorageData:
        """Shortcut to storage data."""
        return self.runtime.store.data

    async def async_setup(self) -> None:
        """Load storage and attach relay listeners."""
        await self.runtime.store.async_load()
        self.data.refresh_pending_status()
        self._attach_listeners()
        self.runtime.async_notify()

    def _attach_listeners(self) -> None:
        entity_ids = list(self.runtime.mapping.relay_entities)

        @callback
        def _on_state_change(event: Event) -> None:
            self.hass.async_create_task(self._async_handle_relay_event(event))

        remove = async_track_state_change_event(self.hass, entity_ids, _on_state_change)
        self.runtime.listeners.append(remove)

    async def async_unload(self) -> None:
        """Detach listeners and mark unloading."""
        self.runtime.unloading = True
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
        if self.runtime.suppression.should_suppress(entity_id, new_state.state):
            return
        try:
            index = list(self.runtime.mapping.relay_entities).index(entity_id) + 1
        except ValueError:
            return
        turned_on = new_state.state == "on"
        await self._async_handle_physical_press(index, turned_on)

    async def _async_handle_physical_press(self, index: int, turned_on: bool) -> None:
        profile = self.data.active_profile()
        if profile is None:
            return
        if profile.mode == MODE_TOGGLE:
            await self._async_execute_button_action(profile, index, turned_on)
            return
        if profile.mode == MODE_RADIO_MANDATORY:
            await self._async_radio_mandatory(profile, index, turned_on)
            return
        if profile.mode == MODE_RADIO_OPTIONAL:
            await self._async_radio_optional(profile, index, turned_on)

    async def _async_radio_mandatory(
        self, profile: Profile, index: int, turned_on: bool
    ) -> None:
        if turned_on:
            await self._async_execute_button_action(profile, index, True)
            profile.selected_button = index
            for other in range(1, BUTTON_COUNT + 1):
                if other != index:
                    await self.runtime.adapter.async_set_relay(
                        other, False, suppress_event=True
                    )
            await self.runtime.store.async_save()
            self.runtime.async_notify()
            return
        if profile.selected_button == index or profile.selected_button is None:
            profile.selected_button = index
            await self.runtime.adapter.async_set_relay(index, True, suppress_event=True)
            await self.runtime.store.async_save()
            self.runtime.async_notify()

    async def _async_radio_optional(
        self, profile: Profile, index: int, turned_on: bool
    ) -> None:
        if turned_on:
            await self._async_execute_button_action(profile, index, True)
            profile.selected_button = index
            for other in range(1, BUTTON_COUNT + 1):
                if other != index:
                    await self.runtime.adapter.async_set_relay(
                        other, False, suppress_event=True
                    )
            await self.runtime.store.async_save()
            self.runtime.async_notify()
            return
        if profile.selected_button == index:
            profile.selected_button = None
            await self.runtime.store.async_save()
            self.runtime.async_notify()

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
            self.data.sync_status = SYNC_SYNCING  # type: ignore[assignment]
            self.data.last_error = None
            self.runtime.async_notify()
            result = await self.runtime.adapter.async_apply_profile(profile)
            if result.success:
                self.data.applied_snapshot = profile.to_dict()
                self.data.last_sync = datetime.now(UTC).isoformat()
                self.data.last_error = None
                self.data.sync_status = SYNC_SYNCED  # type: ignore[assignment]
            else:
                self.data.last_error = result.error
                self.data.sync_status = SYNC_ERROR  # type: ignore[assignment]
            await self.runtime.store.async_save()
            self.runtime.async_notify()
            if not result.success:
                raise RuntimeError(result.error or "Sync failed")

    async def async_pull_from_panel(self) -> None:
        """Pull hardware state into the active profile draft."""
        profile = self.data.active_profile()
        if profile is None:
            raise ProfileNotFoundError("No active profile")
        hardware = await self.runtime.adapter.async_read_hardware_state()
        for button, name in zip(profile.buttons, hardware.names, strict=True):
            button.name = name
        profile.color_on = hardware.color_on or profile.color_on
        profile.color_off = hardware.color_off or profile.color_off
        profile.radar = hardware.radar or profile.radar
        profile.backlight = hardware.backlight
        profile.child_lock = hardware.child_lock
        if profile.mode in {MODE_RADIO_MANDATORY, MODE_RADIO_OPTIONAL}:
            on_indexes = [
                index + 1 for index, value in enumerate(hardware.relays) if value
            ]
            profile.selected_button = on_indexes[0] if on_indexes else None
        self.data.refresh_pending_status()
        await self._async_detect_out_of_sync(hardware_profile=profile)
        await self.runtime.store.async_save()
        self.runtime.async_notify()

    async def _async_detect_out_of_sync(self, *, hardware_profile: Profile) -> None:
        if not self.data.applied_snapshot:
            self.data.refresh_pending_status()
            return
        if hardware_profile.to_dict() != self.data.applied_snapshot:
            # Compare hardware-derived fields against snapshot when useful.
            snapshot = self.data.applied_snapshot
            changed = any(
                hardware_profile.to_dict().get(key) != snapshot.get(key)
                for key in (
                    "color_on",
                    "color_off",
                    "radar",
                    "backlight",
                    "child_lock",
                    "buttons",
                )
            )
            if changed and self.data.sync_status not in {SYNC_SYNCING, SYNC_PENDING}:
                self.data.sync_status = SYNC_OUT_OF_SYNC  # type: ignore[assignment]
            else:
                self.data.refresh_pending_status()
        else:
            self.data.refresh_pending_status()

    async def async_activate_profile(self, profile_id: str, *, sync: bool = False) -> None:
        """Activate a profile, optionally syncing immediately."""
        if profile_id not in self.data.profiles:
            raise ProfileNotFoundError(profile_id)
        self.data.active_profile_id = profile_id
        self.data.refresh_pending_status()
        await self.runtime.store.async_save()
        self.runtime.async_notify()
        if sync or self.runtime.auto_sync:
            await self.async_sync()

    async def async_create_profile(self, payload: dict[str, Any]) -> Profile:
        """Create a profile from validated payload."""
        profile = Profile.from_dict(payload)
        if profile.id in self.data.profiles:
            raise ValueError(f"Profile already exists: {profile.id}")
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
        self.data.profiles[profile_id] = profile
        self.data.refresh_pending_status()
        await self._async_after_draft_change()
        return profile

    async def async_delete_profile(self, profile_id: str) -> None:
        """Delete a profile draft."""
        if profile_id not in self.data.profiles:
            raise ProfileNotFoundError(profile_id)
        if len(self.data.profiles) <= 1:
            raise ValueError("At least one profile must remain")
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

    async def _async_after_draft_change(self) -> None:
        if self.data.sync_status != SYNC_SYNCING:
            self.data.sync_status = (
                SYNC_SYNCED if self.data.draft_matches_snapshot() else SYNC_PENDING
            )  # type: ignore[assignment]
        await self.runtime.store.async_save()
        self.runtime.async_notify()
        if self.runtime.auto_sync and self.data.sync_status == SYNC_PENDING:
            await self.async_sync()

    async def async_execute_button(self, button: int) -> None:
        """Execute a button action without requiring a physical press."""
        profile = self.data.active_profile()
        if profile is None:
            raise ProfileNotFoundError("No active profile")
        if button < 1 or button > BUTTON_COUNT:
            raise ValueError("Button must be 1-4")
        await self._async_execute_button_action(profile, button, True)

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
            "profiles": {
                key: profile.to_dict() for key, profile in self.data.profiles.items()
            },
            "applied_snapshot": self.data.applied_snapshot,
        }
