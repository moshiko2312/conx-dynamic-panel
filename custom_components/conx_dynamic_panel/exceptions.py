"""Integration-specific exceptions."""

from __future__ import annotations


class ConXDynamicPanelError(Exception):
    """Base exception for ConX Dynamic Panel."""


class MappingValidationError(ConXDynamicPanelError):
    """Raised when entity mapping validation fails."""


class HardwareWriteError(ConXDynamicPanelError):
    """Raised when a hardware write or confirmation fails."""


class SyncInProgressError(ConXDynamicPanelError):
    """Raised when a sync is already running."""


class ProfileNotFoundError(ConXDynamicPanelError):
    """Raised when a profile ID does not exist."""


class ScheduleConflictError(ConXDynamicPanelError):
    """Raised when scheduler tasks have overlapping different profiles."""

    def __init__(self, message: str, conflicts: list[dict] | None = None) -> None:
        super().__init__(message)
        self.conflicts = conflicts or []


class ActionExecutionError(ConXDynamicPanelError):
    """Raised when a stored action cannot be executed."""
