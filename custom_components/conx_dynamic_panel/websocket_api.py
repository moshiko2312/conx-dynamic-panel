"""Authenticated WebSocket API for the custom card."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError

from .const import COVER_COMMANDS, DOMAIN
from .coordinator import PanelCoordinator


def _coordinator(hass: HomeAssistant, entry_id: str) -> PanelCoordinator:
    data = hass.data.get(DOMAIN, {}).get(entry_id)
    if data is None:
        raise HomeAssistantError(f"Unknown entry_id: {entry_id}")
    return data["coordinator"]


@callback
async def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register websocket commands."""
    websocket_api.async_register_command(hass, ws_get_config)
    websocket_api.async_register_command(hass, ws_list_profiles)
    websocket_api.async_register_command(hass, ws_create_profile)
    websocket_api.async_register_command(hass, ws_update_profile)
    websocket_api.async_register_command(hass, ws_delete_profile)
    websocket_api.async_register_command(hass, ws_duplicate_profile)
    websocket_api.async_register_command(hass, ws_set_active_profile)
    websocket_api.async_register_command(hass, ws_sync)
    websocket_api.async_register_command(hass, ws_pull)
    websocket_api.async_register_command(hass, ws_export_profiles)
    websocket_api.async_register_command(hass, ws_import_profiles)
    websocket_api.async_register_command(hass, ws_update_panel_name)
    websocket_api.async_register_command(hass, ws_cover_command)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/get_config",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_get_config(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return panel configuration payload."""
    coordinator = _coordinator(hass, msg["entry_id"])
    connection.send_result(msg["id"], coordinator.get_config_payload())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/list_profiles",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_list_profiles(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """List profiles."""
    coordinator = _coordinator(hass, msg["entry_id"])
    connection.send_result(
        msg["id"],
        {
            "profiles": {
                key: profile.to_dict() for key, profile in coordinator.data.profiles.items()
            },
            "active_profile_id": coordinator.data.active_profile_id,
        },
    )


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/create_profile",
        vol.Required("entry_id"): str,
        vol.Required("profile"): dict,
    }
)
@websocket_api.async_response
async def ws_create_profile(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Create a profile."""
    coordinator = _coordinator(hass, msg["entry_id"])
    profile = await coordinator.async_create_profile(msg["profile"])
    connection.send_result(msg["id"], profile.to_dict())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/update_profile",
        vol.Required("entry_id"): str,
        vol.Required("profile_id"): str,
        vol.Required("profile"): dict,
    }
)
@websocket_api.async_response
async def ws_update_profile(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Update a profile draft."""
    coordinator = _coordinator(hass, msg["entry_id"])
    profile = await coordinator.async_update_profile(msg["profile_id"], msg["profile"])
    connection.send_result(msg["id"], profile.to_dict())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/delete_profile",
        vol.Required("entry_id"): str,
        vol.Required("profile_id"): str,
    }
)
@websocket_api.async_response
async def ws_delete_profile(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Delete a profile."""
    coordinator = _coordinator(hass, msg["entry_id"])
    await coordinator.async_delete_profile(msg["profile_id"])
    connection.send_result(msg["id"], {"ok": True})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/duplicate_profile",
        vol.Required("entry_id"): str,
        vol.Required("profile_id"): str,
        vol.Required("new_id"): str,
        vol.Optional("new_name"): str,
    }
)
@websocket_api.async_response
async def ws_duplicate_profile(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Duplicate a profile."""
    coordinator = _coordinator(hass, msg["entry_id"])
    profile = await coordinator.async_duplicate_profile(
        msg["profile_id"], msg["new_id"], msg.get("new_name")
    )
    connection.send_result(msg["id"], profile.to_dict())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/set_active_profile",
        vol.Required("entry_id"): str,
        vol.Required("profile_id"): str,
        vol.Optional("sync", default=False): bool,
    }
)
@websocket_api.async_response
async def ws_set_active_profile(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Set the active profile."""
    coordinator = _coordinator(hass, msg["entry_id"])
    await coordinator.async_activate_profile(msg["profile_id"], sync=msg["sync"])
    connection.send_result(msg["id"], coordinator.get_config_payload())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/sync",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_sync(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Sync active profile to hardware."""
    coordinator = _coordinator(hass, msg["entry_id"])
    await coordinator.async_sync()
    connection.send_result(msg["id"], coordinator.get_config_payload())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/pull",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_pull(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Pull hardware into the active profile draft."""
    coordinator = _coordinator(hass, msg["entry_id"])
    await coordinator.async_pull_from_panel()
    connection.send_result(msg["id"], coordinator.get_config_payload())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/export_profiles",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_export_profiles(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Export profiles as portable JSON."""
    coordinator = _coordinator(hass, msg["entry_id"])
    connection.send_result(msg["id"], coordinator.export_profiles())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/import_profiles",
        vol.Required("entry_id"): str,
        vol.Required("payload"): dict,
        vol.Optional("mode", default="merge"): vol.In(["merge", "replace"]),
    }
)
@websocket_api.async_response
async def ws_import_profiles(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Import profiles from portable JSON (merge or replace)."""
    coordinator = _coordinator(hass, msg["entry_id"])
    result = await coordinator.async_import_profiles(msg["payload"], mode=msg["mode"])
    connection.send_result(msg["id"], result)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/update_panel_name",
        vol.Required("entry_id"): str,
        vol.Required("panel_name"): str,
    }
)
@websocket_api.async_response
async def ws_update_panel_name(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Update the human-readable panel name without reloading the entry."""
    coordinator = _coordinator(hass, msg["entry_id"])
    result = await coordinator.async_update_panel_name(msg["panel_name"])
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/cover_command",
        vol.Required("entry_id"): str,
        vol.Required("command"): vol.In(list(COVER_COMMANDS)),
        vol.Optional("cover_id"): str,
    }
)
@websocket_api.async_response
async def ws_cover_command(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Open, close, or stop a cover through the backend safety engine."""
    coordinator = _coordinator(hass, msg["entry_id"])
    try:
        result = await coordinator.async_cover_command(msg["command"], cover_id=msg.get("cover_id"))
    except ValueError as err:
        raise HomeAssistantError(str(err)) from err
    connection.send_result(msg["id"], result)
