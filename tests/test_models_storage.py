"""Tests for models and storage migration helpers."""

from __future__ import annotations

import pytest

from custom_components.conx_dynamic_panel.models import (
    PanelStorageData,
    Profile,
    RadioGroup,
    validate_radio_groups,
)
from custom_components.conx_dynamic_panel.storage import _migrate


def test_default_profiles_created() -> None:
    data = PanelStorageData()
    data.ensure_defaults()
    assert "lighting" in data.profiles
    assert "scenes" in data.profiles
    assert data.active_profile_id == "lighting"


def test_draft_matches_snapshot() -> None:
    data = PanelStorageData()
    data.ensure_defaults()
    profile = data.active_profile()
    assert profile is not None
    data.applied_snapshot = profile.to_dict()
    assert data.draft_matches_snapshot() is True
    profile.name = "Changed"
    assert data.draft_matches_snapshot() is False


def test_profile_clone() -> None:
    profile = Profile(id="a", name="A")
    clone = profile.clone("b", "B")
    assert clone.id == "b"
    assert clone.name == "B"
    assert clone.buttons[0].index == 1
    # Whitespace-only custom name falls back to "{original} copy".
    assert profile.clone("c", "  ").name == "A copy"
    assert Profile(id="x", name="").clone("y", None).name == "copy"


def test_profile_defaults_brightness_and_radio_member() -> None:
    profile = Profile.from_dict(
        {
            "id": "x",
            "name": "X",
            "buttons": [{"index": 1, "name": "A", "radio_member": False}],
        }
    )
    assert profile.backlight_brightness == 100
    assert profile.buttons[0].radio_member is False
    assert profile.is_radio_member(1) is False
    assert profile.radio_member_indexes() == [2, 3, 4]
    payload = profile.to_dict()
    assert payload["backlight_brightness"] == 100
    assert payload["buttons"][0]["radio_member"] is False
    assert len(payload["radio_groups"]) >= 2


def test_radio_groups_roundtrip_and_lookup() -> None:
    profile = Profile.from_dict(
        {
            "id": "split",
            "name": "Split",
            "mode": "radio_split",
            "radio_groups": [
                {"id": "g1", "buttons": [1, 4]},
                {"id": "g2", "buttons": [2, 3]},
            ],
        }
    )
    group1 = profile.radio_group_for(1)
    group2 = profile.radio_group_for(2)
    assert group1 is not None and group1.id == "g1"
    assert group2 is not None and group2.id == "g2"
    assert profile.radio_group_for(3) is group2
    payload = profile.to_dict()
    assert payload["radio_groups"][0]["buttons"] == [1, 4]


def test_validate_radio_groups_rejects_overlap() -> None:
    with pytest.raises(ValueError, match="Button 1"):
        validate_radio_groups(
            [
                RadioGroup(id="g1", buttons=[1, 4]),
                RadioGroup(id="g2", buttons=[1, 2]),
            ]
        )


def test_backlight_brightness_clamped() -> None:
    profile = Profile.from_dict({"id": "x", "name": "X", "backlight_brightness": 250})
    assert profile.backlight_brightness == 100
    profile2 = Profile.from_dict({"id": "y", "name": "Y", "backlight_brightness": -5})
    assert profile2.backlight_brightness == 0


def test_storage_migration_sets_current_version() -> None:
    migrated = _migrate({"schema_version": 1, "profiles": {}})
    assert migrated["schema_version"] == 5
    assert migrated["scheduler_tasks"] == {}
    assert migrated.get("default_profile_id") is None
    assert migrated.get("holiday_mode") is False


def test_storage_migration_v4_to_v5_adds_panel_holiday() -> None:
    migrated = _migrate(
        {
            "schema_version": 4,
            "profiles": {"lighting": {"id": "lighting", "name": "Lighting"}},
            "scheduler_tasks": {},
            "default_profile_id": "lighting",
        }
    )
    assert migrated["schema_version"] == 5
    assert migrated["holiday_mode"] is False
    assert migrated["profiles"]["lighting"]["name"] == "Lighting"


def test_storage_migration_cover_to_covers() -> None:
    migrated = _migrate(
        {
            "schema_version": 1,
            "profiles": {
                "lighting": {
                    "id": "lighting",
                    "name": "Lighting",
                    "cover": {
                        "open_button": 1,
                        "close_button": 3,
                        "open_time_s": 20,
                        "close_time_s": 20,
                        "direction_settle_s": 0.5,
                        "opposite_press": "stop_only",
                    },
                }
            },
        }
    )
    profile = migrated["profiles"]["lighting"]
    assert "cover" not in profile
    assert profile["gang_count"] == 4
    assert len(profile["covers"]) == 1
    assert profile["covers"][0]["open_button"] == 1
    assert profile["covers"][0]["close_button"] == 3


def test_profile_covers_and_gang_count() -> None:
    profile = Profile.from_dict(
        {
            "id": "covers",
            "name": "Covers",
            "mode": "cover",
            "gang_count": 4,
            "covers": [
                {"id": "a", "open_button": 1, "close_button": 2},
                {"id": "b", "open_button": 3, "close_button": 4},
            ],
        }
    )
    assert profile.gang_count == 4
    assert len(profile.covers) == 2
    assert profile.cover_for_button(3) is profile.covers[1]
    assert profile.cover.id == "a"
    payload = profile.to_dict()
    assert "cover" not in payload
    assert payload["covers"][1]["id"] == "b"


def test_storage_migration_rejects_future_version() -> None:
    with pytest.raises(ValueError, match="Unsupported storage schema"):
        _migrate({"schema_version": 99, "profiles": {}})


def test_storage_roundtrip_preserves_profiles() -> None:
    data = PanelStorageData()
    data.ensure_defaults()
    restored = PanelStorageData.from_dict(data.to_dict())
    assert set(restored.profiles) == {"lighting", "scenes"}
    assert restored.active_profile_id == "lighting"
    assert restored.profiles["lighting"].buttons[0].name == "Living room"
