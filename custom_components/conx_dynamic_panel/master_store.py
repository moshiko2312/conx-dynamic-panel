"""Domain-wide master scheduler store (multi-panel tasks)."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import (
    DOMAIN,
    MASTER_STORAGE_KEY,
    MASTER_STORAGE_VERSION,
    SCHEDULER_SCOPE_MASTER,
)
from .models import SchedulerTask

_LOGGER = logging.getLogger(__name__)


class _MasterSchedulerHAStore(Store):
    """HA Store with major-version hook for future master-scheduler schema bumps."""

    async def _async_migrate_func(
        self,
        old_major_version: int,
        old_minor_version: int,
        old_data: dict[str, Any] | None,
    ) -> dict[str, Any]:
        _LOGGER.info(
            "Migrating %s master scheduler store from v%s.%s to v%s",
            DOMAIN,
            old_major_version,
            old_minor_version,
            MASTER_STORAGE_VERSION,
        )
        return dict(old_data) if isinstance(old_data, dict) else {}


class MasterSchedulerStore:
    """Versioned domain-level master scheduler tasks."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass
        self._store = _MasterSchedulerHAStore(
            hass,
            MASTER_STORAGE_VERSION,
            MASTER_STORAGE_KEY,
            private=True,
        )
        self.tasks: dict[str, SchedulerTask] = {}

    async def async_load(self) -> dict[str, SchedulerTask]:
        """Load master tasks from disk."""
        raw = await self._store.async_load()
        tasks: dict[str, SchedulerTask] = {}
        if isinstance(raw, dict):
            raw_tasks = raw.get("scheduler_tasks") or {}
            if isinstance(raw_tasks, dict):
                for key, value in raw_tasks.items():
                    if not isinstance(value, dict):
                        continue
                    payload = dict(value)
                    payload.setdefault("id", key)
                    payload["scope"] = SCHEDULER_SCOPE_MASTER
                    try:
                        task = SchedulerTask.from_dict(payload)
                    except ValueError:
                        _LOGGER.warning("Skipping invalid master scheduler task %s", key)
                        continue
                    tasks[task.id] = task
        self.tasks = tasks
        return self.tasks

    async def async_save(self) -> None:
        """Persist master tasks."""
        await self._store.async_save(
            {
                "scheduler_tasks": {
                    key: task.to_dict() for key, task in self.tasks.items()
                }
            }
        )

    async def async_upsert(self, task: SchedulerTask) -> SchedulerTask:
        """Create or replace a master task."""
        if task.scope != SCHEDULER_SCOPE_MASTER:
            raise ValueError("Master store only accepts scope=master tasks")
        self.tasks[task.id] = task
        await self.async_save()
        return task

    async def async_delete(self, task_id: str) -> None:
        """Delete a master task."""
        if task_id not in self.tasks:
            raise ValueError(f"Unknown master scheduler task: {task_id}")
        del self.tasks[task_id]
        await self.async_save()

    def tasks_for_entry(self, entry_id: str) -> list[SchedulerTask]:
        """Return master tasks that target ``entry_id``."""
        return [task for task in self.tasks.values() if entry_id in task.entry_ids]


async def async_get_master_store(hass: HomeAssistant) -> MasterSchedulerStore:
    """Return the shared master scheduler store, loading it once per hass lifetime."""
    data = getattr(hass, "data", None)
    if not isinstance(data, dict):
        data = {}
        hass.data = data
    domain = data.setdefault(DOMAIN, {})
    store = domain.get("master_store")
    if isinstance(store, MasterSchedulerStore):
        return store
    store = MasterSchedulerStore(hass)
    await store.async_load()
    domain["master_store"] = store
    return store


def master_tasks_payload(hass: HomeAssistant) -> dict[str, Any]:
    """Frontend snippet for master tasks (empty until store is loaded)."""
    data = getattr(hass, "data", None)
    if not isinstance(data, dict):
        return {"master_scheduler_tasks": {}}
    domain = data.get(DOMAIN) or {}
    store = domain.get("master_store")
    if not isinstance(store, MasterSchedulerStore):
        return {"master_scheduler_tasks": {}}
    return {
        "master_scheduler_tasks": {
            key: task.to_dict() for key, task in store.tasks.items()
        }
    }


def list_panel_summaries(hass: HomeAssistant) -> list[dict[str, str]]:
    """Return ``[{entry_id, panel_name}, ...]`` for configured panels."""
    data = getattr(hass, "data", None)
    if not isinstance(data, dict):
        return []
    domain = data.get(DOMAIN) or {}
    panels: list[dict[str, str]] = []
    for key, entry_data in domain.items():
        if not isinstance(entry_data, dict):
            continue
        coordinator = entry_data.get("coordinator")
        if coordinator is None:
            continue
        try:
            panels.append(
                {
                    "entry_id": str(coordinator.runtime.entry.entry_id),
                    "panel_name": str(coordinator.runtime.mapping.panel_name),
                }
            )
        except Exception:  # noqa: BLE001
            panels.append({"entry_id": str(key), "panel_name": str(key)})
    panels.sort(key=lambda item: (item["panel_name"].lower(), item["entry_id"]))
    return panels
