"""Constants for ConX Dynamic Panel."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "conx_dynamic_panel"
MANUFACTURER: Final = "ConX"
MODEL_ZEMISMART_4GANG: Final = "Zemismart 4 Gang"

STORAGE_VERSION: Final = 1
STORAGE_KEY: Final = f"{DOMAIN}_storage"

CONF_PANEL_NAME: Final = "panel_name"
CONF_ADAPTER_TYPE: Final = "adapter_type"
CONF_RELAY_ENTITIES: Final = "relay_entities"
CONF_NAME_ENTITIES: Final = "name_entities"
CONF_COLOR_OFF_ENTITY: Final = "color_off_entity"
CONF_COLOR_ON_ENTITY: Final = "color_on_entity"
CONF_RADAR_ENTITY: Final = "radar_entity"
CONF_BACKLIGHT_ENTITY: Final = "backlight_entity"
CONF_CHILD_LOCK_ENTITY: Final = "child_lock_entity"

CONF_SYNC_TIMEOUT: Final = "sync_timeout"
CONF_CONFIRM_TIMEOUT: Final = "confirm_timeout"
CONF_AUTO_SYNC: Final = "auto_sync"
CONF_LOG_LEVEL: Final = "log_level"

ADAPTER_ZEMISMART_4GANG: Final = "zemismart_4gang"

DEFAULT_SYNC_TIMEOUT: Final = 30.0
DEFAULT_CONFIRM_TIMEOUT: Final = 10.0
DEFAULT_AUTO_SYNC: Final = False
DEFAULT_LOG_LEVEL: Final = "info"

BUTTON_COUNT: Final = 4

MODE_TOGGLE: Final = "toggle"
MODE_RADIO_MANDATORY: Final = "radio_mandatory"
MODE_RADIO_OPTIONAL: Final = "radio_optional"
SUPPORTED_MODES: Final = (
    MODE_TOGGLE,
    MODE_RADIO_MANDATORY,
    MODE_RADIO_OPTIONAL,
)

SYNC_SYNCED: Final = "synced"
SYNC_PENDING: Final = "pending"
SYNC_SYNCING: Final = "syncing"
SYNC_ERROR: Final = "error"
SYNC_OUT_OF_SYNC: Final = "out_of_sync"
SYNC_STATES: Final = (
    SYNC_SYNCED,
    SYNC_PENDING,
    SYNC_SYNCING,
    SYNC_ERROR,
    SYNC_OUT_OF_SYNC,
)

DEFAULT_COLORS: Final = (
    "red",
    "blue",
    "green",
    "white",
    "yellow",
    "magenta",
    "cyan",
    "warm_white",
    "warm_yellow",
)
DEFAULT_RADAR: Final = ("none", "10s", "20s", "30s", "45s", "60s")

EVENT_BUTTON_PRESS: Final = f"{DOMAIN}_button_press"

ATTR_ENTRY_ID: Final = "entry_id"
ATTR_DEVICE_ID: Final = "device_id"
ATTR_PROFILE_ID: Final = "profile_id"
ATTR_BUTTON: Final = "button"
ATTR_SYNC: Final = "sync"
ATTR_PAYLOAD: Final = "payload"
ATTR_MODE: Final = "mode"

SERVICE_SYNC: Final = "sync"
SERVICE_ACTIVATE_PROFILE: Final = "activate_profile"
SERVICE_PULL_FROM_PANEL: Final = "pull_from_panel"
SERVICE_EXECUTE_BUTTON: Final = "execute_button"
SERVICE_RELOAD: Final = "reload"
SERVICE_EXPORT_PROFILES: Final = "export_profiles"
SERVICE_IMPORT_PROFILES: Final = "import_profiles"

IMPORT_MODE_MERGE: Final = "merge"
IMPORT_MODE_REPLACE: Final = "replace"
IMPORT_MODES: Final = (IMPORT_MODE_MERGE, IMPORT_MODE_REPLACE)

FRONTEND_SCRIPT_URL: Final = f"/{DOMAIN}/frontend/conx-dynamic-panel-card.js"
FRONTEND_RESOURCE_URL: Final = f"{FRONTEND_SCRIPT_URL}?v=0.1.0"
