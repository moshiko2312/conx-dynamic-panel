"""Typed models for ConX Dynamic Panel."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import asdict, dataclass, field
from typing import Any, Literal

from .const import (
    BACKLIGHT_BRIGHTNESS_MAX,
    BACKLIGHT_BRIGHTNESS_MIN,
    BUTTON_COUNT,
    BUTTON_ROLE_COVER_CLOSE,
    BUTTON_ROLE_COVER_OPEN,
    BUTTON_ROLE_MOMENTARY,
    BUTTON_ROLE_RADIO,
    BUTTON_ROLE_TOGGLE,
    BUTTON_ROLES,
    COVER_DEFAULT_CLOSE_BUTTON,
    COVER_DEFAULT_CLOSE_TIME,
    COVER_DEFAULT_ID,
    COVER_DEFAULT_OPEN_BUTTON,
    COVER_DEFAULT_OPEN_TIME,
    COVER_DEFAULT_SETTLE,
    COVER_DIRECTION_CLOSE,
    COVER_DIRECTION_OPEN,
    COVER_OPPOSITE_MODES,
    COVER_OPPOSITE_STOP_ONLY,
    COVER_SETTLE_MAX,
    COVER_SETTLE_MIN,
    COVER_TIME_MAX,
    COVER_TIME_MIN,
    DEFAULT_BACKLIGHT_BRIGHTNESS,
    DEFAULT_COLORS,
    DEFAULT_GANG_COUNT,
    DEFAULT_PULSE_TIME,
    DEFAULT_RADAR,
    GANG_COUNT_MAX,
    GANG_COUNT_MIN,
    MODE_COVER,
    MODE_MIXED,
    MODE_MOMENTARY_MIX_ALIAS,
    MODE_TOGGLE,
    MULTI_BUTTON_ROLES,
    PULSE_TIME_MAX,
    PULSE_TIME_MIN,
    STORAGE_VERSION,
    SUPPORTED_MODES,
    SYNC_PENDING,
    SYNC_SYNCED,
)
from .option_match import filter_ui_color_options


def clamp_backlight_brightness(value: Any) -> int:
    """Clamp backlight brightness to the supported 0–100 range."""
    try:
        brightness = int(round(float(value)))
    except (TypeError, ValueError):
        return DEFAULT_BACKLIGHT_BRIGHTNESS
    return max(BACKLIGHT_BRIGHTNESS_MIN, min(BACKLIGHT_BRIGHTNESS_MAX, brightness))


ButtonMode = Literal[
    "toggle",
    "radio_mandatory",
    "radio_optional",
    "radio_split",
    "mixed",
    "cover",
]
ButtonRole = Literal["toggle", "momentary", "radio", "cover_open", "cover_close"]
SyncStatus = Literal["synced", "pending", "syncing", "error", "out_of_sync"]
CoverDirection = Literal["open", "close"]


def clamp_pulse_time(value: Any, default: float = DEFAULT_PULSE_TIME) -> float:
    """Clamp a momentary pulse duration to the supported seconds range."""
    try:
        seconds = float(value)
    except (TypeError, ValueError):
        return default
    if seconds != seconds:  # NaN
        return default
    return max(PULSE_TIME_MIN, min(PULSE_TIME_MAX, seconds))


def normalize_button_role(value: Any, *, legacy_press_mode: Any = None) -> ButtonRole:
    """Normalize a per-button role for mixed mode.

    Accepts legacy ``press_mode`` values (toggle/momentary) from the brief
    momentary_mix draft.
    """
    role = str(value or "").strip().lower()
    if not role and legacy_press_mode is not None:
        legacy = str(legacy_press_mode or "").strip().lower()
        if legacy == BUTTON_ROLE_MOMENTARY:
            return BUTTON_ROLE_MOMENTARY  # type: ignore[return-value]
        if legacy:
            return BUTTON_ROLE_TOGGLE  # type: ignore[return-value]
    if role in BUTTON_ROLES:
        return role  # type: ignore[return-value]
    return BUTTON_ROLE_TOGGLE  # type: ignore[return-value]


def normalize_profile_mode(value: Any) -> str:
    """Normalize profile mode, mapping the momentary_mix alias to mixed."""
    mode = str(value or MODE_TOGGLE).strip().lower() or MODE_TOGGLE
    if mode == MODE_MOMENTARY_MIX_ALIAS:
        return MODE_MIXED
    return mode


def clamp_cover_time(value: Any, default: float) -> float:
    """Clamp a cover travel time to the supported seconds range."""
    try:
        seconds = float(value)
    except (TypeError, ValueError):
        return default
    if seconds != seconds:  # NaN
        return default
    return max(COVER_TIME_MIN, min(COVER_TIME_MAX, seconds))


def clamp_cover_settle(value: Any) -> float:
    """Clamp the direction-change dead time to the supported seconds range."""
    try:
        seconds = float(value)
    except (TypeError, ValueError):
        return COVER_DEFAULT_SETTLE
    if seconds != seconds:  # NaN
        return COVER_DEFAULT_SETTLE
    return max(COVER_SETTLE_MIN, min(COVER_SETTLE_MAX, seconds))


def clamp_gang_count(value: Any) -> int:
    """Clamp panel gang count to the supported 1–4 range."""
    try:
        count = int(value)
    except (TypeError, ValueError):
        return DEFAULT_GANG_COUNT
    return max(GANG_COUNT_MIN, min(GANG_COUNT_MAX, count))


def max_covers_for_gangs(gang_count: int) -> int:
    """Return how many independent covers fit on ``gang_count`` buttons."""
    return max(0, int(gang_count) // 2)


def _clamp_button_index(value: Any, default: int, *, gang_count: int = BUTTON_COUNT) -> int:
    try:
        index = int(value)
    except (TypeError, ValueError):
        return default
    limit = max(1, min(BUTTON_COUNT, int(gang_count)))
    if index < 1 or index > limit:
        return min(default, limit) if default <= limit else 1
    return index


def _default_cover_pair(slot: int, gang_count: int) -> tuple[int, int]:
    """Return a non-overlapping open/close pair for cover slot ``slot`` (0-based)."""
    open_button = slot * 2 + 1
    close_button = slot * 2 + 2
    if close_button > gang_count:
        open_button = 1
        close_button = 2 if gang_count >= 2 else 1
    return open_button, close_button


def _normalize_cover_ha_entity_id(value: Any) -> str | None:
    """Return a cleaned ``cover.*`` entity id, or None when unset/invalid."""
    if value is None:
        return None
    entity_id = str(value).strip()
    if not entity_id:
        return None
    if not entity_id.startswith("cover."):
        return None
    return entity_id


@dataclass(slots=True)
class CoverConfig:
    """Cover/shutter wiring and travel timing for one motor on a cover-mode profile.

    ``open_button`` and ``close_button`` are 1-based panel button indexes within the
    profile's ``gang_count``. Times are the seconds a direction relay stays
    energized before the engine forces it off.
    """

    id: str = COVER_DEFAULT_ID
    open_button: int = COVER_DEFAULT_OPEN_BUTTON
    close_button: int = COVER_DEFAULT_CLOSE_BUTTON
    open_time_s: float = COVER_DEFAULT_OPEN_TIME
    close_time_s: float = COVER_DEFAULT_CLOSE_TIME
    direction_settle_s: float = COVER_DEFAULT_SETTLE
    opposite_press: str = COVER_OPPOSITE_STOP_ONLY
    # Optional linked Home Assistant cover.* for status/automations / mirror commands.
    # Panel L1/L2 still drive the physical motor relays; this does not replace them.
    ha_entity_id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Serialize cover config."""
        payload: dict[str, Any] = {
            "id": self.id,
            "open_button": self.open_button,
            "close_button": self.close_button,
            "open_time_s": self.open_time_s,
            "close_time_s": self.close_time_s,
            "direction_settle_s": self.direction_settle_s,
            "opposite_press": self.opposite_press,
        }
        if self.ha_entity_id:
            payload["ha_entity_id"] = self.ha_entity_id
        return payload

    @classmethod
    def from_dict(
        cls,
        data: dict[str, Any] | None,
        *,
        gang_count: int = BUTTON_COUNT,
        default_id: str = COVER_DEFAULT_ID,
    ) -> CoverConfig:
        """Deserialize cover config, clamping every value into safe ranges.

        Button equality is preserved instead of repaired so that
        :func:`validate_cover_config` can reject it explicitly.
        """
        data = data or {}
        opposite = str(data.get("opposite_press") or COVER_OPPOSITE_STOP_ONLY)
        if opposite not in COVER_OPPOSITE_MODES:
            opposite = COVER_OPPOSITE_STOP_ONLY
        cover_id = str(data.get("id") or "").strip() or default_id
        open_default, close_default = _default_cover_pair(0, gang_count)
        return cls(
            id=cover_id,
            open_button=_clamp_button_index(
                data.get("open_button"), open_default, gang_count=gang_count
            ),
            close_button=_clamp_button_index(
                data.get("close_button"), close_default, gang_count=gang_count
            ),
            open_time_s=clamp_cover_time(data.get("open_time_s"), COVER_DEFAULT_OPEN_TIME),
            close_time_s=clamp_cover_time(data.get("close_time_s"), COVER_DEFAULT_CLOSE_TIME),
            direction_settle_s=clamp_cover_settle(data.get("direction_settle_s")),
            opposite_press=opposite,
            ha_entity_id=_normalize_cover_ha_entity_id(
                data.get("ha_entity_id", data.get("entity_id"))
            ),
        )

    def direction_for(self, button_index: int) -> CoverDirection | None:
        """Return the travel direction a button drives, if any."""
        if button_index == self.open_button:
            return COVER_DIRECTION_OPEN  # type: ignore[return-value]
        if button_index == self.close_button:
            return COVER_DIRECTION_CLOSE  # type: ignore[return-value]
        return None

    def button_for(self, direction: str) -> int:
        """Return the panel button index driving a direction."""
        return self.open_button if direction == COVER_DIRECTION_OPEN else self.close_button

    def opposite_direction(self, direction: str) -> CoverDirection:
        """Return the inverse travel direction."""
        return (  # type: ignore[return-value]
            COVER_DIRECTION_CLOSE if direction == COVER_DIRECTION_OPEN else COVER_DIRECTION_OPEN
        )

    def duration_for(self, direction: str) -> float:
        """Return the travel time for a direction."""
        return self.open_time_s if direction == COVER_DIRECTION_OPEN else self.close_time_s

    def relay_indexes(self) -> tuple[int, int]:
        """Return both direction relay indexes (open first)."""
        return (self.open_button, self.close_button)


def normalize_cover(
    raw: Any, *, gang_count: int = BUTTON_COUNT, default_id: str = COVER_DEFAULT_ID
) -> CoverConfig:
    """Normalize a stored/posted cover payload into a CoverConfig."""
    if isinstance(raw, CoverConfig):
        return CoverConfig.from_dict(raw.to_dict(), gang_count=gang_count, default_id=default_id)
    if isinstance(raw, dict):
        return CoverConfig.from_dict(raw, gang_count=gang_count, default_id=default_id)
    open_button, close_button = _default_cover_pair(0, gang_count)
    return CoverConfig(id=default_id, open_button=open_button, close_button=close_button)


def normalize_covers(
    raw_covers: Any = None,
    raw_cover: Any = None,
    *,
    gang_count: int = BUTTON_COUNT,
) -> list[CoverConfig]:
    """Normalize legacy ``cover`` or modern ``covers[]`` into a cover list.

    Empty input yields one default cover when the gang count can host a motor
    pair; otherwise an empty list. Excess covers beyond ``floor(gang_count/2)``
    are dropped. Invalid button indexes are clamped into ``1..gang_count``.
    """
    gang_count = clamp_gang_count(gang_count)
    max_covers = max_covers_for_gangs(gang_count)
    covers: list[CoverConfig] = []
    if isinstance(raw_covers, list) and raw_covers:
        for index, item in enumerate(raw_covers):
            covers.append(
                normalize_cover(item, gang_count=gang_count, default_id=f"cover_{index + 1}")
            )
    elif raw_cover is not None:
        covers.append(
            normalize_cover(raw_cover, gang_count=gang_count, default_id=COVER_DEFAULT_ID)
        )
    elif max_covers > 0:
        open_button, close_button = _default_cover_pair(0, gang_count)
        covers.append(
            CoverConfig(
                id=COVER_DEFAULT_ID,
                open_button=open_button,
                close_button=close_button,
            )
        )

    if max_covers == 0:
        return []
    covers = covers[:max_covers]

    # Stable unique ids.
    seen: set[str] = set()
    for index, cover in enumerate(covers):
        base = cover.id.strip() or f"cover_{index + 1}"
        candidate = base
        suffix = 2
        while candidate in seen:
            candidate = f"{base}_{suffix}"
            suffix += 1
        cover.id = candidate
        seen.add(candidate)
    return covers


def validate_cover_config(cover: CoverConfig, *, gang_count: int = BUTTON_COUNT) -> None:
    """Raise ValueError when a cover configuration is unsafe to run."""
    gang_count = clamp_gang_count(gang_count)
    if not cover.id.strip():
        raise ValueError("Cover id is required")
    if cover.open_button == cover.close_button:
        raise ValueError("Cover open and close buttons must be different panel buttons")
    for index in cover.relay_indexes():
        if index < 1 or index > gang_count:
            raise ValueError(f"Cover button {index} is outside 1-{gang_count}")
    for label, seconds in (
        ("open_time_s", cover.open_time_s),
        ("close_time_s", cover.close_time_s),
    ):
        if not COVER_TIME_MIN <= seconds <= COVER_TIME_MAX:
            raise ValueError(
                f"Cover {label} must be between {COVER_TIME_MIN} and {COVER_TIME_MAX} seconds"
            )
    if not COVER_SETTLE_MIN <= cover.direction_settle_s <= COVER_SETTLE_MAX:
        raise ValueError(
            f"Cover direction_settle_s must be between {COVER_SETTLE_MIN} "
            f"and {COVER_SETTLE_MAX} seconds"
        )
    if cover.opposite_press not in COVER_OPPOSITE_MODES:
        raise ValueError(f"Unsupported cover opposite_press: {cover.opposite_press}")


def validate_covers(covers: list[CoverConfig], *, gang_count: int = BUTTON_COUNT) -> None:
    """Validate every cover and enforce exclusive button ownership across covers."""
    gang_count = clamp_gang_count(gang_count)
    max_covers = max_covers_for_gangs(gang_count)
    if len(covers) > max_covers:
        raise ValueError(f"At most {max_covers} cover(s) are allowed for a {gang_count}-gang panel")
    if not covers:
        raise ValueError("Cover mode requires at least one cover mapping")
    ownership: dict[int, str] = {}
    seen_ids: set[str] = set()
    for cover in covers:
        validate_cover_config(cover, gang_count=gang_count)
        if cover.id in seen_ids:
            raise ValueError(f"Duplicate cover id: {cover.id}")
        seen_ids.add(cover.id)
        for index in cover.relay_indexes():
            if index in ownership:
                raise ValueError(
                    f"Button {index} is used by both '{ownership[index]}' and '{cover.id}'"
                )
            ownership[index] = cover.id


@dataclass(slots=True)
class RadioGroup:
    """One exclusive radio group within radio_split mode."""

    id: str
    buttons: list[int] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Serialize radio group."""
        return {"id": self.id, "buttons": list(self.buttons)}

    @classmethod
    def from_dict(cls, data: dict[str, Any], *, gang_count: int = BUTTON_COUNT) -> RadioGroup:
        """Deserialize radio group."""
        raw_buttons = data.get("buttons") or []
        limit = clamp_gang_count(gang_count)
        buttons: list[int] = []
        for item in raw_buttons:
            try:
                index = int(item)
            except (TypeError, ValueError):
                continue
            if 1 <= index <= limit and index not in buttons:
                buttons.append(index)
        group_id = str(data.get("id") or "").strip() or "g"
        return cls(id=group_id, buttons=buttons)


def normalize_radio_groups(raw: Any, *, gang_count: int = BUTTON_COUNT) -> list[RadioGroup]:
    """Normalize radio_groups payload; ensure two editable groups by default."""
    groups: list[RadioGroup] = []
    if isinstance(raw, list):
        for index, item in enumerate(raw):
            if isinstance(item, RadioGroup):
                group = RadioGroup.from_dict(item.to_dict(), gang_count=gang_count)
            elif isinstance(item, dict):
                group = RadioGroup.from_dict(item, gang_count=gang_count)
            else:
                continue
            if not group.id or group.id == "g":
                group.id = f"g{index + 1}"
            groups.append(group)
    # Always expose at least two groups for the UI editors.
    while len(groups) < 2:
        groups.append(RadioGroup(id=f"g{len(groups) + 1}", buttons=[]))
    # Deduplicate ids.
    seen: set[str] = set()
    for index, group in enumerate(groups):
        base = group.id or f"g{index + 1}"
        candidate = base
        suffix = 2
        while candidate in seen:
            candidate = f"{base}_{suffix}"
            suffix += 1
        group.id = candidate
        seen.add(candidate)
    return groups


def validate_radio_groups(groups: list[RadioGroup]) -> None:
    """Raise ValueError when a button appears in more than one group."""
    ownership: dict[int, str] = {}
    for group in groups:
        for index in group.buttons:
            if index in ownership:
                raise ValueError(
                    f"Button {index} belongs to both '{ownership[index]}' and '{group.id}'"
                )
            ownership[index] = group.id


def validate_mixed_profile(profile: Profile) -> None:
    """Validate per-button roles for mode=mixed."""
    if profile.mode != MODE_MIXED:
        return
    validate_radio_groups(profile.radio_groups)
    radio_indexes = {
        button.index for button in profile.visible_buttons() if button.role == BUTTON_ROLE_RADIO
    }
    for group in profile.radio_groups:
        for index in group.buttons:
            if index not in radio_indexes:
                raise ValueError(
                    f"Button {index} is in radio group '{group.id}' but role is not radio"
                )
    for button in profile.visible_buttons():
        # role=radio without a group behaves as toggle at runtime (same as radio_split).
        if button.role in MULTI_BUTTON_ROLES and profile.gang_count < 2:
            raise ValueError(
                f"Role '{button.role}' requires at least 2 gangs (button {button.index})"
            )
        if not PULSE_TIME_MIN <= button.pulse_time_s <= PULSE_TIME_MAX:
            raise ValueError(
                f"Button {button.index} pulse_time_s must be between "
                f"{PULSE_TIME_MIN} and {PULSE_TIME_MAX} seconds"
            )

    cover_dirs: dict[str, dict[str, int]] = {}
    for button in profile.visible_buttons():
        if not button.is_cover_role:
            continue
        cover_id = (button.cover_id or "").strip()
        if not cover_id:
            raise ValueError(f"Button {button.index} cover role requires cover_id")
        slot = cover_dirs.setdefault(cover_id, {})
        key = "open" if button.role == BUTTON_ROLE_COVER_OPEN else "close"
        if key in slot:
            raise ValueError(f"Cover '{cover_id}' has multiple {key} buttons")
        slot[key] = button.index

    for cover_id, pair in cover_dirs.items():
        if "open" not in pair or "close" not in pair:
            raise ValueError(f"Cover '{cover_id}' needs both cover_open and cover_close buttons")
        if pair["open"] == pair["close"]:
            raise ValueError(f"Cover '{cover_id}' open and close must use different buttons")
        cover = profile.cover_by_id(cover_id)
        if cover is None:
            raise ValueError(f"Cover '{cover_id}' is missing timing configuration")
        validate_cover_config(cover, gang_count=profile.gang_count)


@dataclass(slots=True)
class ButtonAction:
    """Normalized Home Assistant service-call action."""

    action: str
    target: dict[str, Any] = field(default_factory=dict)
    data: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Serialize action."""
        return {"action": self.action, "target": deepcopy(self.target), "data": deepcopy(self.data)}

    def linked_entity_id(self) -> str | None:
        """Return the primary target/data entity_id for sync and pickers."""
        for source in (self.target, self.data):
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

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> ButtonAction | None:
        """Deserialize optional action."""
        if not data:
            return None
        action = data.get("action")
        if not isinstance(action, str) or not action:
            return None
        return cls(
            action=action,
            target=dict(data.get("target") or {}),
            data=dict(data.get("data") or {}),
        )


@dataclass(slots=True)
class ButtonConfig:
    """One physical button configuration."""

    index: int
    name: str = ""
    action: ButtonAction | None = None
    radio_member: bool = True
    # Per-button role for mode=mixed (ignored by legacy single-behavior modes).
    role: ButtonRole = BUTTON_ROLE_TOGGLE  # type: ignore[assignment]
    pulse_time_s: float = DEFAULT_PULSE_TIME
    # Cover id when role is cover_open / cover_close.
    cover_id: str | None = None

    def __post_init__(self) -> None:
        self.role = normalize_button_role(self.role)
        self.pulse_time_s = clamp_pulse_time(self.pulse_time_s)
        if self.cover_id is not None:
            cover_id = str(self.cover_id).strip()
            self.cover_id = cover_id or None
        if self.role not in {BUTTON_ROLE_COVER_OPEN, BUTTON_ROLE_COVER_CLOSE}:
            self.cover_id = None

    def to_dict(self) -> dict[str, Any]:
        """Serialize button."""
        payload: dict[str, Any] = {
            "index": self.index,
            "name": self.name,
            "action": self.action.to_dict() if self.action else None,
            "radio_member": bool(self.radio_member),
            "role": self.role,
            "pulse_time_s": self.pulse_time_s,
        }
        if self.cover_id:
            payload["cover_id"] = self.cover_id
        return payload

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ButtonConfig:
        """Deserialize button."""
        return cls(
            index=int(data["index"]),
            name=str(data.get("name") or ""),
            action=ButtonAction.from_dict(data.get("action")),
            radio_member=bool(data.get("radio_member", True)),
            role=normalize_button_role(data.get("role"), legacy_press_mode=data.get("press_mode")),
            pulse_time_s=clamp_pulse_time(data.get("pulse_time_s", DEFAULT_PULSE_TIME)),
            cover_id=data.get("cover_id"),
        )

    @property
    def is_momentary(self) -> bool:
        """Whether this button is a timed pulse role."""
        return self.role == BUTTON_ROLE_MOMENTARY

    @property
    def is_cover_role(self) -> bool:
        """Whether this button drives a cover direction."""
        return self.role in {BUTTON_ROLE_COVER_OPEN, BUTTON_ROLE_COVER_CLOSE}


@dataclass(slots=True)
class Profile:
    """Editable panel profile draft."""

    id: str
    name: str
    mode: ButtonMode = MODE_TOGGLE  # type: ignore[assignment]
    color_on: str = "cyan"
    color_off: str = "blue"
    radar: str = "30s"
    backlight: bool = True
    backlight_brightness: int = DEFAULT_BACKLIGHT_BRIGHTNESS
    child_lock: bool = False
    selected_button: int | None = None
    # How many physical gangs (L1…Ln) this profile exposes in the UI/engine.
    gang_count: int = DEFAULT_GANG_COUNT
    buttons: list[ButtonConfig] = field(default_factory=list)
    radio_groups: list[RadioGroup] = field(default_factory=list)
    covers: list[CoverConfig] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.mode = normalize_profile_mode(self.mode)  # type: ignore[assignment]
        self.gang_count = clamp_gang_count(self.gang_count)
        by_index = {button.index: button for button in self.buttons}
        self.buttons = [
            by_index.get(i) or ButtonConfig(index=i, name=f"Button {i}")
            for i in range(1, BUTTON_COUNT + 1)
        ]
        self.backlight_brightness = clamp_backlight_brightness(self.backlight_brightness)
        self.radio_groups = normalize_radio_groups(self.radio_groups, gang_count=self.gang_count)
        self.covers = normalize_covers(self.covers, gang_count=self.gang_count)
        if self.mode == MODE_MIXED:
            self._coerce_roles_for_gang_count()
            self.sync_covers_from_roles()
            self._prune_radio_groups_to_radio_roles()
        if self.selected_button is not None and (
            self.selected_button < 1 or self.selected_button > self.gang_count
        ):
            self.selected_button = None

    @property
    def cover(self) -> CoverConfig:
        """First cover mapping (legacy single-cover accessor)."""
        if self.covers:
            return self.covers[0]
        open_button, close_button = _default_cover_pair(0, self.gang_count)
        return CoverConfig(open_button=open_button, close_button=close_button)

    @cover.setter
    def cover(self, value: CoverConfig | dict[str, Any] | None) -> None:
        """Replace the first cover, preserving any additional covers."""
        normalized = normalize_cover(value, gang_count=self.gang_count)
        if self.covers:
            self.covers[0] = normalized
            self.covers = normalize_covers(self.covers, gang_count=self.gang_count)
        else:
            self.covers = normalize_covers([normalized], gang_count=self.gang_count)

    def button_names(self) -> tuple[str, str, str, str]:
        """Return ordered button names."""
        by_index = {button.index: button.name for button in self.buttons}
        return tuple(by_index.get(i, f"Button {i}") for i in range(1, BUTTON_COUNT + 1))  # type: ignore[return-value]

    def button_by_index(self, index: int) -> ButtonConfig | None:
        """Return button config for a 1-based index."""
        return next((button for button in self.buttons if button.index == index), None)

    def visible_buttons(self) -> list[ButtonConfig]:
        """Return button configs for the active gang count only."""
        return [button for button in self.buttons if button.index <= self.gang_count]

    def is_radio_member(self, index: int) -> bool:
        """Return whether a button participates in radio exclusivity."""
        button = self.button_by_index(index)
        if button is None:
            return True
        return bool(button.radio_member)

    def radio_member_indexes(self) -> list[int]:
        """Return 1-based indexes of buttons that participate in radio mode."""
        members = [
            button.index
            for button in self.buttons
            if button.radio_member and button.index <= self.gang_count
        ]
        return members or list(range(1, self.gang_count + 1))

    def active_covers(self) -> list[CoverConfig]:
        """Return covers that are live for the engine.

        Cover mode uses every stored cover. Mixed mode only uses covers that are
        actually wired by ``cover_open`` / ``cover_close`` button roles — unused
        timing templates must not claim L1/L2 or get forced OFF on Save Draft.
        """
        if self.mode == MODE_COVER:
            return list(self.covers)
        if self.mode != MODE_MIXED:
            return []
        bound_ids = {
            ((button.cover_id or COVER_DEFAULT_ID).strip() or COVER_DEFAULT_ID)
            for button in self.visible_buttons()
            if button.is_cover_role
        }
        if not bound_ids:
            return []
        return [cover for cover in self.covers if cover.id in bound_ids]

    def cover_for_button(self, index: int) -> CoverConfig | None:
        """Return the cover driven by a button, if any."""
        if self.mode == MODE_MIXED:
            button = self.button_by_index(index)
            if button is None or not button.is_cover_role:
                return None
            cover_id = (button.cover_id or COVER_DEFAULT_ID).strip() or COVER_DEFAULT_ID
            cover = self.cover_by_id(cover_id)
            if cover is not None:
                return cover
        for cover in self.active_covers() if self.mode == MODE_MIXED else self.covers:
            if cover.direction_for(index) is not None:
                return cover
        return None

    def cover_by_id(self, cover_id: str) -> CoverConfig | None:
        """Return a cover by id."""
        for cover in self.covers:
            if cover.id == cover_id:
                return cover
        return None

    def is_cover_button(self, index: int) -> bool:
        """Return whether a button drives a cover motor in cover mode."""
        return self.cover_for_button(index) is not None

    def all_cover_relay_indexes(self) -> list[int]:
        """Return every direction relay used by active covers on this profile."""
        indexes: list[int] = []
        for cover in self.active_covers():
            for index in cover.relay_indexes():
                if index not in indexes:
                    indexes.append(index)
        return indexes

    def radio_group_for(self, index: int) -> RadioGroup | None:
        """Return the radio_split group containing a button, if any."""
        for group in self.radio_groups:
            if index in group.buttons:
                return group
        return None

    def is_momentary_button(self, index: int) -> bool:
        """Return whether a button is a timed pulse role (mixed mode)."""
        button = self.button_by_index(index)
        return bool(button and button.is_momentary)

    def momentary_button_indexes(self) -> list[int]:
        """Return 1-based indexes configured as momentary within gang_count."""
        return [button.index for button in self.visible_buttons() if button.is_momentary]

    def button_role(self, index: int) -> str:
        """Return the mixed-mode role for a button (default toggle)."""
        button = self.button_by_index(index)
        if button is None:
            return BUTTON_ROLE_TOGGLE
        return button.role

    def _coerce_roles_for_gang_count(self) -> None:
        """Downgrade multi-button roles when the profile is 1-gang."""
        if self.gang_count > 1:
            return
        for button in self.buttons:
            if button.role in MULTI_BUTTON_ROLES:
                button.role = BUTTON_ROLE_TOGGLE  # type: ignore[assignment]
                button.cover_id = None

    def _prune_radio_groups_to_radio_roles(self) -> None:
        """Keep radio_groups membership limited to role=radio buttons."""
        radio_indexes = {
            button.index for button in self.visible_buttons() if button.role == BUTTON_ROLE_RADIO
        }
        for group in self.radio_groups:
            group.buttons = [index for index in group.buttons if index in radio_indexes]

    def sync_covers_from_roles(self) -> None:
        """Rebuild cover open/close button indexes from mixed button roles.

        Timing/settle/opposite_press are preserved from existing cover entries
        with the same id. Orphan timing blocks without both directions are kept
        only when still referenced; incomplete pairs are dropped from active use
        by validation.
        """
        if self.mode != MODE_MIXED:
            return
        by_id: dict[str, dict[str, int]] = {}
        for button in self.visible_buttons():
            if not button.is_cover_role:
                continue
            cover_id = (button.cover_id or "").strip() or COVER_DEFAULT_ID
            button.cover_id = cover_id
            slot = by_id.setdefault(cover_id, {})
            if button.role == BUTTON_ROLE_COVER_OPEN:
                slot["open_button"] = button.index
            else:
                slot["close_button"] = button.index

        existing = {cover.id: cover for cover in self.covers}
        rebuilt: list[CoverConfig] = []
        for cover_id, pair in by_id.items():
            open_button = pair.get("open_button")
            close_button = pair.get("close_button")
            if open_button is None or close_button is None:
                # Incomplete pair: keep a placeholder so the UI can finish wiring.
                open_button = open_button or pair.get("close_button") or 1
                close_button = close_button or open_button
            prior = existing.get(cover_id)
            payload = {
                "id": cover_id,
                "open_button": open_button,
                "close_button": close_button,
                "open_time_s": prior.open_time_s if prior else COVER_DEFAULT_OPEN_TIME,
                "close_time_s": prior.close_time_s if prior else COVER_DEFAULT_CLOSE_TIME,
                "direction_settle_s": (prior.direction_settle_s if prior else COVER_DEFAULT_SETTLE),
                "opposite_press": (prior.opposite_press if prior else COVER_OPPOSITE_STOP_ONLY),
                "ha_entity_id": prior.ha_entity_id if prior else None,
            }
            rebuilt.append(
                normalize_cover(payload, gang_count=self.gang_count, default_id=cover_id)
            )
        # Preserve unused cover timing templates when no cover roles exist yet.
        if not rebuilt and self.covers:
            rebuilt = list(self.covers)
        self.covers = normalize_covers(rebuilt, gang_count=self.gang_count)

    def to_dict(self) -> dict[str, Any]:
        """Serialize profile."""
        return {
            "id": self.id,
            "name": self.name,
            "mode": self.mode,
            "color_on": self.color_on,
            "color_off": self.color_off,
            "radar": self.radar,
            "backlight": self.backlight,
            "backlight_brightness": self.backlight_brightness,
            "child_lock": self.child_lock,
            "selected_button": self.selected_button,
            "gang_count": self.gang_count,
            "buttons": [button.to_dict() for button in self.buttons],
            "radio_groups": [group.to_dict() for group in self.radio_groups],
            "covers": [cover.to_dict() for cover in self.covers],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Profile:
        """Deserialize profile."""
        buttons = [ButtonConfig.from_dict(item) for item in data.get("buttons") or []]
        gang_count = clamp_gang_count(data.get("gang_count", DEFAULT_GANG_COUNT))
        covers = normalize_covers(
            data.get("covers"),
            data.get("cover"),
            gang_count=gang_count,
        )
        return cls(
            id=str(data["id"]),
            name=str(data.get("name") or data["id"]),
            mode=normalize_profile_mode(data.get("mode") or MODE_TOGGLE),  # type: ignore[arg-type]
            color_on=str(data.get("color_on") or "cyan"),
            color_off=str(data.get("color_off") or "blue"),
            radar=str(data.get("radar") or "30s"),
            backlight=bool(data.get("backlight", True)),
            backlight_brightness=clamp_backlight_brightness(
                data.get("backlight_brightness", DEFAULT_BACKLIGHT_BRIGHTNESS)
            ),
            child_lock=bool(data.get("child_lock", False)),
            selected_button=data.get("selected_button"),
            gang_count=gang_count,
            buttons=buttons,
            radio_groups=normalize_radio_groups(data.get("radio_groups"), gang_count=gang_count),
            covers=covers,
        )

    def clone(self, new_id: str, new_name: str | None = None) -> Profile:
        """Duplicate profile with a new identity."""
        data = self.to_dict()
        data["id"] = new_id
        data["name"] = new_name or f"{self.name} copy"
        return Profile.from_dict(data)


@dataclass(slots=True)
class HardwareState:
    """Current physical panel state."""

    names: tuple[str, str, str, str]
    relays: tuple[bool, bool, bool, bool]
    color_on: str
    color_off: str
    radar: str
    backlight: bool
    child_lock: bool
    backlight_brightness: int | None = None

    def to_dict(self) -> dict[str, Any]:
        """Serialize hardware state."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> HardwareState:
        """Deserialize hardware state."""
        brightness_raw = data.get("backlight_brightness")
        return cls(
            names=tuple(data["names"]),  # type: ignore[arg-type]
            relays=tuple(bool(value) for value in data["relays"]),  # type: ignore[arg-type]
            color_on=str(data["color_on"]),
            color_off=str(data["color_off"]),
            radar=str(data["radar"]),
            backlight=bool(data["backlight"]),
            child_lock=bool(data["child_lock"]),
            backlight_brightness=(
                None if brightness_raw is None else clamp_backlight_brightness(brightness_raw)
            ),
        )


@dataclass(slots=True)
class SyncResult:
    """Result of applying a profile to hardware."""

    success: bool
    error: str | None = None
    confirmed_steps: list[str] = field(default_factory=list)


@dataclass(slots=True)
class PanelStorageData:
    """Versioned persisted panel state."""

    schema_version: int = STORAGE_VERSION
    active_profile_id: str | None = None
    profiles: dict[str, Profile] = field(default_factory=dict)
    applied_snapshot: dict[str, Any] = field(default_factory=dict)
    last_sync: str | None = None
    last_error: str | None = None
    sync_status: SyncStatus = SYNC_PENDING  # type: ignore[assignment]

    def to_dict(self) -> dict[str, Any]:
        """Serialize storage payload."""
        return {
            "schema_version": self.schema_version,
            "active_profile_id": self.active_profile_id,
            "profiles": {key: profile.to_dict() for key, profile in self.profiles.items()},
            "applied_snapshot": deepcopy(self.applied_snapshot),
            "last_sync": self.last_sync,
            "last_error": self.last_error,
            "sync_status": self.sync_status,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> PanelStorageData:
        """Deserialize storage payload."""
        profiles = {
            key: Profile.from_dict(value) for key, value in (data.get("profiles") or {}).items()
        }
        return cls(
            schema_version=int(data.get("schema_version") or STORAGE_VERSION),
            active_profile_id=data.get("active_profile_id"),
            profiles=profiles,
            applied_snapshot=dict(data.get("applied_snapshot") or {}),
            last_sync=data.get("last_sync"),
            last_error=data.get("last_error"),
            sync_status=data.get("sync_status") or SYNC_PENDING,
        )

    def active_profile(self) -> Profile | None:
        """Return active profile if present."""
        if not self.active_profile_id:
            return None
        return self.profiles.get(self.active_profile_id)

    def ensure_defaults(self) -> None:
        """Ensure at least two starter profiles exist."""
        if self.profiles:
            if not self.active_profile_id or self.active_profile_id not in self.profiles:
                self.active_profile_id = next(iter(self.profiles))
            return
        lighting = Profile(
            id="lighting",
            name="Lighting",
            mode=MODE_TOGGLE,  # type: ignore[arg-type]
            color_on="cyan",
            color_off="blue",
            buttons=[
                ButtonConfig(index=1, name="Living room"),
                ButtonConfig(index=2, name="Kitchen"),
                ButtonConfig(index=3, name="Outdoor"),
                ButtonConfig(index=4, name="All off"),
            ],
        )
        scenes = Profile(
            id="scenes",
            name="Scenes",
            mode=MODE_TOGGLE,  # type: ignore[arg-type]
            color_on="white",
            color_off="blue",
            buttons=[
                ButtonConfig(index=1, name="Morning"),
                ButtonConfig(index=2, name="Evening"),
                ButtonConfig(index=3, name="Hosting"),
                ButtonConfig(index=4, name="Night"),
            ],
        )
        self.profiles = {lighting.id: lighting, scenes.id: scenes}
        self.active_profile_id = lighting.id
        self.sync_status = SYNC_PENDING  # type: ignore[assignment]

    def draft_matches_snapshot(self) -> bool:
        """Return whether active draft equals applied snapshot."""
        profile = self.active_profile()
        if profile is None:
            return not self.applied_snapshot
        return profile.to_dict() == self.applied_snapshot

    def refresh_pending_status(self) -> None:
        """Set pending/synced based on draft vs snapshot when idle."""
        if self.sync_status in {"syncing", "error"}:
            return
        self.sync_status = SYNC_SYNCED if self.draft_matches_snapshot() else SYNC_PENDING  # type: ignore[assignment]


@dataclass(slots=True)
class EntityMapping:
    """Installer-selected hardware mapping."""

    panel_name: str
    adapter_type: str
    relay_entities: tuple[str, str, str, str]
    name_entities: tuple[str, str, str, str]
    color_off_entity: str
    color_on_entity: str
    radar_entity: str
    backlight_entity: str
    child_lock_entity: str
    backlight_brightness_entity: str | None = None

    def all_entities(self) -> list[str]:
        """Return every mapped entity ID."""
        entities = [
            *self.relay_entities,
            *self.name_entities,
            self.color_off_entity,
            self.color_on_entity,
            self.radar_entity,
            self.backlight_entity,
            self.child_lock_entity,
        ]
        if self.backlight_brightness_entity:
            entities.append(self.backlight_brightness_entity)
        return entities

    def to_dict(self) -> dict[str, Any]:
        """Serialize mapping for config entry data."""
        payload: dict[str, Any] = {
            "panel_name": self.panel_name,
            "adapter_type": self.adapter_type,
            "relay_entities": list(self.relay_entities),
            "name_entities": list(self.name_entities),
            "color_off_entity": self.color_off_entity,
            "color_on_entity": self.color_on_entity,
            "radar_entity": self.radar_entity,
            "backlight_entity": self.backlight_entity,
            "child_lock_entity": self.child_lock_entity,
        }
        if self.backlight_brightness_entity:
            payload["backlight_brightness_entity"] = self.backlight_brightness_entity
        return payload

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> EntityMapping:
        """Deserialize mapping."""
        relays = tuple(data["relay_entities"])
        names = tuple(data["name_entities"])
        if len(relays) != BUTTON_COUNT or len(names) != BUTTON_COUNT:
            raise ValueError("Mapping must include exactly four relays and four names")
        brightness_entity = data.get("backlight_brightness_entity") or None
        if brightness_entity is not None:
            brightness_entity = str(brightness_entity).strip() or None
        return cls(
            panel_name=str(data["panel_name"]),
            adapter_type=str(data["adapter_type"]),
            relay_entities=relays,  # type: ignore[arg-type]
            name_entities=names,  # type: ignore[arg-type]
            color_off_entity=str(data["color_off_entity"]),
            color_on_entity=str(data["color_on_entity"]),
            radar_entity=str(data["radar_entity"]),
            backlight_entity=str(data["backlight_entity"]),
            child_lock_entity=str(data["child_lock_entity"]),
            backlight_brightness_entity=brightness_entity,
        )


def capability_defaults() -> dict[str, Any]:
    """Adapter capability defaults exposed to the frontend."""
    return {
        "colors": filter_ui_color_options(list(DEFAULT_COLORS)),
        "radar": list(DEFAULT_RADAR),
        "modes": list(SUPPORTED_MODES),
        "button_count": BUTTON_COUNT,
        "gang_count_min": GANG_COUNT_MIN,
        "gang_count_max": GANG_COUNT_MAX,
        "cover": {
            "min_time_s": COVER_TIME_MIN,
            "max_time_s": COVER_TIME_MAX,
            "min_settle_s": COVER_SETTLE_MIN,
            "max_settle_s": COVER_SETTLE_MAX,
            "opposite_press": list(COVER_OPPOSITE_MODES),
            "max_covers": max_covers_for_gangs(BUTTON_COUNT),
        },
        "mixed": {
            "roles": list(BUTTON_ROLES),
            "min_pulse_s": PULSE_TIME_MIN,
            "max_pulse_s": PULSE_TIME_MAX,
            "default_pulse_s": DEFAULT_PULSE_TIME,
        },
    }
