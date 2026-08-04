"""Typed models for ConX Dynamic Panel."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import asdict, dataclass, field
from typing import Any, Literal

from .const import (
    BACKLIGHT_BRIGHTNESS_MAX,
    BACKLIGHT_BRIGHTNESS_MIN,
    BUTTON_COUNT,
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
    DEFAULT_RADAR,
    GANG_COUNT_MAX,
    GANG_COUNT_MIN,
    MODE_TOGGLE,
    STORAGE_VERSION,
    SUPPORTED_MODES,
    SYNC_PENDING,
    SYNC_SYNCED,
)


def clamp_backlight_brightness(value: Any) -> int:
    """Clamp backlight brightness to the supported 0–100 range."""
    try:
        brightness = int(round(float(value)))
    except (TypeError, ValueError):
        return DEFAULT_BACKLIGHT_BRIGHTNESS
    return max(BACKLIGHT_BRIGHTNESS_MIN, min(BACKLIGHT_BRIGHTNESS_MAX, brightness))


ButtonMode = Literal["toggle", "radio_mandatory", "radio_optional", "radio_split", "cover"]
SyncStatus = Literal["synced", "pending", "syncing", "error", "out_of_sync"]
CoverDirection = Literal["open", "close"]


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

    def to_dict(self) -> dict[str, Any]:
        """Serialize cover config."""
        return {
            "id": self.id,
            "open_button": self.open_button,
            "close_button": self.close_button,
            "open_time_s": self.open_time_s,
            "close_time_s": self.close_time_s,
            "direction_settle_s": self.direction_settle_s,
            "opposite_press": self.opposite_press,
        }

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


@dataclass(slots=True)
class ButtonAction:
    """Normalized Home Assistant service-call action."""

    action: str
    target: dict[str, Any] = field(default_factory=dict)
    data: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Serialize action."""
        return {"action": self.action, "target": deepcopy(self.target), "data": deepcopy(self.data)}

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

    def to_dict(self) -> dict[str, Any]:
        """Serialize button."""
        return {
            "index": self.index,
            "name": self.name,
            "action": self.action.to_dict() if self.action else None,
            "radio_member": bool(self.radio_member),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ButtonConfig:
        """Deserialize button."""
        return cls(
            index=int(data["index"]),
            name=str(data.get("name") or ""),
            action=ButtonAction.from_dict(data.get("action")),
            radio_member=bool(data.get("radio_member", True)),
        )


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
        self.gang_count = clamp_gang_count(self.gang_count)
        by_index = {button.index: button for button in self.buttons}
        self.buttons = [
            by_index.get(i) or ButtonConfig(index=i, name=f"Button {i}")
            for i in range(1, BUTTON_COUNT + 1)
        ]
        self.backlight_brightness = clamp_backlight_brightness(self.backlight_brightness)
        self.radio_groups = normalize_radio_groups(self.radio_groups, gang_count=self.gang_count)
        self.covers = normalize_covers(self.covers, gang_count=self.gang_count)
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

    def cover_for_button(self, index: int) -> CoverConfig | None:
        """Return the cover driven by a button, if any."""
        for cover in self.covers:
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
        """Return every direction relay used by any cover on this profile."""
        indexes: list[int] = []
        for cover in self.covers:
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
            mode=data.get("mode") or MODE_TOGGLE,
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
            color_on="warm_white",
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
        "colors": list(DEFAULT_COLORS),
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
    }
