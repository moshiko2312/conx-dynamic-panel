"""Timeout handling and clean unload tests."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.models import (
    EntityMapping,
    HardwareState,
    PanelStorageData,
    Profile,
    SyncResult,
)
from custom_components.conx_dynamic_panel.runtime import CoverRuntime, MomentaryRuntime
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker


class FakeStore:
    def __init__(self) -> None:
        self.data = PanelStorageData()
        self.data.ensure_defaults()
        self.saved = 0

    async def async_save(self) -> None:
        self.saved += 1


class SlowAdapter:
    def __init__(self, delay: float) -> None:
        self.delay = delay
        self.relay_calls: list[tuple[int, bool]] = []

    async def async_apply_profile(self, profile: Profile) -> SyncResult:
        await asyncio.sleep(self.delay)
        return SyncResult(success=True, confirmed_steps=["names"])

    async def async_set_relay(
        self, index: int, state: bool, *, suppress_event: bool = True
    ) -> None:
        self.relay_calls.append((index, state))

    async def async_read_hardware_state(self) -> HardwareState:
        return HardwareState(
            names=("A", "B", "C", "D"),
            relays=(False, False, False, False),
            color_on="cyan",
            color_off="blue",
            radar="30s",
            backlight=True,
            child_lock=False,
        )

    def supported_colors(self) -> list[str]:
        return ["cyan"]

    def supported_radar(self) -> list[str]:
        return ["30s"]


def _runtime(adapter: Any, store: FakeStore, *, sync_timeout: float = 30.0) -> Any:
    mapping = EntityMapping(
        panel_name="Kitchen",
        adapter_type="zemismart_4gang",
        relay_entities=("switch.l1", "switch.l2", "switch.l3", "switch.l4"),
        name_entities=("text.n1", "text.n2", "text.n3", "text.n4"),
        color_off_entity="select.off",
        color_on_entity="select.on",
        radar_entity="select.radar",
        backlight_entity="switch.backlight",
        child_lock_entity="switch.lock",
    )
    hass = SimpleNamespace(
        services=SimpleNamespace(
            has_service=lambda domain, service: True,
            async_call=AsyncMock(),
        ),
        bus=SimpleNamespace(async_fire=lambda *args, **kwargs: None),
        async_create_task=lambda coro: asyncio.create_task(coro),
    )
    entry = SimpleNamespace(entry_id="entry-1", options={"auto_sync": False})
    return SimpleNamespace(
        hass=hass,
        entry=entry,
        mapping=mapping,
        store=store,
        adapter=adapter,
        suppression=SuppressionTracker(),
        sync_lock=asyncio.Lock(),
        cover=CoverRuntime(),
        momentary=MomentaryRuntime(),
        unloading=False,
        listeners=[],
        update_callbacks=[],
        auto_sync=False,
        sync_timeout=sync_timeout,
        confirm_timeout=1.0,
        async_notify=lambda: None,
    )


@pytest.mark.asyncio
async def test_sync_timeout_sets_error_and_keeps_snapshot() -> None:
    store = FakeStore()
    previous = {"id": "lighting", "name": "Previous"}
    store.data.applied_snapshot = previous
    adapter = SlowAdapter(delay=0.2)
    runtime = _runtime(adapter, store, sync_timeout=0.05)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    with pytest.raises(RuntimeError, match="timed out"):
        await coordinator.async_sync()
    assert store.data.sync_status == "error"
    assert store.data.applied_snapshot == previous
    assert "timed out" in (store.data.last_error or "").lower()


@pytest.mark.asyncio
async def test_unload_clears_listeners_and_suppression() -> None:
    store = FakeStore()
    adapter = SlowAdapter(delay=0)
    runtime = _runtime(adapter, store)
    removed = {"count": 0}

    def _remove() -> None:
        removed["count"] += 1

    runtime.listeners.append(_remove)
    runtime.suppression.register("switch.l1", "on", operation_id="op1")
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    await coordinator.async_unload()
    assert runtime.unloading is True
    assert runtime.listeners == []
    assert removed["count"] == 1
    assert runtime.suppression.should_suppress("switch.l1", "on") is False
