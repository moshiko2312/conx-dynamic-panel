"""Import services must be admin-only; every other service stays open."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from custom_components.conx_dynamic_panel.const import (
    SERVICE_IMPORT_PROFILES,
    SERVICE_IMPORT_SCHEDULER,
)
from custom_components.conx_dynamic_panel.services import async_register_services


class FakeServices:
    def __init__(self) -> None:
        self.registered: dict[str, dict[str, Any]] = {}

    def has_service(self, domain: str, service: str) -> bool:
        return service in self.registered

    def async_register(self, domain: str, service: str, func: Any, **kwargs: Any) -> None:
        self.registered[service] = kwargs


async def test_import_services_are_registered_as_admin_only() -> None:
    hass = SimpleNamespace(services=FakeServices(), admin_services=set(), data={})

    await async_register_services(hass)  # type: ignore[arg-type]

    assert hass.admin_services == {SERVICE_IMPORT_PROFILES, SERVICE_IMPORT_SCHEDULER}
    # Admin registration must keep the optional import summary response.
    assert hass.services.registered[SERVICE_IMPORT_PROFILES]["supports_response"] == "optional"
    assert hass.services.registered[SERVICE_IMPORT_SCHEDULER]["supports_response"] == "optional"
    assert len(hass.services.registered) > len(hass.admin_services)
