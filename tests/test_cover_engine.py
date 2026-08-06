"""Cover/shutter engine safety tests.

Every test runs against a fake adapter that raises the moment both direction
relays would be energized at the same time, so the mutual-exclusion contract is
checked continuously and not only by explicit assertions.
"""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.conx_dynamic_panel.const import (
    COVER_OPPOSITE_STOP_ONLY,
    COVER_OPPOSITE_STOP_THEN_REVERSE,
    MODE_COVER,
    MODE_MIXED,
    MODE_TOGGLE,
)
from custom_components.conx_dynamic_panel.coordinator import PanelCoordinator
from custom_components.conx_dynamic_panel.models import (
    ButtonAction,
    CoverConfig,
    EntityMapping,
    HardwareState,
    PanelStorageData,
    Profile,
    SyncResult,
    validate_cover_config,
)
from custom_components.conx_dynamic_panel.runtime import CoverRuntime, MomentaryRuntime
from custom_components.conx_dynamic_panel.suppression import SuppressionTracker

OPEN_BUTTON = 1
CLOSE_BUTTON = 3
# COVER_TIME_MIN is one second, so the timer-expiry test uses the shortest
# configuration a user could actually save.
TRAVEL = 1.0


class BothDirectionsEnergized(AssertionError):
    """Raised when the engine would energize both cover relays at once."""


class FakeStore:
    def __init__(self) -> None:
        self.data = PanelStorageData()
        self.data.ensure_defaults()
        self.saved = 0

    async def async_save(self) -> None:
        self.saved += 1


class CoverAdapter:
    """Adapter fake that enforces hard mutual exclusion on every write."""

    def __init__(self) -> None:
        self.relay_calls: list[tuple[int, bool]] = []
        self.relays: dict[int, bool] = {1: False, 2: False, 3: False, 4: False}
        self.fail_on: set[tuple[int, bool]] = set()
        self.apply_result = SyncResult(success=True, confirmed_steps=["relays"])
        self.cover_pairs: list[tuple[int, int]] = [(OPEN_BUTTON, CLOSE_BUTTON)]
        self.suppression: SuppressionTracker | None = None
        self.relay_entities: tuple[str, ...] = (
            "switch.l1",
            "switch.l2",
            "switch.l3",
            "switch.l4",
        )

    async def async_set_relay(
        self, index: int, state: bool, *, suppress_event: bool = True
    ) -> None:
        if (index, state) in self.fail_on:
            raise RuntimeError(f"relay {index} write failed")
        if state:
            for left, right in self.cover_pairs:
                other = right if index == left else left if index == right else None
                if other is not None and self.relays[other]:
                    raise BothDirectionsEnergized(
                        f"relay {index} turned on while relay {other} is still on"
                    )
        if suppress_event and self.suppression is not None:
            entity_id = self.relay_entities[index - 1]
            self.suppression.register(
                entity_id,
                "on" if state else "off",
                operation_id=f"test-{index}-{'on' if state else 'off'}",
            )
        self.relays[index] = state
        self.relay_calls.append((index, state))

    def relay_is_on(self, index: int) -> bool:
        return bool(self.relays.get(index))

    async def async_apply_profile(self, profile: Profile) -> SyncResult:
        return self.apply_result

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
        return ["cyan", "blue"]

    def supported_radar(self) -> list[str]:
        return ["30s"]


def _runtime(adapter: CoverAdapter, store: FakeStore) -> Any:
    mapping = EntityMapping(
        panel_name="Salon",
        adapter_type="zemismart_4gang",
        relay_entities=("switch.l1", "switch.l2", "switch.l3", "switch.l4"),
        name_entities=("text.n1", "text.n2", "text.n3", "text.n4"),
        color_off_entity="select.off",
        color_on_entity="select.on",
        radar_entity="select.radar",
        backlight_entity="switch.backlight",
        child_lock_entity="switch.lock",
    )
    events: list[tuple[str, dict[str, Any]]] = []
    hass = SimpleNamespace(
        services=SimpleNamespace(
            has_service=lambda domain, service: True,
            async_call=AsyncMock(),
        ),
        bus=SimpleNamespace(async_fire=lambda event, data=None: events.append((event, data or {}))),
        async_create_task=lambda coro: asyncio.create_task(coro),
    )
    entry = SimpleNamespace(entry_id="entry-1", options={"auto_sync": False})
    suppression = SuppressionTracker()
    adapter.suppression = suppression
    adapter.relay_entities = mapping.relay_entities
    return SimpleNamespace(
        hass=hass,
        entry=entry,
        mapping=mapping,
        store=store,
        adapter=adapter,
        suppression=suppression,
        sync_lock=asyncio.Lock(),
        cover=CoverRuntime(),
        momentary=MomentaryRuntime(),
        unloading=False,
        listeners=[],
        update_callbacks=[],
        auto_sync=False,
        sync_timeout=30.0,
        confirm_timeout=10.0,
        async_notify=lambda: None,
        events=events,
    )


def _cover_profile(
    store: FakeStore,
    *,
    opposite_press: str = COVER_OPPOSITE_STOP_ONLY,
    settle: float = 0.0,
    open_time: float = 5.0,
    close_time: float = 5.0,
) -> Profile:
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_COVER  # type: ignore[assignment]
    profile.cover = CoverConfig(
        open_button=OPEN_BUTTON,
        close_button=CLOSE_BUTTON,
        open_time_s=open_time,
        close_time_s=close_time,
        direction_settle_s=settle,
        opposite_press=opposite_press,
    )
    return profile


def _build(**kwargs: Any) -> tuple[PanelCoordinator, CoverAdapter, FakeStore, Profile, Any]:
    store = FakeStore()
    adapter = CoverAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = _cover_profile(store, **kwargs)
    adapter.cover_pairs = [profile.cover.relay_indexes()]
    return coordinator, adapter, store, profile, runtime


def _assert_all_cover_relays_off(adapter: CoverAdapter) -> None:
    assert adapter.relays[OPEN_BUTTON] is False
    assert adapter.relays[CLOSE_BUTTON] is False


def _assert_no_both_on_window(calls: list[tuple[int, bool]], left: int, right: int) -> None:
    """Replay write order; left and right must never both be True."""
    state = {left: False, right: False}
    for index, value in calls:
        if index not in state:
            continue
        state[index] = value
        if state[left] and state[right]:
            raise AssertionError(
                f"both cover relays ON after {index}={'on' if value else 'off'}: {calls}"
            )


# ---------------------------------------------------------------------------
# Starting travel
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_press_open_while_idle_starts_opening() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(open_time=5.0)
    # Physical latching press already energized open before the HA event.
    adapter.relays[OPEN_BUTTON] = True
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    # Opposite OFF only — never pulse the already-ON target OFF→ON.
    assert adapter.relay_calls == [(CLOSE_BUTTON, False)]
    assert adapter.relays[OPEN_BUTTON] is True
    assert adapter.relays[CLOSE_BUTTON] is False
    assert runtime.cover.direction == "open"
    assert runtime.cover.duration == 5.0
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_press_close_while_idle_starts_closing_with_close_time() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(open_time=5.0, close_time=9.0)
    adapter.relays[CLOSE_BUTTON] = True
    await coordinator._async_handle_physical_press(CLOSE_BUTTON, True)
    assert adapter.relay_calls == [(OPEN_BUTTON, False)]
    assert adapter.relays[CLOSE_BUTTON] is True
    assert runtime.cover.direction == "close"
    assert runtime.cover.duration == 9.0
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_cover_command_turns_target_on_when_off() -> None:
    """Card/service start must energize target when it is not already ON."""
    coordinator, adapter, _store, _profile, runtime = _build(open_time=5.0)
    await coordinator.async_cover_command("open")
    assert adapter.relay_calls == [(CLOSE_BUTTON, False), (OPEN_BUTTON, True)]
    assert runtime.cover.direction == "open"
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_arbitrary_buttons_can_be_mapped_to_directions() -> None:
    coordinator, adapter, store, profile, runtime = _build()
    profile.covers = [CoverConfig(open_button=4, close_button=2, open_time_s=5.0, close_time_s=5.0)]
    adapter.cover_pairs = [(4, 2)]
    adapter.relays[4] = True
    await coordinator._async_handle_physical_press(4, True)
    assert adapter.relay_calls == [(2, False)]
    assert runtime.cover.direction == "open"
    await coordinator._async_cover_abort("test")


# ---------------------------------------------------------------------------
# Stopping
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_repress_same_direction_stops_and_cancels_timer() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(open_time=5.0)
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    timer = runtime.cover.timer
    adapter.relay_calls.clear()
    # Re-pressing the moving direction toggles its latching relay OFF.
    await coordinator._async_handle_physical_press(OPEN_BUTTON, False)
    assert runtime.cover.moving is False
    _assert_all_cover_relays_off(adapter)
    assert set(adapter.relay_calls) == {(OPEN_BUTTON, False), (CLOSE_BUTTON, False)}
    assert timer is not None
    await asyncio.sleep(0)
    assert timer.cancelled() or timer.done()


@pytest.mark.asyncio
async def test_relay_off_while_idle_triggers_safety_halt_without_motion() -> None:
    coordinator, adapter, _store, _profile, runtime = _build()
    await coordinator._async_handle_physical_press(OPEN_BUTTON, False)
    assert runtime.cover.moving is False
    _assert_all_cover_relays_off(adapter)
    assert all(state is False for _index, state in adapter.relay_calls)


@pytest.mark.asyncio
async def test_travel_timer_expiry_forces_both_relays_off() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(open_time=TRAVEL)
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    assert runtime.cover.moving is True
    await asyncio.sleep(TRAVEL + 0.3)
    assert runtime.cover.moving is False
    assert runtime.cover.last_reason == "travel_complete"
    _assert_all_cover_relays_off(adapter)


@pytest.mark.asyncio
async def test_cover_command_stop_halts_travel() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(open_time=5.0)
    await coordinator.async_cover_command("open")
    assert runtime.cover.direction == "open"
    result = await coordinator.async_cover_command("stop")
    assert result["state"] == "idle"
    _assert_all_cover_relays_off(adapter)


# ---------------------------------------------------------------------------
# Opposite direction
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_opposite_press_stop_only_does_not_start_reverse() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(
        opposite_press=COVER_OPPOSITE_STOP_ONLY, open_time=5.0
    )
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    adapter.relay_calls.clear()
    await coordinator._async_handle_physical_press(CLOSE_BUTTON, True)
    assert runtime.cover.moving is False
    _assert_all_cover_relays_off(adapter)
    assert all(state is False for _index, state in adapter.relay_calls)


@pytest.mark.asyncio
async def test_opposite_press_stop_then_reverse_stops_before_starting() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(
        opposite_press=COVER_OPPOSITE_STOP_THEN_REVERSE,
        settle=0.01,
        open_time=5.0,
        close_time=5.0,
    )
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    adapter.relay_calls.clear()
    await coordinator._async_handle_physical_press(CLOSE_BUTTON, True)
    assert runtime.cover.direction == "close"
    assert runtime.cover.moving is True
    assert runtime.cover.timer is not None
    # Active open is killed first, then close OFF, settle re-asserts both OFF,
    # then start forces opposite OFF again before close ON — never both true.
    first_close_on = adapter.relay_calls.index((CLOSE_BUTTON, True))
    prefix = adapter.relay_calls[:first_close_on]
    assert (OPEN_BUTTON, False) in prefix
    assert prefix[0] == (OPEN_BUTTON, False)  # kill active direction ASAP
    assert all(state is False for _index, state in prefix)
    assert adapter.relays[OPEN_BUTTON] is False
    assert adapter.relays[CLOSE_BUTTON] is True
    _assert_no_both_on_window(adapter.relay_calls, OPEN_BUTTON, CLOSE_BUTTON)
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_stop_then_reverse_energizes_when_relay_is_on_is_stale() -> None:
    """After halt both are OFF; reverse must turn_on even if is_on lies."""
    coordinator, adapter, _store, _profile, runtime = _build(
        opposite_press=COVER_OPPOSITE_STOP_THEN_REVERSE,
        settle=0.0,
        open_time=5.0,
        close_time=5.0,
    )
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    adapter.relay_calls.clear()

    real_is_on = adapter.relay_is_on

    def stale_is_on(index: int) -> bool:
        # Simulate HA still reporting the reverse target ON from the physical
        # press even though halt already wrote it OFF.
        if index == CLOSE_BUTTON and adapter.relays[CLOSE_BUTTON] is False:
            return True
        return real_is_on(index)

    adapter.relay_is_on = stale_is_on  # type: ignore[method-assign]
    await coordinator._async_handle_physical_press(CLOSE_BUTTON, True)
    assert runtime.cover.direction == "close"
    assert runtime.cover.timer is not None
    assert adapter.relays[CLOSE_BUTTON] is True
    assert (CLOSE_BUTTON, True) in adapter.relay_calls
    _assert_no_both_on_window(adapter.relay_calls, OPEN_BUTTON, CLOSE_BUTTON)
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_inactive_direction_off_after_reverse_does_not_abort() -> None:
    """Duplicate Zigbee OFF on the previous direction must not kill reverse."""
    coordinator, adapter, _store, _profile, runtime = _build(
        opposite_press=COVER_OPPOSITE_STOP_THEN_REVERSE,
        settle=0.0,
        open_time=5.0,
        close_time=5.0,
    )
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    await coordinator._async_handle_physical_press(CLOSE_BUTTON, True)
    assert runtime.cover.direction == "close"
    assert adapter.relays[CLOSE_BUTTON] is True
    adapter.relay_calls.clear()
    await coordinator._async_handle_physical_press(OPEN_BUTTON, False)
    assert runtime.cover.direction == "close"
    assert adapter.relays[CLOSE_BUTTON] is True
    assert adapter.relay_calls == []
    await coordinator._async_cover_abort("test")


def _relay_event(entity_id: str, old: str, new: str) -> SimpleNamespace:
    return SimpleNamespace(
        data={
            "entity_id": entity_id,
            "old_state": SimpleNamespace(state=old),
            "new_state": SimpleNamespace(state=new),
        }
    )


@pytest.mark.asyncio
async def test_late_off_after_reverse_start_stays_on() -> None:
    """Deferred halt OFF after force ON must not kill the new direction.

    Reproduces the HA bus race: halt registers OFF, reverse registers ON
    (queue keeps both), then the deferred OFF event arrives after start.
    Single-slot suppression used to overwrite OFF with ON so the late OFF
    was treated as a stop press (ON → immediate OFF).
    """
    coordinator, adapter, _store, _profile, runtime = _build(
        opposite_press=COVER_OPPOSITE_STOP_THEN_REVERSE,
        settle=0.0,
        open_time=5.0,
        close_time=5.0,
    )
    close_entity = runtime.mapping.relay_entities[CLOSE_BUTTON - 1]

    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    await coordinator._async_handle_physical_press(CLOSE_BUTTON, True)
    assert runtime.cover.direction == "close"
    assert adapter.relays[CLOSE_BUTTON] is True
    assert runtime.cover.timer is not None

    # Simulate the deferred halt OFF that was still queued on the bus when
    # reverse turn_on overwrote the single-slot expectation (pre-fix).
    runtime.suppression.register(close_entity, "off", operation_id="halt-off")
    runtime.suppression.register(close_entity, "on", operation_id="reverse-on")
    adapter.relay_calls.clear()
    await coordinator._async_handle_relay_event(_relay_event(close_entity, "on", "off"))

    assert runtime.cover.direction == "close"
    assert runtime.cover.moving is True
    assert runtime.cover.timer is not None
    assert adapter.relays[CLOSE_BUTTON] is True
    # Suppression consumed the OFF; no halt writes.
    assert adapter.relay_calls == []
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_active_off_during_post_start_grace_reasserts_on() -> None:
    """If a stale OFF slips past suppression, grace re-energizes and keeps travel."""
    coordinator, adapter, _store, _profile, runtime = _build(
        opposite_press=COVER_OPPOSITE_STOP_THEN_REVERSE,
        settle=0.0,
        open_time=5.0,
        close_time=5.0,
    )
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    await coordinator._async_handle_physical_press(CLOSE_BUTTON, True)
    assert runtime.cover.direction == "close"
    # Simulate HA reporting OFF (stale) without going through suppression.
    adapter.relays[CLOSE_BUTTON] = False
    adapter.relay_calls.clear()
    runtime.suppression.clear()
    await coordinator._async_handle_physical_press(CLOSE_BUTTON, False)

    assert runtime.cover.direction == "close"
    assert runtime.cover.timer is not None
    assert adapter.relays[CLOSE_BUTTON] is True
    assert (CLOSE_BUTTON, True) in adapter.relay_calls
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_active_off_after_grace_still_stops() -> None:
    """Deliberate stop after the reverse post-start grace must halt as before."""
    coordinator, adapter, _store, _profile, runtime = _build(
        opposite_press=COVER_OPPOSITE_STOP_THEN_REVERSE,
        settle=0.0,
        open_time=5.0,
        close_time=5.0,
    )
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    await coordinator._async_handle_physical_press(CLOSE_BUTTON, True)
    motion = runtime.cover.get(_profile.cover.id)
    assert motion.suppress_stale_off_until is not None
    motion.suppress_stale_off_until = 0.0  # expire grace
    adapter.relay_calls.clear()
    await coordinator._async_handle_physical_press(CLOSE_BUTTON, False)
    assert runtime.cover.moving is False
    _assert_all_cover_relays_off(adapter)


@pytest.mark.asyncio
async def test_cover_command_stop_then_reverse_energizes_opposite() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(
        opposite_press=COVER_OPPOSITE_STOP_THEN_REVERSE,
        settle=0.0,
        open_time=5.0,
        close_time=5.0,
    )
    await coordinator.async_cover_command("open")
    adapter.relay_calls.clear()
    result = await coordinator.async_cover_command("close")
    assert result["state"] == "close"
    assert runtime.cover.direction == "close"
    assert runtime.cover.timer is not None
    assert adapter.relays[OPEN_BUTTON] is False
    assert adapter.relays[CLOSE_BUTTON] is True
    assert (CLOSE_BUTTON, True) in adapter.relay_calls
    _assert_no_both_on_window(adapter.relay_calls, OPEN_BUTTON, CLOSE_BUTTON)
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_stop_then_reverse_settles_with_both_off() -> None:
    """During settle both relays stay OFF; reverse ON only after the wait."""
    coordinator, adapter, _store, _profile, runtime = _build(
        opposite_press=COVER_OPPOSITE_STOP_THEN_REVERSE,
        settle=0.05,
        open_time=5.0,
        close_time=5.0,
    )
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    adapter.relay_calls.clear()

    task = asyncio.create_task(coordinator._async_handle_physical_press(CLOSE_BUTTON, True))
    await asyncio.sleep(0.02)  # mid-settle
    assert adapter.relays[OPEN_BUTTON] is False
    assert adapter.relays[CLOSE_BUTTON] is False
    assert runtime.cover.moving is False  # still settling / not yet reverse
    await task
    assert runtime.cover.direction == "close"
    assert adapter.relays[OPEN_BUTTON] is False
    assert adapter.relays[CLOSE_BUTTON] is True
    _assert_no_both_on_window(adapter.relay_calls, OPEN_BUTTON, CLOSE_BUTTON)
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_start_clears_stale_opposite_on_without_pulsing_target() -> None:
    """If opposite is stuck ON, start kills opposite only; keep already-ON target."""
    coordinator, adapter, _store, _profile, runtime = _build(open_time=5.0)
    # Simulate illegal hardware state without going through the adapter guard.
    adapter.relays[OPEN_BUTTON] = True
    adapter.relays[CLOSE_BUTTON] = True
    await coordinator._async_cover_start(_profile.cover, _profile, "open", "test")
    assert adapter.relay_calls == [(CLOSE_BUTTON, False)]
    assert adapter.relays[OPEN_BUTTON] is True
    assert adapter.relays[CLOSE_BUTTON] is False
    assert runtime.cover.direction == "open"
    _assert_no_both_on_window(adapter.relay_calls, OPEN_BUTTON, CLOSE_BUTTON)
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_cover_command_open_while_closing_stops_only_by_default() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(close_time=5.0)
    await coordinator.async_cover_command("close")
    adapter.relay_calls.clear()
    await coordinator.async_cover_command("open")
    assert runtime.cover.moving is False
    _assert_all_cover_relays_off(adapter)


# ---------------------------------------------------------------------------
# Cancellation and fail-safes
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_profile_switch_cancels_travel_and_de_energizes() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(open_time=5.0)
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    await coordinator.async_activate_profile("scenes")
    assert runtime.cover.moving is False
    _assert_all_cover_relays_off(adapter)
    adapter.relay_calls.clear()
    await asyncio.sleep(0.05)
    assert adapter.relay_calls == []


@pytest.mark.asyncio
async def test_updating_active_profile_cancels_travel() -> None:
    coordinator, adapter, store, profile, runtime = _build(open_time=5.0)
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    payload = profile.to_dict()
    payload["covers"][0]["open_time_s"] = 30.0
    await coordinator.async_update_profile(profile.id, payload)
    assert runtime.cover.moving is False
    _assert_all_cover_relays_off(adapter)
    assert store.data.profiles[profile.id].cover.open_time_s == 30.0


@pytest.mark.asyncio
async def test_unload_stops_travel_and_forces_relays_off() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(open_time=5.0)
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    await coordinator.async_unload()
    assert runtime.cover.moving is False
    assert runtime.unloading is True
    _assert_all_cover_relays_off(adapter)


@pytest.mark.asyncio
async def test_sync_stops_travel_before_writing_hardware() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(open_time=5.0)
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    await coordinator.async_sync()
    assert runtime.cover.moving is False
    _assert_all_cover_relays_off(adapter)


@pytest.mark.asyncio
async def test_setup_forces_cover_relays_off() -> None:
    store = FakeStore()
    adapter = CoverAdapter()
    runtime = _runtime(adapter, store)
    _cover_profile(store, open_time=5.0)
    runtime.store.async_load = AsyncMock(return_value=store.data)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    coordinator._attach_listeners = lambda: None  # type: ignore[method-assign]
    await coordinator.async_setup()
    assert set(adapter.relay_calls) == {(OPEN_BUTTON, False), (CLOSE_BUTTON, False)}


@pytest.mark.asyncio
async def test_failed_energize_forces_both_relays_off() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(open_time=5.0)
    adapter.fail_on.add((OPEN_BUTTON, True))
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    assert runtime.cover.moving is False
    _assert_all_cover_relays_off(adapter)


@pytest.mark.asyncio
async def test_unsafe_cover_config_refuses_to_move() -> None:
    coordinator, adapter, _store, profile, runtime = _build()
    profile.cover = CoverConfig(open_button=2, close_button=2)
    await coordinator._async_handle_physical_press(2, True)
    assert runtime.cover.moving is False
    assert all(state is False for _index, state in adapter.relay_calls)


@pytest.mark.asyncio
async def test_rapid_alternating_presses_never_energize_both() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(
        opposite_press=COVER_OPPOSITE_STOP_THEN_REVERSE,
        open_time=1.0,
        close_time=1.0,
        settle=0.0,
    )
    # The adapter fake raises if the engine ever overlaps the two directions.
    await asyncio.gather(
        *[
            coordinator._async_handle_physical_press(
                OPEN_BUTTON if index % 2 == 0 else CLOSE_BUTTON, True
            )
            for index in range(8)
        ]
    )
    await coordinator._async_cover_abort("test")
    _assert_all_cover_relays_off(adapter)


# ---------------------------------------------------------------------------
# Other buttons and other modes
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_non_cover_button_still_executes_its_action() -> None:
    coordinator, adapter, _store, profile, runtime = _build()
    profile.buttons[1].action = ButtonAction(action="light.toggle", target={"entity_id": "light.x"})
    await coordinator._async_handle_physical_press(2, True)
    runtime.hass.services.async_call.assert_awaited_once()
    assert adapter.relay_calls == []


@pytest.mark.asyncio
async def test_execute_button_service_drives_cover_button() -> None:
    coordinator, adapter, _store, _profile, runtime = _build(open_time=5.0)
    await coordinator.async_execute_button(OPEN_BUTTON)
    assert runtime.cover.direction == "open"
    runtime.hass.services.async_call.assert_not_awaited()
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_toggle_mode_is_unaffected_by_cover_config() -> None:
    coordinator, adapter, store, profile, runtime = _build()
    profile.mode = MODE_TOGGLE  # type: ignore[assignment]
    profile.buttons[0].action = ButtonAction(action="light.toggle", target={})
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    runtime.hass.services.async_call.assert_awaited_once()
    assert adapter.relay_calls == []
    assert runtime.cover.moving is False


@pytest.mark.asyncio
async def test_cover_command_rejects_non_cover_profile() -> None:
    coordinator, _adapter, _store, profile, _runtime = _build()
    profile.mode = MODE_TOGGLE  # type: ignore[assignment]
    with pytest.raises(ValueError, match="not in cover mode"):
        await coordinator.async_cover_command("open")


@pytest.mark.asyncio
async def test_update_profile_rejects_same_button_for_both_directions() -> None:
    coordinator, _adapter, _store, profile, _runtime = _build()
    payload = profile.to_dict()
    payload["covers"][0]["close_button"] = payload["covers"][0]["open_button"]
    with pytest.raises(ValueError, match="must be different"):
        await coordinator.async_update_profile(profile.id, payload)


def test_validate_cover_config_rejects_shared_button() -> None:
    with pytest.raises(ValueError, match="must be different"):
        validate_cover_config(CoverConfig(open_button=2, close_button=2))


def test_cover_config_clamps_out_of_range_values() -> None:
    cover = CoverConfig.from_dict(
        {
            "open_button": 9,
            "close_button": "2",
            "open_time_s": 9999,
            "close_time_s": -5,
            "direction_settle_s": 99,
            "opposite_press": "nonsense",
        }
    )
    assert cover.open_button == 1
    assert cover.close_button == 2
    assert cover.open_time_s == 600.0
    assert cover.close_time_s == 1.0
    assert cover.direction_settle_s == 5.0
    assert cover.opposite_press == COVER_OPPOSITE_STOP_ONLY


def test_cover_config_ha_entity_id_roundtrip() -> None:
    cover = CoverConfig.from_dict(
        {
            "open_button": 1,
            "close_button": 2,
            "ha_entity_id": "cover.living_shutter",
        }
    )
    assert cover.ha_entity_id == "cover.living_shutter"
    assert cover.to_dict()["ha_entity_id"] == "cover.living_shutter"
    # Alias entity_id is accepted on load.
    aliased = CoverConfig.from_dict(
        {"open_button": 1, "close_button": 2, "entity_id": "cover.kitchen"}
    )
    assert aliased.ha_entity_id == "cover.kitchen"
    # Non-cover domains are dropped.
    rejected = CoverConfig.from_dict(
        {"open_button": 1, "close_button": 2, "ha_entity_id": "light.not_a_cover"}
    )
    assert rejected.ha_entity_id is None
    assert "ha_entity_id" not in rejected.to_dict()


@pytest.mark.asyncio
async def test_cover_start_mirrors_ha_open_cover() -> None:
    coordinator, adapter, _store, profile, runtime = _build(open_time=5.0)
    profile.cover.ha_entity_id = "cover.living_shutter"
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    assert runtime.cover.direction == "open"
    assert adapter.relays[OPEN_BUTTON] is True
    runtime.hass.services.async_call.assert_awaited()
    call = runtime.hass.services.async_call.await_args
    assert call.args[0] == "cover"
    assert call.args[1] == "open_cover"
    assert call.kwargs.get("blocking") is False
    assert call.args[2] == {"entity_id": "cover.living_shutter"}
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_cover_halt_mirrors_ha_stop_cover() -> None:
    coordinator, _adapter, _store, profile, runtime = _build(open_time=5.0)
    profile.cover.ha_entity_id = "cover.living_shutter"
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    runtime.hass.services.async_call.reset_mock()
    await coordinator.async_cover_command("stop")
    runtime.hass.services.async_call.assert_awaited()
    call = runtime.hass.services.async_call.await_args
    assert call.args[0] == "cover"
    assert call.args[1] == "stop_cover"
    assert call.args[2] == {"entity_id": "cover.living_shutter"}


@pytest.mark.asyncio
async def test_cover_ha_mirror_failure_does_not_block_motor() -> None:
    coordinator, adapter, _store, profile, runtime = _build(open_time=5.0)
    profile.cover.ha_entity_id = "cover.living_shutter"
    runtime.hass.services.async_call = AsyncMock(side_effect=RuntimeError("HA down"))
    await coordinator._async_handle_physical_press(OPEN_BUTTON, True)
    assert runtime.cover.direction == "open"
    assert adapter.relays[OPEN_BUTTON] is True
    await coordinator._async_cover_abort("test")


def test_cover_state_payload_reports_idle_by_default() -> None:
    store = FakeStore()
    adapter = CoverAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = _cover_profile(store)
    payload = coordinator.cover_state_payload()
    assert payload["active"] is True
    assert payload["state"] == "idle"
    assert payload["direction"] is None
    assert payload["duration"] is None
    assert payload["cover_id"] == profile.cover.id
    assert len(payload["covers"]) == 1
    assert payload["covers"][0]["id"] == profile.cover.id
    assert payload["covers"][0]["state"] == "idle"


@pytest.mark.asyncio
async def test_two_covers_can_move_independently() -> None:
    coordinator, adapter, store, profile, runtime = _build(open_time=5.0)
    profile.covers = [
        CoverConfig(id="a", open_button=1, close_button=2, open_time_s=5.0, close_time_s=5.0),
        CoverConfig(id="b", open_button=3, close_button=4, open_time_s=5.0, close_time_s=5.0),
    ]
    adapter.cover_pairs = [cover.relay_indexes() for cover in profile.covers]
    await coordinator._async_handle_physical_press(1, True)
    await coordinator._async_handle_physical_press(3, True)
    assert runtime.cover.get("a").direction == "open"
    assert runtime.cover.get("b").direction == "open"
    assert adapter.relays[1] is True
    assert adapter.relays[3] is True
    assert adapter.relays[2] is False
    assert adapter.relays[4] is False
    await coordinator._async_cover_abort("test")
    assert runtime.cover.moving is False
    assert all(state is False for state in adapter.relays.values())


@pytest.mark.asyncio
async def test_cover_command_targets_cover_id() -> None:
    coordinator, adapter, store, profile, runtime = _build(open_time=5.0)
    profile.covers = [
        CoverConfig(id="a", open_button=1, close_button=2, open_time_s=5.0, close_time_s=5.0),
        CoverConfig(id="b", open_button=3, close_button=4, open_time_s=5.0, close_time_s=5.0),
    ]
    adapter.cover_pairs = [cover.relay_indexes() for cover in profile.covers]
    result = await coordinator.async_cover_command("open", cover_id="b")
    assert result["cover_id"] == "b"
    assert runtime.cover.get("b").direction == "open"
    assert runtime.cover.get("a").moving is False
    assert adapter.relays[3] is True
    await coordinator._async_cover_abort("test")


def test_validate_covers_rejects_overlap_and_too_many() -> None:
    from custom_components.conx_dynamic_panel.models import validate_covers

    with pytest.raises(ValueError, match="used by both"):
        validate_covers(
            [
                CoverConfig(id="a", open_button=1, close_button=2),
                CoverConfig(id="b", open_button=2, close_button=3),
            ],
            gang_count=4,
        )
    with pytest.raises(ValueError, match="At most 1"):
        validate_covers(
            [
                CoverConfig(id="a", open_button=1, close_button=2),
                CoverConfig(id="b", open_button=3, close_button=4),
            ],
            gang_count=3,
        )


def _mixed_cover_profile(store: FakeStore) -> Profile:
    profile = store.data.active_profile()
    assert profile is not None
    profile.mode = MODE_MIXED  # type: ignore[assignment]
    for button in profile.buttons:
        button.role = "toggle"  # type: ignore[assignment]
        button.cover_id = None
    profile.buttons[0].role = "cover_open"  # type: ignore[assignment]
    profile.buttons[0].cover_id = "cover_1"
    profile.buttons[2].role = "cover_close"  # type: ignore[assignment]
    profile.buttons[2].cover_id = "cover_1"
    # Stale template would wrongly point close at L2 (a toggle) if not synced.
    profile.covers = [
        CoverConfig(
            id="cover_1",
            open_button=1,
            close_button=2,
            open_time_s=5.0,
            close_time_s=5.0,
        )
    ]
    profile.sync_covers_from_roles()
    return profile


@pytest.mark.asyncio
async def test_mixed_cover_command_and_role_sync() -> None:
    store = FakeStore()
    adapter = CoverAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = _mixed_cover_profile(store)
    assert profile.cover.open_button == 1
    assert profile.cover.close_button == 3  # synced from roles, not stale L2
    adapter.cover_pairs = [profile.cover.relay_indexes()]

    await coordinator.async_cover_command("open", cover_id="cover_1")
    assert adapter.relay_calls == [(3, False), (1, True)]
    assert runtime.cover.get("cover_1").direction == "open"
    await coordinator._async_cover_abort("test")


@pytest.mark.asyncio
async def test_mixed_physical_press_does_not_force_off_toggle_button() -> None:
    store = FakeStore()
    adapter = CoverAdapter()
    runtime = _runtime(adapter, store)
    coordinator = PanelCoordinator(runtime)  # type: ignore[arg-type]
    profile = _mixed_cover_profile(store)
    adapter.cover_pairs = [profile.cover.relay_indexes()]
    # L2 is an independent toggle left ON — cover start must not touch it.
    adapter.relays[2] = True
    adapter.relays[1] = True
    adapter.relay_calls.clear()
    await coordinator._async_handle_physical_press(1, True)
    assert (2, False) not in adapter.relay_calls
    assert adapter.relays[2] is True
    assert adapter.relay_calls == [(3, False)]
    await coordinator._async_cover_abort("test")
    # Abort only active cover relays (1 and 3), not toggle L2.
    assert adapter.relays[2] is True
