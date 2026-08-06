"""Map linked Home Assistant entity states to panel relay on/off."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .const import (
    BUTTON_ROLE_RADIO,
    BUTTON_ROLE_TOGGLE,
    MODE_COVER,
    MODE_MIXED,
    MODE_RADIO_MANDATORY,
    MODE_RADIO_OPTIONAL,
    MODE_RADIO_SPLIT,
    MODE_TOGGLE,
)

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


@dataclass(frozen=True, slots=True)
class EntityRelayBinding:
    """One linked HA entity that should drive a panel relay (Sync + live).

    Independent bindings (``radio_members is None``) set only that button's
    relay. Radio-group bindings recompute exclusivity across ``radio_members``
    whenever any member entity changes.
    """

    entity_id: str
    button_index: int
    radio_members: tuple[int, ...] | None = None
    radio_require_selection: bool = False


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


def state_value_to_relay_on(entity_id: str, state: str | None) -> bool | None:
    """Map an entity id + state string to panel relay ON/OFF.

    Returns:
        True  — set relay ON
        False — set relay OFF
        None  — skip (unavailable/unknown/ambiguous)
    """
    entity_id = str(entity_id or "").strip()
    if not entity_id or "." not in entity_id:
        return None
    value = str(state or "").strip().lower()
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
    return state_value_to_relay_on(entity_id, getattr(state_obj, "state", None))


def iter_entity_relay_bindings(profile: Any) -> list[EntityRelayBinding]:
    """Return live/Sync entity→relay bindings for the active profile.

    Matches the Sync rules in ``Zemismart4GangAdapter._async_apply_relay_mode``:
    toggle (and ungrouped radio) buttons track linked entities; cover_* and
    momentary never latch from entity state; radio exclusivity groups recompute
    when any member entity changes.
    """
    mode = getattr(profile, "mode", None)
    if mode == MODE_COVER:
        return []

    bindings: list[EntityRelayBinding] = []

    if mode == MODE_MIXED:
        grouped: set[int] = set()
        for group in getattr(profile, "radio_groups", []) or []:
            members = [
                index
                for index in getattr(group, "buttons", []) or []
                if index <= profile.gang_count and profile.button_role(index) == BUTTON_ROLE_RADIO
            ]
            if not members:
                continue
            grouped.update(members)
            bindings.extend(
                _radio_group_bindings(
                    profile,
                    members,
                    require_selection=False,
                )
            )
        for button in profile.visible_buttons():
            if button.is_cover_role or button.is_momentary:
                continue
            if button.index in grouped:
                continue
            if button.role in {BUTTON_ROLE_TOGGLE, BUTTON_ROLE_RADIO}:
                binding = _independent_binding(button)
                if binding is not None:
                    bindings.append(binding)
        return bindings

    if mode == MODE_TOGGLE:
        for button in profile.visible_buttons():
            binding = _independent_binding(button)
            if binding is not None:
                bindings.append(binding)
        return bindings

    if mode == MODE_RADIO_SPLIT:
        grouped = set()
        for group in getattr(profile, "radio_groups", []) or []:
            members = [
                index
                for index in getattr(group, "buttons", []) or []
                if index <= profile.gang_count
            ]
            if not members:
                continue
            grouped.update(members)
            bindings.extend(
                _radio_group_bindings(
                    profile,
                    members,
                    require_selection=False,
                )
            )
        for button in profile.visible_buttons():
            if button.index in grouped:
                continue
            binding = _independent_binding(button)
            if binding is not None:
                bindings.append(binding)
        return bindings

    # radio_mandatory / radio_optional
    members = list(profile.radio_member_indexes())
    member_set = set(members)
    for button in profile.visible_buttons():
        if button.index in member_set:
            continue
        binding = _independent_binding(button)
        if binding is not None:
            bindings.append(binding)
    require_selection = mode in {MODE_RADIO_MANDATORY, MODE_RADIO_OPTIONAL}
    bindings.extend(
        _radio_group_bindings(
            profile,
            members,
            require_selection=require_selection,
        )
    )
    return bindings


def _independent_binding(button: Any) -> EntityRelayBinding | None:
    entity_id = linked_entity_id_from_action(getattr(button, "action", None))
    if not entity_id:
        return None
    return EntityRelayBinding(entity_id=entity_id, button_index=int(button.index))


def _radio_group_bindings(
    profile: Any,
    members: list[int],
    *,
    require_selection: bool,
) -> list[EntityRelayBinding]:
    if not members:
        return []
    member_tuple = tuple(sorted(members))
    out: list[EntityRelayBinding] = []
    for index in members:
        button = profile.button_by_index(index)
        if button is None:
            continue
        entity_id = linked_entity_id_from_action(button.action)
        if not entity_id:
            continue
        out.append(
            EntityRelayBinding(
                entity_id=entity_id,
                button_index=index,
                radio_members=member_tuple,
                radio_require_selection=require_selection,
            )
        )
    return out


@dataclass(frozen=True, slots=True)
class RadioEntitySelection:
    """Result of resolving radio ON member from linked entity states."""

    selected: int | None = None
    leave_unchanged: bool = False


LEAVE_RADIO_UNCHANGED = RadioEntitySelection(leave_unchanged=True)


def resolve_radio_selected_from_entities(
    hass: Any,
    profile: Any,
    members: list[int],
    *,
    selected_fallback: int | None,
    require_selection: bool,
) -> RadioEntitySelection:
    """Pick the radio ON member from linked entity states."""
    if not members:
        return RadioEntitySelection(selected=None)
    member_set = set(members)
    entity_on: list[int] = []
    for index in members:
        button = profile.button_by_index(index)
        if button is None:
            continue
        entity_id = linked_entity_id_from_action(button.action)
        if not entity_id:
            continue
        mapped = entity_state_to_relay_on(hass, entity_id)
        if mapped is True:
            entity_on.append(index)

    selected = entity_on[0] if len(entity_on) == 1 else selected_fallback
    if selected is not None and selected not in member_set:
        selected = None
    if require_selection and selected is None:
        selected = next(iter(sorted(members)), 1)
    if selected is None and not require_selection and len(entity_on) != 1:
        return LEAVE_RADIO_UNCHANGED
    return RadioEntitySelection(selected=selected)
