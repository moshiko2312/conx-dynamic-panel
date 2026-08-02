"""Zemismart 4-gang adapter using Home Assistant entities."""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from ..const import BUTTON_COUNT, DEFAULT_COLORS, DEFAULT_RADAR
from ..exceptions import HardwareWriteError, MappingValidationError
from ..models import EntityMapping, HardwareState, Profile, SyncResult
from ..suppression import SuppressionTracker
from .base import PanelAdapter

_LOGGER = logging.getLogger(__name__)


class Zemismart4GangAdapter(PanelAdapter):
    """Adapter for Zemismart 4-button panels exposed via Zigbee2MQTT entities."""

    def __init__(
        self,
        hass: HomeAssistant,
        mapping: EntityMapping,
        suppression: SuppressionTracker,
        *,
        confirm_timeout: float,
    ) -> None:
        self.hass = hass
        self.mapping = mapping
        self.suppression = suppression
        self.confirm_timeout = confirm_timeout

    async def async_validate_mapping(self) -> None:
        """Validate domains, uniqueness, existence, and writable selects/text."""
        relays = list(self.mapping.relay_entities)
        names = list(self.mapping.name_entities)
        if len(set(relays)) != BUTTON_COUNT:
            raise MappingValidationError("Relay entities must be unique")
        if len(set(names)) != BUTTON_COUNT:
            raise MappingValidationError("Name entities must be unique")

        for entity_id in relays:
            self._require_domain(entity_id, "switch")
        for entity_id in names:
            self._require_domain(entity_id, "text")
            self._require_exists(entity_id)

        for entity_id, domain in (
            (self.mapping.color_off_entity, "select"),
            (self.mapping.color_on_entity, "select"),
            (self.mapping.radar_entity, "select"),
            (self.mapping.backlight_entity, "switch"),
            (self.mapping.child_lock_entity, "switch"),
        ):
            self._require_domain(entity_id, domain)
            self._require_exists(entity_id)

        for select_entity in (
            self.mapping.color_off_entity,
            self.mapping.color_on_entity,
            self.mapping.radar_entity,
        ):
            options = self._options(select_entity)
            if not options:
                raise MappingValidationError(
                    f"Select entity {select_entity} does not expose options"
                )

        registry = er.async_get(self.hass)
        for entity_id in names:
            entry = registry.async_get(entity_id)
            state = self.hass.states.get(entity_id)
            if entry is None and state is None:
                raise MappingValidationError(f"Text entity {entity_id} is missing")
            if entry is not None and getattr(entry, "disabled_by", None) is not None:
                raise MappingValidationError(
                    f"Text entity {entity_id} is disabled and not writable"
                )
            if state is not None and state.state in {"unavailable", "unknown"}:
                raise MappingValidationError(
                    f"Text entity {entity_id} is {state.state} and not writable"
                )
            # Prefer entities that expose a text mode; absence is allowed when the
            # entity exists because some integrations omit the attribute until first write.
            if state is not None:
                mode = state.attributes.get("mode")
                if mode is not None and str(mode).lower() == "password":
                    raise MappingValidationError(
                        f"Text entity {entity_id} uses password mode and is unsuitable"
                    )

    async def async_read_hardware_state(self) -> HardwareState:
        """Read names, relays, colors, radar, backlight, and child lock."""
        names = tuple(self._state_str(entity_id) for entity_id in self.mapping.name_entities)
        relays = tuple(
            self._state_bool(entity_id) for entity_id in self.mapping.relay_entities
        )
        return HardwareState(
            names=names,  # type: ignore[arg-type]
            relays=relays,  # type: ignore[arg-type]
            color_on=self._state_str(self.mapping.color_on_entity),
            color_off=self._state_str(self.mapping.color_off_entity),
            radar=self._state_str(self.mapping.radar_entity),
            backlight=self._state_bool(self.mapping.backlight_entity),
            child_lock=self._state_bool(self.mapping.child_lock_entity),
        )

    async def async_apply_profile(self, profile: Profile) -> SyncResult:
        """Write profile settings sequentially and confirm each step."""
        confirmed: list[str] = []
        try:
            await self.async_set_names(profile.button_names())
            confirmed.append("names")
            await self.async_set_colors(profile.color_on, profile.color_off)
            confirmed.append("colors")
            await self.async_set_radar(profile.radar)
            confirmed.append("radar")
            await self.async_set_backlight(profile.backlight)
            confirmed.append("backlight")
            await self.async_set_child_lock(profile.child_lock)
            confirmed.append("child_lock")
            await self._async_apply_relay_mode(profile)
            confirmed.append("relays")
        except HardwareWriteError as err:
            return SyncResult(success=False, error=str(err), confirmed_steps=confirmed)
        except Exception as err:  # noqa: BLE001
            _LOGGER.exception("Unexpected sync failure")
            return SyncResult(success=False, error=str(err), confirmed_steps=confirmed)
        return SyncResult(success=True, confirmed_steps=confirmed)

    async def async_set_relay(
        self, index: int, state: bool, *, suppress_event: bool = True
    ) -> None:
        """Set a relay switch and optionally suppress the resulting event."""
        if index < 1 or index > BUTTON_COUNT:
            raise HardwareWriteError(f"Invalid relay index: {index}")
        entity_id = self.mapping.relay_entities[index - 1]
        expected = "on" if state else "off"
        if suppress_event:
            self.suppression.register(
                entity_id,
                expected,
                operation_id=str(uuid.uuid4()),
            )
        domain = "switch"
        service = "turn_on" if state else "turn_off"
        await self.hass.services.async_call(
            domain,
            service,
            {"entity_id": entity_id},
            blocking=True,
        )
        await self._async_wait_for_state(entity_id, expected)

    async def async_set_names(self, names: tuple[str, str, str, str]) -> None:
        """Set text name entities."""
        for entity_id, name in zip(self.mapping.name_entities, names, strict=True):
            await self.hass.services.async_call(
                "text",
                "set_value",
                {"entity_id": entity_id, "value": name},
                blocking=True,
            )
            await self._async_wait_for_state(entity_id, name)

    async def async_set_colors(self, color_on: str, color_off: str) -> None:
        """Set color select entities."""
        await self._async_select_option(self.mapping.color_off_entity, color_off)
        await self._async_select_option(self.mapping.color_on_entity, color_on)

    async def async_set_radar(self, value: str) -> None:
        """Set radar select option."""
        await self._async_select_option(self.mapping.radar_entity, value)

    async def async_set_backlight(self, enabled: bool) -> None:
        """Set backlight switch."""
        await self._async_set_switch(self.mapping.backlight_entity, enabled)

    async def async_set_child_lock(self, enabled: bool) -> None:
        """Set child lock switch."""
        await self._async_set_switch(self.mapping.child_lock_entity, enabled)

    def supported_colors(self) -> list[str]:
        """Prefer live select options, fall back to defaults."""
        options = self._options(self.mapping.color_on_entity) or self._options(
            self.mapping.color_off_entity
        )
        return options or list(DEFAULT_COLORS)

    def supported_radar(self) -> list[str]:
        """Prefer live radar options, fall back to defaults."""
        return self._options(self.mapping.radar_entity) or list(DEFAULT_RADAR)

    async def _async_apply_relay_mode(self, profile: Profile) -> None:
        """Apply relay pattern required by the profile mode."""
        if profile.mode == "toggle":
            return
        selected = profile.selected_button
        if profile.mode == "radio_mandatory" and selected not in {1, 2, 3, 4}:
            selected = 1
            profile.selected_button = 1
        for index in range(1, BUTTON_COUNT + 1):
            desired = selected == index
            await self.async_set_relay(index, desired, suppress_event=True)

    async def _async_select_option(self, entity_id: str, option: str) -> None:
        options = self._options(entity_id)
        if options and option not in options:
            raise HardwareWriteError(
                f"Option '{option}' is not available on {entity_id}; choices={options}"
            )
        await self.hass.services.async_call(
            "select",
            "select_option",
            {"entity_id": entity_id, "option": option},
            blocking=True,
        )
        await self._async_wait_for_state(entity_id, option)

    async def _async_set_switch(self, entity_id: str, enabled: bool) -> None:
        expected = "on" if enabled else "off"
        service = "turn_on" if enabled else "turn_off"
        await self.hass.services.async_call(
            "switch",
            service,
            {"entity_id": entity_id},
            blocking=True,
        )
        await self._async_wait_for_state(entity_id, expected)

    async def _async_wait_for_state(self, entity_id: str, expected: Any) -> None:
        expected_str = str(expected)
        deadline = asyncio.get_running_loop().time() + self.confirm_timeout
        while asyncio.get_running_loop().time() < deadline:
            state = self.hass.states.get(entity_id)
            if state is not None and state.state == expected_str:
                return
            await asyncio.sleep(0.1)
        current = self.hass.states.get(entity_id)
        current_state = current.state if current else "missing"
        raise HardwareWriteError(
            f"Timed out waiting for {entity_id} to become '{expected_str}' "
            f"(current='{current_state}')"
        )

    def _require_domain(self, entity_id: str, domain: str) -> None:
        if not entity_id.startswith(f"{domain}."):
            raise MappingValidationError(
                f"Entity {entity_id} must be in domain '{domain}'"
            )
        self._require_exists(entity_id)

    def _require_exists(self, entity_id: str) -> None:
        if self.hass.states.get(entity_id) is None:
            registry = er.async_get(self.hass)
            if registry.async_get(entity_id) is None:
                raise MappingValidationError(f"Entity {entity_id} does not exist")

    def _options(self, entity_id: str) -> list[str]:
        state = self.hass.states.get(entity_id)
        if state is None:
            return []
        options = state.attributes.get("options") or []
        return [str(item) for item in options]

    def _state_str(self, entity_id: str) -> str:
        state = self.hass.states.get(entity_id)
        if state is None or state.state in {"unknown", "unavailable"}:
            return ""
        return str(state.state)

    def _state_bool(self, entity_id: str) -> bool:
        return self._state_str(entity_id) == "on"
