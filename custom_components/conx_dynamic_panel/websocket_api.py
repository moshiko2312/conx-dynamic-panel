"""Authenticated WebSocket API for the custom card."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError

from .const import COVER_COMMANDS, DOMAIN
from .coordinator import PanelCoordinator
from .exceptions import ConXDynamicPanelError, ProfileNotFoundError


def _coordinator(hass: HomeAssistant, entry_id: str) -> PanelCoordinator:
    data = hass.data.get(DOMAIN, {}).get(entry_id)
    if data is None:
        raise HomeAssistantError(f"Unknown entry_id: {entry_id}")
    return data["coordinator"]


def _send_schedule_conflict(
    connection: websocket_api.ActiveConnection, msg_id: int, err: ValueError
) -> None:
    conflicts = getattr(err, "conflicts", None) or []
    connection.send_error(
        msg_id,
        "schedule_conflict",
        str(err),
        {"conflicts": conflicts},
    )


@callback
async def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register websocket commands."""
    websocket_api.async_register_command(hass, ws_get_config)
    websocket_api.async_register_command(hass, ws_subscribe)
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
    websocket_api.async_register_command(hass, ws_export_scheduler)
    websocket_api.async_register_command(hass, ws_import_scheduler)
    websocket_api.async_register_command(hass, ws_update_panel_name)
    websocket_api.async_register_command(hass, ws_cover_command)
    websocket_api.async_register_command(hass, ws_execute_button)
    websocket_api.async_register_command(hass, ws_upsert_scheduler_task)
    websocket_api.async_register_command(hass, ws_delete_scheduler_task)
    websocket_api.async_register_command(hass, ws_set_default_profile)
    websocket_api.async_register_command(hass, ws_set_holiday_mode)
    websocket_api.async_register_command(hass, ws_set_scheduler_task_enabled)


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
        vol.Required("type"): "conx_dynamic_panel/subscribe",
        vol.Required("entry_id"): str,
    }
)
@callback
def ws_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Push live runtime updates (sync/cover/relays) without touching drafts."""
    coordinator = _coordinator(hass, msg["entry_id"])

    @callback
    def _push() -> None:
        connection.send_message(
            websocket_api.event_message(msg["id"], coordinator.get_runtime_payload())
        )

    connection.subscriptions[msg["id"]] = coordinator.runtime.async_add_listener(_push)
    connection.send_result(msg["id"])
    _push()


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
    """Delete a profile and return the updated panel config."""
    coordinator = _coordinator(hass, msg["entry_id"])
    try:
        await coordinator.async_delete_profile(msg["profile_id"])
    except (ValueError, ProfileNotFoundError, ConXDynamicPanelError) as err:
        raise HomeAssistantError(str(err)) from err
    connection.send_result(msg["id"], coordinator.get_config_payload())


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
    try:
        profile = await coordinator.async_duplicate_profile(
            msg["profile_id"], msg["new_id"], msg.get("new_name")
        )
    except (ValueError, ProfileNotFoundError, ConXDynamicPanelError) as err:
        raise HomeAssistantError(str(err)) from err
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


@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/export_scheduler",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_export_scheduler(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Export scheduler tasks as portable JSON (local + masters for this entry)."""
    coordinator = _coordinator(hass, msg["entry_id"])
    connection.send_result(msg["id"], coordinator.export_scheduler())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/import_scheduler",
        vol.Required("entry_id"): str,
        vol.Required("payload"): dict,
        vol.Optional("mode", default="merge"): vol.In(["merge", "replace"]),
    }
)
@websocket_api.async_response
async def ws_import_scheduler(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Import scheduler tasks from portable JSON (merge or replace local)."""
    coordinator = _coordinator(hass, msg["entry_id"])
    try:
        result = await coordinator.async_import_scheduler(msg["payload"], mode=msg["mode"])
    except ValueError as err:
        if getattr(err, "conflicts", None):
            _send_schedule_conflict(connection, msg["id"], err)
            return
        raise HomeAssistantError(str(err)) from err
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


@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/execute_button",
        vol.Required("entry_id"): str,
        vol.Required("button"): vol.All(vol.Coerce(int), vol.Range(min=1, max=4)),
    }
)
@websocket_api.async_response
async def ws_execute_button(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Simulate a physical press from the Lovelace card (drives relays + actions)."""
    coordinator = _coordinator(hass, msg["entry_id"])
    try:
        await coordinator.async_execute_button(int(msg["button"]))
    except ValueError as err:
        raise HomeAssistantError(str(err)) from err
    connection.send_result(msg["id"], coordinator.get_runtime_payload())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/upsert_scheduler_task",
        vol.Required("entry_id"): str,
        vol.Required("task"): dict,
    }
)
@websocket_api.async_response
async def ws_upsert_scheduler_task(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Create or update a scheduler task (blocks on profile conflicts)."""
    coordinator = _coordinator(hass, msg["entry_id"])
    try:
        task = await coordinator.async_upsert_scheduler_task(msg["task"])
    except ValueError as err:
        if getattr(err, "conflicts", None):
            _send_schedule_conflict(connection, msg["id"], err)
            return
        raise HomeAssistantError(str(err)) from err
    connection.send_result(
        msg["id"],
        {
            "task": task.to_dict(),
            **coordinator.scheduler_payload(),
            "config": coordinator.get_config_payload(),
        },
    )


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/delete_scheduler_task",
        vol.Required("entry_id"): str,
        vol.Required("task_id"): str,
    }
)
@websocket_api.async_response
async def ws_delete_scheduler_task(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Delete a scheduler task."""
    coordinator = _coordinator(hass, msg["entry_id"])
    try:
        await coordinator.async_delete_scheduler_task(msg["task_id"])
    except ValueError as err:
        raise HomeAssistantError(str(err)) from err
    connection.send_result(msg["id"], coordinator.get_config_payload())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/set_default_profile",
        vol.Required("entry_id"): str,
        vol.Required("profile_id"): str,
    }
)
@websocket_api.async_response
async def ws_set_default_profile(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Set the panel default profile used outside timeline ranges."""
    coordinator = _coordinator(hass, msg["entry_id"])
    await coordinator.async_set_default_profile(msg["profile_id"])
    connection.send_result(msg["id"], coordinator.get_config_payload())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/set_holiday_mode",
        vol.Required("entry_id"): str,
        vol.Required("enabled"): bool,
        vol.Optional("scope"): vol.In(["panel", "master"]),
    }
)
@websocket_api.async_response
async def ws_set_holiday_mode(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Toggle panel or master holiday mode.

    ``scope=panel`` (default): suspend schedulers for this entry only.
    ``scope=master``: master holiday — suspends schedulers on every panel.
    """
    coordinator = _coordinator(hass, msg["entry_id"])
    await coordinator.async_set_holiday_mode(
        bool(msg["enabled"]), scope=str(msg.get("scope") or "panel")
    )
    connection.send_result(msg["id"], coordinator.get_config_payload())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "conx_dynamic_panel/set_scheduler_task_enabled",
        vol.Required("entry_id"): str,
        vol.Required("task_id"): str,
        vol.Required("enabled"): bool,
    }
)
@websocket_api.async_response
async def ws_set_scheduler_task_enabled(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Enable or disable a scheduler task."""
    coordinator = _coordinator(hass, msg["entry_id"])
    try:
        await coordinator.async_set_scheduler_task_enabled(msg["task_id"], bool(msg["enabled"]))
    except ValueError as err:
        if getattr(err, "conflicts", None):
            _send_schedule_conflict(connection, msg["id"], err)
            return
        raise HomeAssistantError(str(err)) from err
    connection.send_result(msg["id"], coordinator.get_config_payload())
