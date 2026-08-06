"""Integration services."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr

from .const import (
    ATTR_BUTTON,
    ATTR_COMMAND,
    ATTR_COVER_ID,
    ATTR_DEVICE_ID,
    ATTR_ENTRY_ID,
    ATTR_MODE,
    ATTR_PAYLOAD,
    ATTR_PROFILE_ID,
    ATTR_SYNC,
    COVER_COMMANDS,
    DOMAIN,
    IMPORT_MODE_MERGE,
    IMPORT_MODES,
    SERVICE_ACTIVATE_PROFILE,
    SERVICE_COVER_COMMAND,
    SERVICE_EXECUTE_BUTTON,
    SERVICE_EXPORT_PROFILES,
    SERVICE_EXPORT_SCHEDULER,
    SERVICE_IMPORT_PROFILES,
    SERVICE_IMPORT_SCHEDULER,
    SERVICE_PULL_FROM_PANEL,
    SERVICE_RELOAD,
    SERVICE_SYNC,
)
from .coordinator import PanelCoordinator

ENTRY_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_ENTRY_ID): cv.string,
        vol.Optional(ATTR_DEVICE_ID): cv.string,
    }
)


def _get_coordinator(hass: HomeAssistant, call: ServiceCall) -> PanelCoordinator:
    entry_id = call.data.get(ATTR_ENTRY_ID)
    device_id = call.data.get(ATTR_DEVICE_ID)
    if device_id and not entry_id:
        registry = dr.async_get(hass)
        device = registry.async_get(device_id)
        if device is None or not device.config_entries:
            raise HomeAssistantError("Unknown device")
        entry_id = next(iter(device.config_entries))
    if not entry_id:
        raise HomeAssistantError("entry_id or device_id is required")
    data = hass.data.get(DOMAIN, {}).get(entry_id)
    if data is None:
        raise HomeAssistantError(f"Unknown config entry: {entry_id}")
    return data["coordinator"]


async def async_register_services(hass: HomeAssistant) -> None:
    """Register domain services once."""
    if hass.services.has_service(DOMAIN, SERVICE_SYNC):
        return

    async def handle_sync(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass, call)
        await coordinator.async_sync()

    async def handle_activate(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass, call)
        await coordinator.async_activate_profile(
            call.data[ATTR_PROFILE_ID],
            sync=bool(call.data.get(ATTR_SYNC, False)),
        )

    async def handle_pull(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass, call)
        await coordinator.async_pull_from_panel()

    async def handle_execute(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass, call)
        await coordinator.async_execute_button(int(call.data[ATTR_BUTTON]))

    async def handle_cover_command(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass, call)
        try:
            await coordinator.async_cover_command(
                str(call.data[ATTR_COMMAND]),
                cover_id=call.data.get(ATTR_COVER_ID),
            )
        except ValueError as err:
            raise HomeAssistantError(str(err)) from err

    async def handle_reload(call: ServiceCall) -> None:
        entry_id = call.data.get(ATTR_ENTRY_ID)
        if entry_id:
            await hass.config_entries.async_reload(entry_id)
            return
        for item in list(hass.data.get(DOMAIN, {})):
            await hass.config_entries.async_reload(item)

    async def handle_export(call: ServiceCall) -> dict[str, Any]:
        coordinator = _get_coordinator(hass, call)
        return coordinator.export_profiles()

    async def handle_import(call: ServiceCall) -> dict[str, Any]:
        coordinator = _get_coordinator(hass, call)
        payload = call.data[ATTR_PAYLOAD]
        if not isinstance(payload, dict):
            raise HomeAssistantError("payload must be an object")
        mode = str(call.data.get(ATTR_MODE, IMPORT_MODE_MERGE))
        try:
            return await coordinator.async_import_profiles(payload, mode=mode)
        except ValueError as err:
            raise HomeAssistantError(str(err)) from err

    async def handle_export_scheduler(call: ServiceCall) -> dict[str, Any]:
        coordinator = _get_coordinator(hass, call)
        return coordinator.export_scheduler()

    async def handle_import_scheduler(call: ServiceCall) -> dict[str, Any]:
        coordinator = _get_coordinator(hass, call)
        payload = call.data[ATTR_PAYLOAD]
        if not isinstance(payload, dict):
            raise HomeAssistantError("payload must be an object")
        mode = str(call.data.get(ATTR_MODE, IMPORT_MODE_MERGE))
        try:
            return await coordinator.async_import_scheduler(payload, mode=mode)
        except ValueError as err:
            raise HomeAssistantError(str(err)) from err

    hass.services.async_register(
        DOMAIN,
        SERVICE_SYNC,
        handle_sync,
        schema=ENTRY_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_ACTIVATE_PROFILE,
        handle_activate,
        schema=ENTRY_SCHEMA.extend(
            {
                vol.Required(ATTR_PROFILE_ID): cv.string,
                vol.Optional(ATTR_SYNC, default=False): cv.boolean,
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_PULL_FROM_PANEL,
        handle_pull,
        schema=ENTRY_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_EXECUTE_BUTTON,
        handle_execute,
        schema=ENTRY_SCHEMA.extend(
            {vol.Required(ATTR_BUTTON): vol.All(int, vol.Range(min=1, max=4))}
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_COVER_COMMAND,
        handle_cover_command,
        schema=ENTRY_SCHEMA.extend(
            {
                vol.Required(ATTR_COMMAND): vol.In(list(COVER_COMMANDS)),
                vol.Optional(ATTR_COVER_ID): cv.string,
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_RELOAD,
        handle_reload,
        schema=vol.Schema({vol.Optional(ATTR_ENTRY_ID): cv.string}),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_EXPORT_PROFILES,
        handle_export,
        schema=ENTRY_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_IMPORT_PROFILES,
        handle_import,
        schema=ENTRY_SCHEMA.extend(
            {
                vol.Required(ATTR_PAYLOAD): dict,
                vol.Optional(ATTR_MODE, default=IMPORT_MODE_MERGE): vol.In(IMPORT_MODES),
            }
        ),
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_EXPORT_SCHEDULER,
        handle_export_scheduler,
        schema=ENTRY_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_IMPORT_SCHEDULER,
        handle_import_scheduler,
        schema=ENTRY_SCHEMA.extend(
            {
                vol.Required(ATTR_PAYLOAD): dict,
                vol.Optional(ATTR_MODE, default=IMPORT_MODE_MERGE): vol.In(IMPORT_MODES),
            }
        ),
        supports_response=SupportsResponse.OPTIONAL,
    )


def async_unregister_services(hass: HomeAssistant) -> None:
    """Remove domain services when no entries remain."""
    for service in (
        SERVICE_SYNC,
        SERVICE_ACTIVATE_PROFILE,
        SERVICE_PULL_FROM_PANEL,
        SERVICE_EXECUTE_BUTTON,
        SERVICE_COVER_COMMAND,
        SERVICE_RELOAD,
        SERVICE_EXPORT_PROFILES,
        SERVICE_IMPORT_PROFILES,
        SERVICE_EXPORT_SCHEDULER,
        SERVICE_IMPORT_SCHEDULER,
    ):
        if hass.services.has_service(DOMAIN, service):
            hass.services.async_remove(DOMAIN, service)
