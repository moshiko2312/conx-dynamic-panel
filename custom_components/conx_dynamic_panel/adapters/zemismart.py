"""Zemismart 4-gang adapter using Home Assistant entities."""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from ..const import (
    BACKLIGHT_BRIGHTNESS_MAX,
    BACKLIGHT_BRIGHTNESS_MIN,
    BUTTON_COUNT,
    DEFAULT_BACKLIGHT_BRIGHTNESS,
    DEFAULT_COLORS,
    DEFAULT_RADAR,
    MODE_COVER,
    SELECT_CONFIRM_TIMEOUT_FLOOR,
    SELECT_WRITE_ATTEMPTS,
)
from ..exceptions import HardwareWriteError, MappingValidationError
from ..models import (
    EntityMapping,
    HardwareState,
    Profile,
    SyncResult,
    clamp_backlight_brightness,
)
from ..option_match import options_match, resolve_select_option
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

        if self.mapping.backlight_brightness_entity:
            self._require_domain(self.mapping.backlight_brightness_entity, "number")
            self._require_exists(self.mapping.backlight_brightness_entity)

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
        relays = tuple(self._state_bool(entity_id) for entity_id in self.mapping.relay_entities)
        return HardwareState(
            names=names,  # type: ignore[arg-type]
            relays=relays,  # type: ignore[arg-type]
            color_on=self._state_str(self.mapping.color_on_entity),
            color_off=self._state_str(self.mapping.color_off_entity),
            radar=self._state_str(self.mapping.radar_entity),
            backlight=self._state_bool(self.mapping.backlight_entity),
            child_lock=self._state_bool(self.mapping.child_lock_entity),
            backlight_brightness=self._read_backlight_brightness(),
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
            if self.mapping.backlight_brightness_entity:
                await self.async_set_backlight_brightness(profile.backlight_brightness)
                confirmed.append("backlight_brightness")
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

    async def async_set_backlight_brightness(self, brightness: int) -> None:
        """Set optional backlight brightness number entity (profile 0–100)."""
        entity_id = self.mapping.backlight_brightness_entity
        if not entity_id:
            return
        brightness = clamp_backlight_brightness(brightness)
        device_value = self._brightness_to_device_value(entity_id, brightness)
        await self.hass.services.async_call(
            "number",
            "set_value",
            {"entity_id": entity_id, "value": device_value},
            blocking=True,
        )
        await self._async_wait_for_numeric_state(entity_id, device_value)

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
        """Apply relay pattern required by the profile mode for radio members only."""
        if profile.mode == MODE_COVER:
            # A synced cover always lands de-energized: every direction relay OFF.
            for index in profile.all_cover_relay_indexes():
                await self.async_set_relay(index, False, suppress_event=True)
            return
        if profile.mode == "mixed":
            # Cover directions and momentary pulses start safe (OFF). Toggle/radio
            # buttons keep their latched state; exclusivity is enforced on press.
            for index in profile.all_cover_relay_indexes():
                await self.async_set_relay(index, False, suppress_event=True)
            for index in profile.momentary_button_indexes():
                await self.async_set_relay(index, False, suppress_event=True)
            return
        # Toggle and radio_split leave relays as-is; exclusivity is enforced on press.
        if profile.mode in {"toggle", "radio_split"}:
            return
        members = set(profile.radio_member_indexes())
        selected = profile.selected_button
        if selected not in members:
            selected = None
        if profile.mode in {"radio_mandatory", "radio_optional"} and selected is None:
            selected = next(iter(sorted(members)), 1)
            profile.selected_button = selected
        elif selected is not None:
            profile.selected_button = selected
        for index in sorted(members):
            desired = selected == index
            await self.async_set_relay(index, desired, suppress_event=True)

    def _select_confirm_timeout(self) -> float:
        """Select entities often need longer Zigbee report-back than switches."""
        return max(float(self.confirm_timeout), float(SELECT_CONFIRM_TIMEOUT_FLOOR))

    async def _async_select_option(self, entity_id: str, option: str) -> None:
        await self._async_wait_for_select_ready(entity_id)
        options = self._options(entity_id)
        resolved = option
        try:
            resolved = resolve_select_option(option, options)
        except HardwareWriteError as err:
            # Keep trying below — options may appear after a short wait.
            _LOGGER.debug("Initial select resolve deferred for %s: %s", entity_id, err)

        if options and resolved != option:
            _LOGGER.debug("Resolved select option %s → %s on %s", option, resolved, entity_id)

        current = self._state_str(entity_id)
        if current and options and options_match(current, resolved):
            return

        timeout = self._select_confirm_timeout()
        last_error: HardwareWriteError | None = None
        for attempt in range(1, SELECT_WRITE_ATTEMPTS + 1):
            # Re-read options each attempt — Z2M entities can populate late.
            options = self._options(entity_id) or options
            try:
                resolved = resolve_select_option(option, options)
            except HardwareWriteError as err:
                last_error = HardwareWriteError(
                    f"{err}; entity={entity_id}; current={self._select_current_label(entity_id)}"
                )
                if attempt < SELECT_WRITE_ATTEMPTS:
                    await asyncio.sleep(0.5)
                    continue
                break
            try:
                await self.hass.services.async_call(
                    "select",
                    "select_option",
                    {"entity_id": entity_id, "option": resolved},
                    blocking=True,
                )
                await self._async_wait_for_state(
                    entity_id,
                    resolved,
                    confirm_for=timeout,
                    fuzzy=True,
                )
                return
            except HardwareWriteError as err:
                last_error = err
                _LOGGER.warning(
                    "Select write attempt %s/%s failed for %s → %s: %s",
                    attempt,
                    SELECT_WRITE_ATTEMPTS,
                    entity_id,
                    resolved,
                    err,
                )
                if attempt < SELECT_WRITE_ATTEMPTS:
                    await asyncio.sleep(0.5)

        choices = options if options else "unknown"
        detail = str(last_error) if last_error else "unknown error"
        raise HardwareWriteError(
            f"{detail}; wrote '{resolved}' (from '{option}'); "
            f"entity={entity_id}; current={self._select_current_label(entity_id)}; "
            f"available options={choices}"
        )

    async def _async_wait_for_select_ready(self, entity_id: str) -> None:
        """Wait briefly when select is unknown/unavailable or options are empty."""
        timeout = min(self._select_confirm_timeout(), 10.0)
        deadline = asyncio.get_running_loop().time() + timeout
        while asyncio.get_running_loop().time() < deadline:
            state = self.hass.states.get(entity_id)
            if state is not None and state.state not in {"unavailable"}:
                options = state.attributes.get("options") or []
                if options:
                    return
            await asyncio.sleep(0.2)
        # Proceed anyway — write path will raise a clearer error if still unusable.

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

    async def _async_wait_for_state(
        self,
        entity_id: str,
        expected: Any,
        *,
        confirm_for: float | None = None,
        fuzzy: bool = False,
    ) -> None:
        expected_str = str(expected)
        wait_for = float(self.confirm_timeout if confirm_for is None else confirm_for)
        deadline = asyncio.get_running_loop().time() + wait_for
        while asyncio.get_running_loop().time() < deadline:
            state = self.hass.states.get(entity_id)
            if state is not None:
                if fuzzy and options_match(state.state, expected_str):
                    return
                if not fuzzy and state.state == expected_str:
                    return
            await asyncio.sleep(0.1)
        current = self.hass.states.get(entity_id)
        current_state = current.state if current else "missing"
        options = self._options(entity_id)
        choices = options if options else "unknown"
        raise HardwareWriteError(
            f"Timed out waiting for {entity_id} to become '{expected_str}' "
            f"(current='{current_state}'); available options={choices}"
        )

    def _select_current_label(self, entity_id: str) -> str:
        state = self.hass.states.get(entity_id)
        if state is None:
            return "missing"
        return str(state.state)

    def _require_domain(self, entity_id: str, domain: str) -> None:
        if not entity_id.startswith(f"{domain}."):
            raise MappingValidationError(f"Entity {entity_id} must be in domain '{domain}'")
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
        attributes = getattr(state, "attributes", None) or {}
        options = attributes.get("options") or []
        return [str(item) for item in options]

    def _state_str(self, entity_id: str) -> str:
        state = self.hass.states.get(entity_id)
        if state is None or state.state in {"unknown", "unavailable"}:
            return ""
        return str(state.state)

    def _state_bool(self, entity_id: str) -> bool:
        return self._state_str(entity_id) == "on"

    def _number_range(self, entity_id: str) -> tuple[float, float]:
        state = self.hass.states.get(entity_id)
        if state is None:
            return float(BACKLIGHT_BRIGHTNESS_MIN), float(BACKLIGHT_BRIGHTNESS_MAX)
        try:
            minimum = float(state.attributes.get("min", BACKLIGHT_BRIGHTNESS_MIN))
            maximum = float(state.attributes.get("max", BACKLIGHT_BRIGHTNESS_MAX))
        except (TypeError, ValueError):
            return float(BACKLIGHT_BRIGHTNESS_MIN), float(BACKLIGHT_BRIGHTNESS_MAX)
        if maximum <= minimum:
            return float(BACKLIGHT_BRIGHTNESS_MIN), float(BACKLIGHT_BRIGHTNESS_MAX)
        return minimum, maximum

    def _brightness_to_device_value(self, entity_id: str, brightness: int) -> float:
        minimum, maximum = self._number_range(entity_id)
        ratio = brightness / float(BACKLIGHT_BRIGHTNESS_MAX)
        return minimum + (maximum - minimum) * ratio

    def _device_value_to_brightness(self, entity_id: str, device_value: float) -> int:
        minimum, maximum = self._number_range(entity_id)
        if maximum <= minimum:
            return DEFAULT_BACKLIGHT_BRIGHTNESS
        ratio = (device_value - minimum) / (maximum - minimum)
        return clamp_backlight_brightness(round(ratio * BACKLIGHT_BRIGHTNESS_MAX))

    def _read_backlight_brightness(self) -> int | None:
        entity_id = self.mapping.backlight_brightness_entity
        if not entity_id:
            return None
        state = self.hass.states.get(entity_id)
        if state is None or state.state in {"unknown", "unavailable"}:
            return None
        try:
            return self._device_value_to_brightness(entity_id, float(state.state))
        except (TypeError, ValueError):
            return None

    async def _async_wait_for_numeric_state(self, entity_id: str, expected: float) -> None:
        deadline = asyncio.get_running_loop().time() + self.confirm_timeout
        while asyncio.get_running_loop().time() < deadline:
            state = self.hass.states.get(entity_id)
            if state is not None and state.state not in {"unknown", "unavailable"}:
                try:
                    if abs(float(state.state) - float(expected)) < 0.51:
                        return
                except (TypeError, ValueError):
                    pass
            await asyncio.sleep(0.1)
        current = self.hass.states.get(entity_id)
        current_state = current.state if current else "missing"
        raise HardwareWriteError(
            f"Timed out waiting for {entity_id} to become '{expected}' (current='{current_state}')"
        )
