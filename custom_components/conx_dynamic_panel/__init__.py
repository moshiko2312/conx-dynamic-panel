"""ConX Dynamic Panel Home Assistant integration."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.http import StaticPathConfig

from .adapters import create_adapter
from .const import (
    CONF_CONFIRM_TIMEOUT,
    CONF_LOG_LEVEL,
    DEFAULT_CONFIRM_TIMEOUT,
    DEFAULT_LOG_LEVEL,
    DOMAIN,
    FRONTEND_SCRIPT_URL,
    MANUFACTURER,
    MODEL_ZEMISMART_4GANG,
)
from .coordinator import PanelCoordinator
from .models import EntityMapping
from .runtime import PanelRuntime
from .services import async_register_services, async_unregister_services
from .storage import PanelStore
from .suppression import SuppressionTracker
from .websocket_api import async_register_websocket_api

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [
    Platform.SELECT,
    Platform.SENSOR,
    Platform.BUTTON,
    Platform.SWITCH,
]

type ConXConfigEntry = ConfigEntry[PanelRuntime]


async def async_setup(hass: HomeAssistant, _config: dict) -> bool:
    """Set up the integration domain."""
    hass.data.setdefault(DOMAIN, {})
    await async_register_websocket_api(hass)
    await _async_register_frontend(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConXConfigEntry) -> bool:
    """Set up a config entry."""
    hass.data.setdefault(DOMAIN, {})
    _apply_log_level(entry)
    mapping = EntityMapping.from_dict(dict(entry.data))
    suppression = SuppressionTracker()
    confirm_timeout = float(
        entry.options.get(CONF_CONFIRM_TIMEOUT, DEFAULT_CONFIRM_TIMEOUT)
    )
    adapter = create_adapter(
        hass,
        mapping,
        suppression,
        confirm_timeout=confirm_timeout,
    )
    await adapter.async_validate_mapping()

    store = PanelStore(hass, entry.entry_id)
    runtime = PanelRuntime(
        hass=hass,
        entry=entry,
        mapping=mapping,
        store=store,
        adapter=adapter,
        suppression=suppression,
    )
    coordinator = PanelCoordinator(runtime)
    await coordinator.async_setup()

    device_registry = dr.async_get(hass)
    device_registry.async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(DOMAIN, entry.entry_id)},
        manufacturer=MANUFACTURER,
        name=mapping.panel_name,
        model=MODEL_ZEMISMART_4GANG,
    )

    entry.runtime_data = runtime
    hass.data[DOMAIN][entry.entry_id] = {
        "runtime": runtime,
        "coordinator": coordinator,
    }

    await async_register_services(hass)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConXConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    data = hass.data[DOMAIN].pop(entry.entry_id, None)
    if data is not None:
        coordinator: PanelCoordinator = data["coordinator"]
        await coordinator.async_unload()
    if not hass.data[DOMAIN]:
        async_unregister_services(hass)
    return unload_ok


async def async_reload_entry(hass: HomeAssistant, entry: ConXConfigEntry) -> None:
    """Reload entry."""
    await hass.config_entries.async_reload(entry.entry_id)


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    _apply_log_level(entry)
    data = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    if data is not None:
        coordinator: PanelCoordinator = data["coordinator"]
        if coordinator.skip_next_reload:
            coordinator.skip_next_reload = False
            return
    await hass.config_entries.async_reload(entry.entry_id)


def _apply_log_level(entry: ConfigEntry) -> None:
    level_name = str(entry.options.get(CONF_LOG_LEVEL, DEFAULT_LOG_LEVEL)).upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.getLogger(f"custom_components.{DOMAIN}").setLevel(level)


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Serve the bundled Lovelace card and register a resource when possible."""
    frontend_dir = Path(__file__).parent / "frontend"
    script_path = frontend_dir / "conx-dynamic-panel-card.js"
    if not script_path.exists():
        _LOGGER.debug("Frontend bundle not built yet at %s", script_path)
        return
    try:
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    f"/{DOMAIN}/frontend",
                    str(frontend_dir),
                    cache_headers=False,
                )
            ]
        )
    except Exception:  # noqa: BLE001
        # Older/newer HA builds may differ; installation docs cover manual resources.
        _LOGGER.debug("Could not register static frontend path", exc_info=True)

    await _async_register_lovelace_resource(hass, f"{FRONTEND_SCRIPT_URL}?v=0.1.1")


async def _async_register_lovelace_resource(hass: HomeAssistant, url: str) -> None:
    """Best-effort Lovelace module registration via public collection API."""
    try:
        lovelace_data = hass.data.get("lovelace")
        if not isinstance(lovelace_data, dict):
            return
        resources = lovelace_data.get("resources")
        if resources is None:
            return
        existing = []
        if hasattr(resources, "async_items"):
            existing = list(resources.async_items())
        elif hasattr(resources, "data"):
            existing = list(resources.data.values()) if isinstance(resources.data, dict) else []
        for item in existing:
            item_url = item.get("url") if isinstance(item, dict) else None
            if item_url and item_url.split("?", 1)[0] == url.split("?", 1)[0]:
                return
        if hasattr(resources, "async_create_item"):
            await resources.async_create_item({"res_type": "module", "url": url})
            _LOGGER.info("Registered Lovelace resource %s", url)
    except Exception:  # noqa: BLE001
        _LOGGER.debug(
            "Automatic Lovelace resource registration unavailable; use manual resource step",
            exc_info=True,
        )
