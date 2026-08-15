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

    # CI unit tests install voluptuous; provide a tiny fallback when absent.
    if "voluptuous" not in sys.modules:
        try:
            import voluptuous  # noqa: F401
        except ImportError:
            vol = types.ModuleType("voluptuous")

            class _Schema:
                def __init__(self, *args: Any, **kwargs: Any) -> None:
                    pass

                def __call__(self, value: Any) -> Any:
                    return value

            class _Required:
                def __init__(self, key: Any, default: Any = None) -> None:
                    self.key = key
                    self.default = default

                def __hash__(self) -> int:
                    return hash(self.key)

                def __eq__(self, other: object) -> bool:
                    return isinstance(other, _Required) and other.key == self.key

            class _Optional:
                def __init__(self, key: Any, default: Any = None) -> None:
                    self.key = key
                    self.default = default

                def __hash__(self) -> int:
                    return hash(self.key)

                def __eq__(self, other: object) -> bool:
                    return isinstance(other, _Optional) and other.key == self.key

            vol.Schema = _Schema  # type: ignore[attr-defined]
            vol.Required = _Required  # type: ignore[attr-defined]
            vol.Optional = _Optional  # type: ignore[attr-defined]
            vol.All = lambda *args: args  # type: ignore[attr-defined]
            vol.Coerce = lambda typ: typ  # type: ignore[attr-defined]
            sys.modules["voluptuous"] = vol

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
    const.EVENT_CALL_SERVICE = "call_service"
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

    class SupportsResponse:  # noqa: D101
        NONE = "none"
        OPTIONAL = "optional"
        ONLY = "only"

    core.HomeAssistant = HomeAssistant
    core.Event = Event
    core.callback = callback
    core.ServiceCall = type("ServiceCall", (), {})
    core.SupportsResponse = SupportsResponse

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
        """Minimal HA Store stub with version-mismatch migration (like core)."""

        def __init__(self, hass: Any, version: int, key: str, *args: Any, **kwargs: Any) -> None:
            self.hass = hass
            self.version = int(version)
            self.minor_version = int(kwargs.get("minor_version", 1))
            self.key = key
            # On-disk envelope: {"version", "minor_version", "data"} or None.
            self._envelope: dict[str, Any] | None = None
            # Back-compat for older tests that poked ``_data`` directly.
            self._data = None

        async def async_load(self) -> Any:
            if self._envelope is None and self._data is not None:
                # Legacy stub usage: treat ``_data`` as already-unwrapped payload.
                return self._data
            if self._envelope is None:
                return None
            data = self._envelope
            disk_version = int(data.get("version", 1))
            disk_minor = int(data.get("minor_version", 1))
            if disk_version == self.version and disk_minor == self.minor_version:
                return data.get("data")
            try:
                stored = await self._async_migrate_func(
                    disk_version, disk_minor, data.get("data")
                )
            except NotImplementedError:
                if disk_version != self.version:
                    raise
                stored = data.get("data")
            await self.async_save(stored)
            return stored

        async def async_save(self, data: Any) -> None:
            self._envelope = {
                "version": self.version,
                "minor_version": self.minor_version,
                "key": self.key,
                "data": data,
            }
            self._data = data

        async def _async_migrate_func(
            self, old_major_version: int, old_minor_version: int, old_data: Any
        ) -> Any:
            raise NotImplementedError

    storage.Store = Store

    event_helpers = module("homeassistant.helpers.event")
    event_helpers.async_track_state_change_event = lambda *args, **kwargs: lambda: None
    event_helpers.async_track_point_in_time = lambda *args, **kwargs: lambda: None

    util = module("homeassistant.util")
    dt_util = module("homeassistant.util.dt")

    def _utcnow():
        from datetime import UTC, datetime

        return datetime.now(UTC)

    dt_util.utcnow = _utcnow
    dt_util.now = _utcnow

    entity = module("homeassistant.helpers.entity")

    class Entity:  # noqa: D101
        _attr_unique_id: str | None = None
        entity_id: str | None = None
        hass: Any = None

        @property
        def unique_id(self) -> str | None:
            return self._attr_unique_id

        def async_on_remove(self, func: Any) -> None:
            return None

        async def async_added_to_hass(self) -> None:
            return None

        async def async_remove(self, *, force_remove: bool = False) -> None:
            self._force_remove = force_remove  # type: ignore[attr-defined]
            self._removed = True  # type: ignore[attr-defined]

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

    class _FakeEntityRegistry:
        def __init__(self) -> None:
            self.entities: dict[str, types.SimpleNamespace] = {}
            self.removed: list[str] = []
            self._by_unique: dict[tuple[str, str, str], str] = {}

        def async_get(self, entity_id: str) -> types.SimpleNamespace | None:
            return self.entities.get(entity_id)

        def async_get_entity_id(
            self, domain: str, platform: str, unique_id: str
        ) -> str | None:
            return self._by_unique.get((domain, platform, unique_id))

        def async_remove(self, entity_id: str) -> None:
            entry = self.entities.pop(entity_id, None)
            if entry is None:
                return
            self.removed.append(entity_id)
            key = (entry.domain, entry.platform, entry.unique_id)
            self._by_unique.pop(key, None)

        def register(
            self,
            entity_id: str,
            *,
            domain: str = "switch",
            platform: str = "conx_dynamic_panel",
            unique_id: str,
        ) -> None:
            entry = types.SimpleNamespace(
                entity_id=entity_id,
                domain=domain,
                platform=platform,
                unique_id=unique_id,
                disabled=False,
            )
            self.entities[entity_id] = entry
            self._by_unique[(domain, platform, unique_id)] = entity_id

    _default_registry = _FakeEntityRegistry()

    def _async_get_entity_registry(hass: Any) -> _FakeEntityRegistry:
        existing = getattr(hass, "entity_registry", None)
        if existing is not None:
            return existing
        data = getattr(hass, "data", None)
        if isinstance(data, dict):
            reg = data.setdefault("_entity_registry", _FakeEntityRegistry())
            return reg  # type: ignore[no-any-return]
        return _default_registry

    entity_registry.async_get = _async_get_entity_registry
    entity_registry.FakeEntityRegistry = _FakeEntityRegistry  # type: ignore[attr-defined]

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
    websocket_api.event_message = lambda msg_id, event: {
        "id": msg_id,
        "type": "event",
        "event": event,
    }
    websocket_api.result_message = lambda msg_id, result=None: {
        "id": msg_id,
        "type": "result",
        "success": True,
        "result": result,
    }
