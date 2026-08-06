"""Map linked Home Assistant entity states to panel relay on/off."""

from __future__ import annotations

from typing import Any

# States that clearly mean the linked device is "active" for LED/relay match.
_RELAY_ON_STATES: frozenset[str] = frozenset(
    {
        "on",
        "open",
        "opening",
        "playing",
        "home",
        "locked",
        "active",
        "heat",
        "cool",
        "dry",
        "fan_only",
        "auto",
        "cleaning",
        "returning",
    }
)

# States that clearly mean inactive / off for LED/relay match.
_RELAY_OFF_STATES: frozenset[str] = frozenset(
    {
        "off",
        "closed",
        "closing",
        "idle",
        "paused",
        "standby",
        "not_home",
        "unlocked",
        "inactive",
        "stopped",
    }
)

_SKIP_STATES: frozenset[str] = frozenset({"", "unknown", "unavailable", "none"})


def linked_entity_id_from_action(action: Any | None) -> str | None:
    """Return the primary entity_id from a button action target/data, if any."""
    if action is None:
        return None
    linked = getattr(action, "linked_entity_id", None)
    if callable(linked):
        result = linked()
        if isinstance(result, str) and result.strip():
            return result.strip()
        return None
    for source_name in ("target", "data"):
        source = getattr(action, source_name, None)
        if not isinstance(source, dict):
            continue
        raw = source.get("entity_id")
        if isinstance(raw, str):
            entity_id = raw.strip()
            if entity_id:
                return entity_id
        elif isinstance(raw, (list, tuple)):
            for item in raw:
                if isinstance(item, str) and item.strip():
                    return item.strip()
    return None


def entity_state_to_relay_on(hass: Any, entity_id: str) -> bool | None:
    """Map a Home Assistant entity state to panel relay ON/OFF.

    Returns:
        True  — set relay ON
        False — set relay OFF
        None  — skip (missing entity, unavailable/unknown, or ambiguous state)
    """
    entity_id = str(entity_id or "").strip()
    if not entity_id or "." not in entity_id:
        return None
    states = getattr(hass, "states", None)
    if states is None:
        return None
    state_obj = states.get(entity_id)
    if state_obj is None:
        return None
    value = str(getattr(state_obj, "state", "") or "").strip().lower()
    if value in _SKIP_STATES:
        return None
    if value in _RELAY_ON_STATES:
        return True
    if value in _RELAY_OFF_STATES:
        return False

    domain = entity_id.split(".", 1)[0]
    if domain in {"light", "switch", "input_boolean", "fan", "binary_sensor", "siren"}:
        return value == "on"
    if domain == "cover":
        if value in {"open", "opening"}:
            return True
        if value in {"closed", "closing", "stopped"}:
            return False
        return None
    if domain == "media_player":
        if value in {"playing", "on"}:
            return True
        if value in {"idle", "off", "paused", "standby"}:
            return False
        return None
    if domain == "lock":
        if value == "locked":
            return True
        if value == "unlocked":
            return False
        return None
    # Ambiguous custom state — do not guess.
    return None
