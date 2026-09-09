# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`conx-dynamic-panel` — private commercial Home Assistant custom integration plus a bundled Lovelace card, for managing multi-profile smart wall panels (MVP device: Zemismart 4-gang via Zigbee2MQTT). The panel's relays are **not wired to loads**; they are physical inputs and LED indicators. Pressing a button runs a configured Home Assistant action.

Read before implementing: `MOSHIKO_BUILD_SPEC.md` (authoritative engineering contract), `docs/ARCHITECTURE.md`, `AGENTS.md`, `.cursor/rules/conx-dynamic-panel.mdc`. `README.md` documents observable behavior; `docs/SETUP_GUIDE.md` is the installer walkthrough.

## Hard constraints

These are enforced by `AGENTS.md` and the Cursor rules; violating them is a build failure, not a style issue.

- **No HACS.** No `hacs.json`, marketplace metadata, HACS workflows, public-release wording, or open-source license. `LICENSE-PRIVATE.md` is the licensing authority.
- **No direct MQTT** in the MVP — only Home Assistant entities and public HA APIs.
- **No arbitrary code or templates.** Profiles store structured conditions/actions only (see `CONDITION_OPS` in `const.py`); never eval stored payloads.
- **No hard-coded customer entity IDs** in runtime code.
- **Fully async backend.** Device-specific behavior stays in `adapters/`.
- **Storage is sacred.** Upgrades must preserve profiles, applied snapshots, and HA `.storage`; migrations are explicit.
- **i18n:** every user-facing string exists in EN + HE (RTL) — card also has RU (`frontend-src/src/localize.ts`, `translations/*.json`).

## Commands

Backend (Python 3.12+, run from repo root):

```bash
ruff check custom_components tests          # lint (line-length 100, py312 target)
mypy custom_components/conx_dynamic_panel   # types — backend package only, not tests
pytest                                      # full suite
pytest tests/test_cover_engine.py -q        # one file
pytest tests/test_scheduler.py::test_name   # one test
```

Frontend (`frontend-src/`, Node 20):

```bash
npm install
npm run lint            # tsc --noEmit
npm test                # vitest run (jsdom)
npm test -- tests/card.test.ts   # one file
npm run build           # tsc --noEmit && vite build → dist/
npm run dev             # vite dev server
```

Scripts (bash; the dev machine is macOS — this repo lives on an iCloud Drive share):

```bash
./scripts/build_frontend.sh                       # install → lint → test → build → copy bundle into custom_components/
./scripts/install_local.sh  /path/to/ha/config    # fresh install
./scripts/update_local.sh   /path/to/ha/config    # update with timestamped backup; never touches .storage
```

CI (`.github/workflows/ci.yml`) runs exactly: ruff, mypy, pytest / npm lint, test, build. Before declaring work complete, run all of them and update `CHANGELOG.md`.

## Architecture

```
Zigbee2MQTT entities  →  adapters/  →  coordinator (+ suppression, engines)  →  storage / entities / services / WS API  →  Lit card
```

**Layer contracts** (each file owns exactly one job — do not blur these):

| File | Owns |
|---|---|
| `config_flow.py` | Installer mapping UX only |
| `mapping_discovery.py` | Auto-map Z2M entities from a device prefix |
| `adapters/base.py` + `zemismart.py` | *All* device reads/writes/confirmation waits |
| `models.py` | Dataclasses + normalization/validation/clamping for every stored shape |
| `storage.py`, `master_store.py`, `holiday_store.py` | Versioned persistence and migrations |
| `runtime.py` | Typed per-entry state: adapter, locks, suppression, listeners, unload callbacks |
| `coordinator.py` | Orchestration hub (~3.2k lines): listeners, press routing, all button-mode engines, sync state machine, scheduler tick, import/export |
| `suppression.py` | FIFO per-entity tracker of integration-generated relay transitions |
| `entity_relay.py`, `multiclick.py`, `scheduler.py`, `option_match.py` | Pure-ish engines called by the coordinator |
| `websocket_api.py` | Schema validation + delegation to the coordinator, nothing else |
| `select.py` `sensor.py` `button.py` `switch.py` | Thin HA entity wrappers over `ConXPanelEntity` |

**State ownership** — the single most important model to keep straight:

- Hardware entities own current physical values.
- **Draft** (stored profile) owns the user's intended configuration. Editing only marks `pending`; it must not write hardware unless auto-sync is on.
- **Applied snapshot** owns the last *completely successful* sync. A partial sync never replaces it. On HA startup the coordinator re-applies the applied snapshot to hardware (waiting up to `STARTUP_ENTITY_READY_TIMEOUT_S` for linked entities to leave `unknown`/`unavailable` first).
- The card owns only unsaved form edits, and **never calls mapped hardware entities directly** — everything goes through the WS API (`conx_dynamic_panel/*`) in `frontend-src/src/api.ts`.

**Feedback-loop protection:** every integration-generated relay write must register an expected transition in `SuppressionTracker` *before* the service call. The physical-press handler consumes and ignores matching transitions. Never rely on delays alone. Related invariant: a relay transition *from* `unknown`/`unavailable` is an entity waking up, never a press — it must not reach the press engine.

**Button modes** (`SUPPORTED_MODES` in `const.py`): `toggle`, `radio_mandatory`, `radio_optional`, `radio_split` (multiple groups), `mixed` (per-button `role`: toggle / momentary pulse / radio / cover_open / cover_close), `cover`. Cover is a timed motor engine living entirely in the backend — the two directions are never energized together, and any failure, profile change, unload, or timeout forces both relays OFF.

**Frontend:** Lit 3 + Vite library build. `src/main.ts` registers the custom card; `src/card.ts` (~8.9k lines) is the whole UI; `src/editor.ts` is the Lovelace config editor. The built bundle is **committed** at `custom_components/conx_dynamic_panel/frontend/conx-dynamic-panel-card.js` and served at `/conx_dynamic_panel/frontend/...`, so a card change only ships once you rebuild and commit that artifact.

## Gotchas

- **Tests run without Home Assistant installed.** `tests/conftest.py` calls `ha_stubs.install()`, which injects fake `homeassistant.*` modules into `sys.modules`. If you import a new HA symbol in backend code, add it to `tests/ha_stubs.py` or the whole suite fails at import time.
- **iCloud conflict copies.** The repo syncs through iCloud Drive, which leaves `<name> 2.py` duplicates. They are gitignored, ignored by pytest (`addopts = ["--ignore-glob=* 2.py"]`), and rsync-excluded by the install scripts. Never edit or ship one.
- **Version bumps:** `manifest.json` `version` + a `CHANGELOG.md` entry are the source of truth (currently `0.3.13`). `pyproject.toml` and `frontend-src/package.json` versions are stale and not used by HA.
- **Storage major-version bumps need a migration hook.** Each `Store` subclass must implement `_async_migrate_func`; HA raises `NotImplementedError` without it (see `holiday_store.py`). Current versions: panel `5`, holiday `2`, master scheduler `1`.
- **Zigbee select quirk:** `warm_white` / `warm_yellow` hang the panel — `option_match.py` remaps them to `white` / `yellow`. Never offer or write the broken values.
- Release commits follow `Release <version>: <one-sentence what changed>.`
