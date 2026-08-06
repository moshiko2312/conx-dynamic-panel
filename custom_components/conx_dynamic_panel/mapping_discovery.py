"""Auto-map Zemismart / Zigbee2MQTT panel entities from a device prefix."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Iterable

from .const import (
    CONF_BACKLIGHT_BRIGHTNESS_ENTITY,
    CONF_BACKLIGHT_ENTITY,
    CONF_CHILD_LOCK_ENTITY,
    CONF_COLOR_OFF_ENTITY,
    CONF_COLOR_ON_ENTITY,
    CONF_NAME_ENTITIES,
    CONF_RADAR_ENTITY,
    CONF_RELAY_ENTITIES,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant, State


_SLUG_RE = re.compile(r"[^a-z0-9]+")


@dataclass(slots=True, frozen=True)
class DiscoveredMapping:
    """Entities discovered for one physical panel."""

    relay_entities: tuple[str, str, str, str] | None = None
    name_entities: tuple[str, str, str, str] | None = None
    color_off_entity: str | None = None
    color_on_entity: str | None = None
    radar_entity: str | None = None
    backlight_entity: str | None = None
    backlight_brightness_entity: str | None = None
    child_lock_entity: str | None = None
    missing: tuple[str, ...] = ()

    @property
    def complete(self) -> bool:
        """Return True when every required mapping field was found."""
        return (
            self.relay_entities is not None
            and self.name_entities is not None
            and self.color_off_entity is not None
            and self.color_on_entity is not None
            and self.radar_entity is not None
            and self.backlight_entity is not None
            and self.child_lock_entity is not None
            and not self.missing
        )

    def as_defaults(self) -> dict[str, object]:
        """Convert discovery result into config-flow defaults."""
        data: dict[str, object] = {}
        if self.relay_entities:
            data[CONF_RELAY_ENTITIES] = list(self.relay_entities)
        if self.name_entities:
            data[CONF_NAME_ENTITIES] = list(self.name_entities)
        if self.color_off_entity:
            data[CONF_COLOR_OFF_ENTITY] = self.color_off_entity
        if self.color_on_entity:
            data[CONF_COLOR_ON_ENTITY] = self.color_on_entity
        if self.radar_entity:
            data[CONF_RADAR_ENTITY] = self.radar_entity
        if self.backlight_entity:
            data[CONF_BACKLIGHT_ENTITY] = self.backlight_entity
        if self.backlight_brightness_entity:
            data[CONF_BACKLIGHT_BRIGHTNESS_ENTITY] = self.backlight_brightness_entity
        if self.child_lock_entity:
            data[CONF_CHILD_LOCK_ENTITY] = self.child_lock_entity
        return data


def normalize_device_prefix(value: str) -> str:
    """Normalize a Zigbee2MQTT / HA device name into an entity-id slug."""
    slug = _SLUG_RE.sub("_", value.strip().lower()).strip("_")
    return slug


def _entity_object_id(entity_id: str) -> str:
    return entity_id.split(".", 1)[-1]


def _matches_prefix(entity_id: str, prefix: str) -> bool:
    object_id = _entity_object_id(entity_id)
    return object_id == prefix or object_id.startswith(f"{prefix}_")


def _pick_first(candidates: Iterable[str], patterns: tuple[str, ...]) -> str | None:
    """Pick the first entity whose object_id matches any suffix/exact pattern."""
    ranked: list[tuple[int, str]] = []
    for entity_id in candidates:
        object_id = _entity_object_id(entity_id)
        for rank, pattern in enumerate(patterns):
            if object_id == pattern or object_id.endswith(f"_{pattern}"):
                ranked.append((rank, entity_id))
                break
    if not ranked:
        return None
    ranked.sort(key=lambda item: (item[0], item[1]))
    return ranked[0][1]


def _relay_patterns(prefix: str, index: int) -> tuple[str, ...]:
    n = index
    return (
        f"{prefix}_l{n}",
        f"l{n}",
        f"{prefix}_switch_l{n}",
        f"switch_l{n}",
        f"{prefix}_{n}",
    )


def _name_patterns(prefix: str, index: int) -> tuple[str, ...]:
    n = index
    return (
        f"{prefix}_name_l{n}",
        f"name_l{n}",
        f"{prefix}_l{n}_name",
        f"l{n}_name",
        f"{prefix}_switch_{n}_name",
        f"switch_{n}_name",
    )


def discover_mapping_from_entities(
    entity_ids: Iterable[str],
    prefix: str,
    *,
    device_scoped: bool = False,
) -> DiscoveredMapping:
    """Discover mapping fields from a flat list of entity IDs and a prefix."""
    normalized = normalize_device_prefix(prefix)
    if not normalized and not device_scoped:
        return DiscoveredMapping(missing=("device_prefix",))

    if device_scoped:
        scoped = list(entity_ids)
    else:
        scoped = [
            entity_id for entity_id in entity_ids if _matches_prefix(entity_id, normalized)
        ]

    by_domain: dict[str, list[str]] = {}
    for entity_id in scoped:
        domain = entity_id.split(".", 1)[0]
        by_domain.setdefault(domain, []).append(entity_id)

    missing: list[str] = []
    prefix_key = normalized or "panel"

    relays: list[str] = []
    for index in range(1, 5):
        found = _pick_first(by_domain.get("switch", []), _relay_patterns(prefix_key, index))
        if found is None:
            missing.append(f"relay_l{index}")
        else:
            relays.append(found)

    names: list[str] = []
    for index in range(1, 5):
        found = _pick_first(by_domain.get("text", []), _name_patterns(prefix_key, index))
        if found is None:
            missing.append(f"name_l{index}")
        else:
            names.append(found)

    color_off = _pick_first(
        by_domain.get("select", []),
        (
            f"{prefix_key}_switch_color_off",
            "switch_color_off",
            f"{prefix_key}_off_color",
            "off_color",
            f"{prefix_key}_color_off",
            "color_off",
        ),
    )
    color_on = _pick_first(
        by_domain.get("select", []),
        (
            f"{prefix_key}_switch_color_on",
            "switch_color_on",
            f"{prefix_key}_on_color",
            "on_color",
            f"{prefix_key}_color_on",
            "color_on",
        ),
    )
    radar = _pick_first(
        by_domain.get("select", []),
        (
            f"{prefix_key}_radar_config",
            "radar_config",
            f"{prefix_key}_radar",
            "radar",
            f"{prefix_key}_presence_radar",
            "presence_radar",
        ),
    )
    backlight = _pick_first(
        by_domain.get("switch", []),
        (
            f"{prefix_key}_backlight_mode",
            "backlight_mode",
            f"{prefix_key}_backlight_switch",
            "backlight_switch",
            f"{prefix_key}_backlight",
            "backlight",
        ),
    )
    brightness = _pick_first(
        by_domain.get("number", []),
        (
            f"{prefix_key}_backlight_brightness",
            "backlight_brightness",
            f"{prefix_key}_backlight",
            "backlight",
        ),
    )
    child_lock = _pick_first(
        by_domain.get("switch", []),
        (
            f"{prefix_key}_child_lock",
            "child_lock",
        ),
    )

    if color_off is None:
        missing.append("color_off")
    if color_on is None:
        missing.append("color_on")
    if radar is None:
        missing.append("radar")
    if backlight is None:
        missing.append("backlight")
    if child_lock is None:
        missing.append("child_lock")

    return DiscoveredMapping(
        relay_entities=tuple(relays) if len(relays) == 4 else None,  # type: ignore[arg-type]
        name_entities=tuple(names) if len(names) == 4 else None,  # type: ignore[arg-type]
        color_off_entity=color_off,
        color_on_entity=color_on,
        radar_entity=radar,
        backlight_entity=backlight,
        backlight_brightness_entity=brightness,
        child_lock_entity=child_lock,
        missing=tuple(missing),
    )


def discover_mapping_from_hass(hass: HomeAssistant, prefix: str) -> DiscoveredMapping:
    """Discover mapping using entity-id prefix, then HA device name fallback."""
    entity_ids = [state.entity_id for state in hass.states.async_all()]
    discovered = discover_mapping_from_entities(entity_ids, prefix)
    if discovered.complete:
        return discovered

    by_device = discover_mapping_from_device_name(hass, prefix)
    if by_device.complete or len(by_device.missing) < len(discovered.missing):
        return by_device
    return discovered


def discover_mapping_from_device_name(hass: HomeAssistant, device_name: str) -> DiscoveredMapping:
    """Discover entities belonging to an HA device whose name matches."""
    from homeassistant.helpers import device_registry as dr
    from homeassistant.helpers import entity_registry as er

    needle = device_name.strip().lower()
    if not needle:
        return DiscoveredMapping(missing=("device_prefix",))

    device_registry = dr.async_get(hass)
    entity_registry = er.async_get(hass)
    matched_device_ids: list[str] = []
    for device in device_registry.devices.values():
        names = {
            (device.name or "").strip().lower(),
            (device.name_by_user or "").strip().lower(),
        }
        slug_names = {normalize_device_prefix(name) for name in names if name}
        if needle in names or normalize_device_prefix(needle) in slug_names:
            matched_device_ids.append(device.id)

    if not matched_device_ids:
        entity_ids = [state.entity_id for state in hass.states.async_all()]
        return discover_mapping_from_entities(entity_ids, device_name)

    entity_ids = [
        entry.entity_id
        for entry in entity_registry.entities.values()
        if entry.device_id in matched_device_ids
    ]
    prefix_pool = [
        state.entity_id
        for state in hass.states.async_all()
        if _matches_prefix(state.entity_id, normalize_device_prefix(device_name))
    ]
    merged = list(dict.fromkeys([*entity_ids, *prefix_pool]))
    return discover_mapping_from_entities(
        merged,
        normalize_device_prefix(device_name) or device_name,
        device_scoped=True,
    )


def suggest_prefix_from_entity_id(entity_id: str) -> str | None:
    """Best-effort prefix guess from one known relay entity id."""
    object_id = _entity_object_id(entity_id)
    match = re.match(r"^(?P<prefix>.+)_l[1-4]$", object_id)
    if match:
        return match.group("prefix")
    return None


def suggest_prefix_from_state(state: Any) -> str | None:
    """Best-effort prefix guess from one known relay state."""
    if state is None:
        return None
    return suggest_prefix_from_entity_id(state.entity_id)
