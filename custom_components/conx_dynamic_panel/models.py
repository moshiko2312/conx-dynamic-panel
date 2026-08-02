"""Typed models for ConX Dynamic Panel."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import asdict, dataclass, field
from typing import Any, Literal

from .const import (
    BACKLIGHT_BRIGHTNESS_MAX,
    BACKLIGHT_BRIGHTNESS_MIN,
    BUTTON_COUNT,
    DEFAULT_BACKLIGHT_BRIGHTNESS,
    DEFAULT_COLORS,
    DEFAULT_RADAR,
    MODE_TOGGLE,
    STORAGE_VERSION,
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

ButtonMode = Literal["toggle", "radio_mandatory", "radio_optional"]
SyncStatus = Literal["synced", "pending", "syncing", "error", "out_of_sync"]


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
    buttons: list[ButtonConfig] = field(default_factory=list)

    def __post_init__(self) -> None:
        by_index = {button.index: button for button in self.buttons}
        self.buttons = [
            by_index.get(i) or ButtonConfig(index=i, name=f"Button {i}")
            for i in range(1, BUTTON_COUNT + 1)
        ]
        self.backlight_brightness = clamp_backlight_brightness(self.backlight_brightness)

    def button_names(self) -> tuple[str, str, str, str]:
        """Return ordered button names."""
        by_index = {button.index: button.name for button in self.buttons}
        return tuple(by_index.get(i, f"Button {i}") for i in range(1, BUTTON_COUNT + 1))  # type: ignore[return-value]

    def button_by_index(self, index: int) -> ButtonConfig | None:
        """Return button config for a 1-based index."""
        return next((button for button in self.buttons if button.index == index), None)

    def is_radio_member(self, index: int) -> bool:
        """Return whether a button participates in radio exclusivity."""
        button = self.button_by_index(index)
        if button is None:
            return True
        return bool(button.radio_member)

    def radio_member_indexes(self) -> list[int]:
        """Return 1-based indexes of buttons that participate in radio mode."""
        members = [button.index for button in self.buttons if button.radio_member]
        return members or list(range(1, BUTTON_COUNT + 1))

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
            "buttons": [button.to_dict() for button in self.buttons],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Profile:
        """Deserialize profile."""
        buttons = [ButtonConfig.from_dict(item) for item in data.get("buttons") or []]
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
            buttons=buttons,
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
        "modes": ["toggle", "radio_mandatory", "radio_optional"],
        "button_count": BUTTON_COUNT,
    }
