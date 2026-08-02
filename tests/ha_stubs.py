"""Minimal Home Assistant stubs for unit tests without installing HA."""

from __future__ import annotations

import sys
import types
from typing import Any


def install() -> None:
    """Install lightweight homeassistant stubs into sys.modules."""
    if sys.modules.get("homeassistant") and getattr(
        sys.modules["homeassistant"], "_conx_stub", False
    ):
        return

    def module(name: str) -> types.ModuleType:
        mod = types.ModuleType(name)
        mod._conx_stub = True  # type: ignore[attr-defined]
        sys.modules[name] = mod
        return mod

    ha = module("homeassistant")
    ha._conx_stub = True  # type: ignore[attr-defined]

    const = module("homeassistant.const")
    const.STATE_UNAVAILABLE = "unavailable"
    const.STATE_UNKNOWN = "unknown"
    const.Platform = types.SimpleNamespace(
        SELECT="select",
        SENSOR="sensor",
        BUTTON="button",
        SWITCH="switch",
    )
    const.CONF_NAME = "name"

    core = module("homeassistant.core")

    class HomeAssistant:  # noqa: D101
        pass

    class Event:  # noqa: D101
        def __init__(self, data: dict[str, Any] | None = None) -> None:
            self.data = data or {}

    def callback(func):  # noqa: ANN001, ANN201
        return func

    core.HomeAssistant = HomeAssistant
    core.Event = Event
    core.callback = callback
    core.ServiceCall = type("ServiceCall", (), {})

    config_entries = module("homeassistant.config_entries")

    class ConfigEntry:  # noqa: D101
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            self.entry_id = kwargs.get("entry_id", "entry")
            self.data = kwargs.get("data", {})
            self.options = kwargs.get("options", {})
            self.runtime_data = None

        def async_on_unload(self, func: Any) -> None:
            return None

        def add_update_listener(self, func: Any) -> Any:
            return func

    class ConfigFlow:  # noqa: D101
        def __init_subclass__(cls, **kwargs: Any) -> None:
            return None

        async def async_set_unique_id(self, unique_id: str) -> None:
            self.unique_id = unique_id

        def _abort_if_unique_id_configured(self) -> None:
            return None

        def _async_current_entries(self) -> list[Any]:
            return []

        def async_show_form(self, **kwargs: Any) -> dict[str, Any]:
            return {"type": "form", **kwargs}

        def async_create_entry(self, **kwargs: Any) -> dict[str, Any]:
            return {"type": "create_entry", **kwargs}

        def async_abort(self, **kwargs: Any) -> dict[str, Any]:
            return {"type": "abort", **kwargs}

        def async_update_reload_and_abort(self, *args: Any, **kwargs: Any) -> dict[str, Any]:
            return {"type": "abort", "reason": "reconfigure_successful", **kwargs}

    class OptionsFlow:  # noqa: D101
        @property
        def config_entry(self) -> Any:
            return getattr(self, "_config_entry", ConfigEntry())

    config_entries.ConfigEntry = ConfigEntry
    config_entries.ConfigFlow = ConfigFlow
    config_entries.OptionsFlow = OptionsFlow

    exceptions = module("homeassistant.exceptions")

    class HomeAssistantError(Exception):
        pass

    exceptions.HomeAssistantError = HomeAssistantError

    data_entry_flow = module("homeassistant.data_entry_flow")
    data_entry_flow.FlowResult = dict

    module("homeassistant.helpers")
    storage = module("homeassistant.helpers.storage")

    class Store:  # noqa: D101
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            self._data = None

        async def async_load(self) -> Any:
            return self._data

        async def async_save(self, data: Any) -> None:
            self._data = data

    storage.Store = Store

    event_helpers = module("homeassistant.helpers.event")
    event_helpers.async_track_state_change_event = lambda *args, **kwargs: (lambda: None)

    entity = module("homeassistant.helpers.entity")

    class Entity:  # noqa: D101
        def async_on_remove(self, func: Any) -> None:
            return None

        async def async_added_to_hass(self) -> None:
            return None

        def async_write_ha_state(self) -> None:
            return None

    class EntityCategory:  # noqa: D101
        DIAGNOSTIC = "diagnostic"

    entity.Entity = Entity
    entity.EntityCategory = EntityCategory

    device_registry = module("homeassistant.helpers.device_registry")
    device_registry.DeviceInfo = dict
    device_registry.async_get = lambda hass: types.SimpleNamespace(
        async_get_or_create=lambda **kwargs: None,
        async_get=lambda device_id: None,
    )

    entity_registry = module("homeassistant.helpers.entity_registry")
    entity_registry.async_get = lambda hass: types.SimpleNamespace(async_get=lambda entity_id: None)

    selector = module("homeassistant.helpers.selector")

    class _Cfg:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

    class EntitySelector:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        def __call__(self, value: Any) -> Any:
            return value

    class SelectSelector:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        def __call__(self, value: Any) -> Any:
            return value

    selector.EntitySelector = EntitySelector
    selector.EntitySelectorConfig = _Cfg
    selector.SelectSelector = SelectSelector
    selector.SelectSelectorConfig = _Cfg
    selector.SelectSelectorMode = types.SimpleNamespace(DROPDOWN="dropdown")

    cv = module("homeassistant.helpers.config_validation")
    cv.string = str
    cv.boolean = bool

    http = module("homeassistant.helpers.http")

    class StaticPathConfig:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

    http.StaticPathConfig = StaticPathConfig

    module("homeassistant.components")
    for name in ("select", "sensor", "button", "switch"):
        mod = module(f"homeassistant.components.{name}")
        base = type(
            name.title() + "Entity",
            (),
            {},
        )
        setattr(mod, f"{name.title()}Entity", base)

    entity_platform = module("homeassistant.helpers.entity_platform")
    entity_platform.AddEntitiesCallback = callable

    websocket_api = module("homeassistant.components.websocket_api")

    def websocket_command(schema: Any):  # noqa: ANN201
        def decorator(func):  # noqa: ANN001, ANN201
            return func

        return decorator

    def async_response(func):  # noqa: ANN001, ANN201
        return func

    def require_admin(func):  # noqa: ANN001, ANN201
        return func

    websocket_api.websocket_command = websocket_command
    websocket_api.async_response = async_response
    websocket_api.require_admin = require_admin
    websocket_api.async_register_command = lambda *args, **kwargs: None
    websocket_api.ActiveConnection = type("ActiveConnection", (), {})
