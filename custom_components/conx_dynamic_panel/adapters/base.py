"""Abstract panel adapter contract."""

from __future__ import annotations

from abc import ABC, abstractmethod

from ..models import HardwareState, Profile, SyncResult


class PanelAdapter(ABC):
    """Device-specific read/write boundary."""

    @abstractmethod
    async def async_validate_mapping(self) -> None:
        """Validate mapped entities exist and are usable."""

    @abstractmethod
    async def async_read_hardware_state(self) -> HardwareState:
        """Read current physical panel state."""

    @abstractmethod
    async def async_apply_profile(self, profile: Profile) -> SyncResult:
        """Apply a profile to hardware sequentially with confirmation."""

    @abstractmethod
    async def async_set_relay(
        self, index: int, state: bool, *, suppress_event: bool = True
    ) -> None:
        """Set one relay state."""

    @abstractmethod
    async def async_set_names(self, names: tuple[str, str, str, str]) -> None:
        """Set button name labels."""

    @abstractmethod
    async def async_set_colors(self, color_on: str, color_off: str) -> None:
        """Set ON/OFF colors."""

    @abstractmethod
    async def async_set_radar(self, value: str) -> None:
        """Set radar timeout option."""

    @abstractmethod
    async def async_set_backlight(self, enabled: bool) -> None:
        """Set backlight switch."""

    @abstractmethod
    async def async_set_child_lock(self, enabled: bool) -> None:
        """Set child lock switch."""

    @abstractmethod
    def supported_colors(self) -> list[str]:
        """Return supported color options."""

    @abstractmethod
    def supported_radar(self) -> list[str]:
        """Return supported radar options."""
