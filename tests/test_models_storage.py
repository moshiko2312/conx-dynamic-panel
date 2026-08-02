"""Tests for models and storage migration helpers."""

from __future__ import annotations

import pytest

from custom_components.conx_dynamic_panel.models import PanelStorageData, Profile
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


def test_storage_migration_sets_current_version() -> None:
    migrated = _migrate({"schema_version": 1, "profiles": {}})
    assert migrated["schema_version"] == 1


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
