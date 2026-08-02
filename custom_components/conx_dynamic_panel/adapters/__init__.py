"""Hardware adapters for supported panels."""

from __future__ import annotations

from homeassistant.core import HomeAssistant

from ..const import ADAPTER_ZEMISMART_4GANG
from ..models import EntityMapping
from ..suppression import SuppressionTracker
from .base import PanelAdapter
from .zemismart import Zemismart4GangAdapter

__all__ = ["PanelAdapter", "Zemismart4GangAdapter", "create_adapter"]


def create_adapter(
    hass: HomeAssistant,
    mapping: EntityMapping,
    suppression: SuppressionTracker,
    *,
    confirm_timeout: float,
) -> PanelAdapter:
    """Create an adapter for the configured panel type."""
    if mapping.adapter_type == ADAPTER_ZEMISMART_4GANG:
        return Zemismart4GangAdapter(
            hass,
            mapping,
            suppression,
            confirm_timeout=confirm_timeout,
        )
    raise ValueError(f"Unsupported adapter type: {mapping.adapter_type}")
