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
    DEFAULT_CONFIRM_TIMEOUT,
    DOMAIN,
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
    await hass.config_entries.async_reload(entry.entry_id)


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Serve the bundled Lovelace card if present."""
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
