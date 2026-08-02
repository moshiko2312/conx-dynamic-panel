"""Config, reconfigure, and options flows."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import selector

from .adapters import create_adapter
from .const import (
    ADAPTER_ZEMISMART_4GANG,
    CONF_ADAPTER_TYPE,
    CONF_AUTO_SYNC,
    CONF_BACKLIGHT_ENTITY,
    CONF_CHILD_LOCK_ENTITY,
    CONF_COLOR_OFF_ENTITY,
    CONF_COLOR_ON_ENTITY,
    CONF_CONFIRM_TIMEOUT,
    CONF_LOG_LEVEL,
    CONF_NAME_ENTITIES,
    CONF_PANEL_NAME,
    CONF_RADAR_ENTITY,
    CONF_RELAY_ENTITIES,
    CONF_SYNC_TIMEOUT,
    DEFAULT_AUTO_SYNC,
    DEFAULT_CONFIRM_TIMEOUT,
    DEFAULT_LOG_LEVEL,
    DEFAULT_SYNC_TIMEOUT,
    DOMAIN,
)
from .exceptions import MappingValidationError
from .models import EntityMapping
from .suppression import SuppressionTracker

STEP_USER = "user"
STEP_RELAYS = "relays"
STEP_NAMES = "names"
STEP_SETTINGS = "settings"
STEP_SUMMARY = "summary"


def _entity_selector(domain: str) -> selector.EntitySelector:
    return selector.EntitySelector(
        selector.EntitySelectorConfig(domain=domain, multiple=False)
    )


def _required_entity(key: str, domain: str, default: str | None = None) -> dict[Any, Any]:
    selector_obj = _entity_selector(domain)
    if default:
        return {vol.Required(key, default=default): selector_obj}
    return {vol.Required(key): selector_obj}


def _unique_relay_key(relays: list[str]) -> str:
    return "|".join(sorted(relays))


async def _async_validate_mapping(
    hass: HomeAssistant, mapping: EntityMapping
) -> None:
    adapter = create_adapter(
        hass,
        mapping,
        SuppressionTracker(),
        confirm_timeout=DEFAULT_CONFIRM_TIMEOUT,
    )
    await adapter.async_validate_mapping()


class ConXDynamicPanelConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for ConX Dynamic Panel."""

    VERSION = 1

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}
        self._reconfigure = False

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Collect panel identity."""
        errors: dict[str, str] = {}
        if user_input is not None:
            self._data[CONF_PANEL_NAME] = user_input[CONF_PANEL_NAME]
            self._data[CONF_ADAPTER_TYPE] = user_input[CONF_ADAPTER_TYPE]
            return await self.async_step_relays()
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_PANEL_NAME,
                    default=self._data.get(CONF_PANEL_NAME, ""),
                ): str,
                vol.Required(
                    CONF_ADAPTER_TYPE,
                    default=self._data.get(CONF_ADAPTER_TYPE, ADAPTER_ZEMISMART_4GANG),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[
                            {
                                "value": ADAPTER_ZEMISMART_4GANG,
                                "label": "Zemismart 4 Gang",
                            }
                        ],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                    )
                ),
            }
        )
        return self.async_show_form(step_id=STEP_USER, data_schema=schema, errors=errors)

    async def async_step_relays(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Collect four relay switch entities."""
        errors: dict[str, str] = {}
        if user_input is not None:
            relays = [
                user_input["relay_l1"],
                user_input["relay_l2"],
                user_input["relay_l3"],
                user_input["relay_l4"],
            ]
            if len(set(relays)) != 4:
                errors["base"] = "duplicate_relays"
            else:
                await self.async_set_unique_id(_unique_relay_key(relays))
                if self._reconfigure:
                    current_entry_id = self.context.get("entry_id")
                    for entry in self._async_current_entries():
                        if (
                            entry.unique_id == self.unique_id
                            and entry.entry_id != current_entry_id
                        ):
                            return self.async_abort(reason="already_configured")
                else:
                    self._abort_if_unique_id_configured()
                self._data[CONF_RELAY_ENTITIES] = relays
                return await self.async_step_names()
        defaults = list(self._data.get(CONF_RELAY_ENTITIES) or ("", "", "", ""))
        schema_dict: dict[Any, Any] = {}
        for index, key in enumerate(("relay_l1", "relay_l2", "relay_l3", "relay_l4")):
            schema_dict.update(_required_entity(key, "switch", defaults[index] or None))
        return self.async_show_form(
            step_id=STEP_RELAYS, data_schema=vol.Schema(schema_dict), errors=errors
        )

    async def async_step_names(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Collect four text name entities."""
        errors: dict[str, str] = {}
        if user_input is not None:
            names = [
                user_input["name_l1"],
                user_input["name_l2"],
                user_input["name_l3"],
                user_input["name_l4"],
            ]
            if len(set(names)) != 4:
                errors["base"] = "duplicate_names"
            else:
                self._data[CONF_NAME_ENTITIES] = names
                return await self.async_step_settings()
        defaults = list(self._data.get(CONF_NAME_ENTITIES) or ("", "", "", ""))
        schema_dict: dict[Any, Any] = {}
        for index, key in enumerate(("name_l1", "name_l2", "name_l3", "name_l4")):
            schema_dict.update(_required_entity(key, "text", defaults[index] or None))
        return self.async_show_form(
            step_id=STEP_NAMES, data_schema=vol.Schema(schema_dict), errors=errors
        )

    async def async_step_settings(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Collect shared setting entities."""
        if user_input is not None:
            self._data.update(user_input)
            return await self.async_step_summary()
        schema_dict: dict[Any, Any] = {}
        schema_dict.update(
            _required_entity(
                CONF_COLOR_OFF_ENTITY, "select", self._data.get(CONF_COLOR_OFF_ENTITY)
            )
        )
        schema_dict.update(
            _required_entity(
                CONF_COLOR_ON_ENTITY, "select", self._data.get(CONF_COLOR_ON_ENTITY)
            )
        )
        schema_dict.update(
            _required_entity(CONF_RADAR_ENTITY, "select", self._data.get(CONF_RADAR_ENTITY))
        )
        schema_dict.update(
            _required_entity(
                CONF_BACKLIGHT_ENTITY, "switch", self._data.get(CONF_BACKLIGHT_ENTITY)
            )
        )
        schema_dict.update(
            _required_entity(
                CONF_CHILD_LOCK_ENTITY, "switch", self._data.get(CONF_CHILD_LOCK_ENTITY)
            )
        )
        return self.async_show_form(step_id=STEP_SETTINGS, data_schema=vol.Schema(schema_dict))

    async def async_step_summary(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Validate mapping and create or update the entry."""
        errors: dict[str, str] = {}
        mapping = EntityMapping.from_dict(self._data)
        validation_error: str | None = None
        try:
            await _async_validate_mapping(self.hass, mapping)
        except MappingValidationError as err:
            errors["base"] = "invalid_mapping"
            validation_error = str(err)

        if user_input is not None and not errors:
            if self._reconfigure:
                return self.async_update_reload_and_abort(
                    self._get_reconfigure_entry(),
                    data=mapping.to_dict(),
                    unique_id=_unique_relay_key(list(mapping.relay_entities)),
                )
            return self.async_create_entry(
                title=mapping.panel_name,
                data=mapping.to_dict(),
                options={
                    CONF_SYNC_TIMEOUT: DEFAULT_SYNC_TIMEOUT,
                    CONF_CONFIRM_TIMEOUT: DEFAULT_CONFIRM_TIMEOUT,
                    CONF_AUTO_SYNC: DEFAULT_AUTO_SYNC,
                    CONF_LOG_LEVEL: DEFAULT_LOG_LEVEL,
                },
            )

        placeholders = {"panel_name": mapping.panel_name, "error": validation_error or ""}
        return self.async_show_form(
            step_id=STEP_SUMMARY,
            data_schema=vol.Schema(
                {vol.Required("confirm", default=True): bool}
                if not errors
                else {}
            ),
            errors=errors,
            description_placeholders=placeholders,
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Reconfigure entity mappings without deleting profiles."""
        entry = self._get_reconfigure_entry()
        self._reconfigure = True
        self._data = dict(entry.data)
        return await self.async_step_user()

    def _get_reconfigure_entry(self) -> config_entries.ConfigEntry:
        return self.hass.config_entries.async_get_entry(self.context["entry_id"])  # type: ignore[return-value]

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Create options flow."""
        return ConXDynamicPanelOptionsFlow()


class ConXDynamicPanelOptionsFlow(config_entries.OptionsFlow):
    """Handle options."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Manage options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)
        options = self.config_entry.options
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_SYNC_TIMEOUT,
                    default=options.get(CONF_SYNC_TIMEOUT, DEFAULT_SYNC_TIMEOUT),
                ): vol.Coerce(float),
                vol.Required(
                    CONF_CONFIRM_TIMEOUT,
                    default=options.get(CONF_CONFIRM_TIMEOUT, DEFAULT_CONFIRM_TIMEOUT),
                ): vol.Coerce(float),
                vol.Required(
                    CONF_AUTO_SYNC,
                    default=options.get(CONF_AUTO_SYNC, DEFAULT_AUTO_SYNC),
                ): bool,
                vol.Required(
                    CONF_LOG_LEVEL,
                    default=options.get(CONF_LOG_LEVEL, DEFAULT_LOG_LEVEL),
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=["debug", "info", "warning", "error"],
                        mode=selector.SelectSelectorMode.DROPDOWN,
                    )
                ),
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
