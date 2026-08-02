# Changelog

All notable changes to this private project will be documented here.

## [Unreleased]

### Added

- Hamburger menu entry **Automation example** opening a large centered modal with a copy-ready Home Assistant automation that switches profiles by time of day. Every branch calls `conx_dynamic_panel.activate_profile` with `sync: true`, and the card pre-fills the panel's own `entry_id` and profile ids (card + HTML preview, HE/EN/RU).
- `examples/automations.yaml`: `conx_profile_by_time_of_day` automation matching the in-card example.
- ConX brand icon and logo in `custom_components/conx_dynamic_panel/brand/` (`icon.png` 256x256, `icon@2x.png` 512x512, `logo.png` 664x256, `logo@2x.png` 1329x512). Home Assistant 2026.3+ serves these through `/api/brands/integration/conx_dynamic_panel/...` and prefers them over the public brands CDN, so the integrations UI shows ConX branding without a `home-assistant/brands` submission. Installed automatically by `scripts/install_local.sh` / `scripts/update_local.sh`.
- `brands/master/` master artwork plus a `brands/custom_integrations/conx_dynamic_panel/` mirror in public brands-repo layout, kept for marketing use and a possible future submission.
- `scripts/build_brand_images.py` regenerates every brand image at the sizes Home Assistant requires, so the assets cannot drift from spec through manual resizing.

### Changed

- Radio groups editor assigns buttons with tappable L1–L4 chips instead of a switch under every button. Chips in the Independent toggle row detach a button from all groups (card + HTML preview).
- Radio groups collapse is now a single master switch in the section header that hides or shows all three rows at once; the per-category switches on Group 1 / Group 2 / Independent toggle are gone. Collapsed state shows a one-line assignment recap (`Group 1: L1, L4 · Group 2: L2, L3 · Independent toggle: —`) and is persisted (card `localStorage`, preview state).

### Fixed

- `pytest` no longer collects iCloud Drive `"<name> 2.py"` conflict copies, which are gitignored but were left behind next to the real test modules and failed against current behavior.
- `pyproject.toml` and `frontend-src/package-lock.json` now report `0.1.1`, matching `manifest.json` and `package.json`.

### Documentation

- `README.md`: brand icon table with install behaviour per Home Assistant version, corrected radio-groups card UX description, refreshed repository tree, and troubleshooting rows for the generic integration icon and for automations that omit `sync: true`.
- `docs/PRIVATE_DEPLOYMENT.md`: step-by-step install walkthrough (build → copy component → restart → add integration → map entities → card resource → card → hard refresh), a brand-icons section, an explicit draft-versus-sync explanation, guidance for switching profiles from automations, and an installer-facing card overview.
- `AI_BUILD_SPEC.md`: brand-image requirements, including that the local `brand/` directory is the shipping path and that no `home-assistant/brands` pull request is to be opened.
- Documented honestly that Home Assistant older than 2026.3 has no supported local brand override and will keep showing the generic integration icon.

## [0.1.1] - 2026-08-03

### Added

- Profile mode `radio_split` with editable `radio_groups` on the Buttons tab; exclusivity is per-group classic radio, ungrouped buttons stay independent toggles.
- Collapsible radio-group category headers (Group 1 / Group 2 / Independent toggle) with app-style switches; collapsed rows show a compact summary (e.g. `L1, L4`). Preview persists open state in `localStorage` (`conx-card-preview-state-v8`).
- Lovelace card UX aligned with the HTML preview: hamburger settings modal (language / theme / import-export), hero faceplate with centered profile name, three tabs (Profiles / Appearance / Buttons), editable panel name via WebSocket `update_panel_name`.
- Centered modal chrome for settings and export/import (card + HTML previews).
- On-card language selectors for Hebrew, English, and Russian (RTL for Hebrew); preference persisted in `localStorage`, with optional card `language` config.
- Zemismart-accurate horizontal faceplate preview: labels on top, four LED rings left→right; rings follow draft `color_on` / `color_off`.
- Standalone wizard at `previews/conx-panel-wizard.html` with HA-compatible JSON and a link back to the card preview.
- Profile import/export via WebSocket (`export_profiles`, `import_profiles` merge/replace), green Export CTA, and file picker UI.
- Shared frontend export schema validator matching backend `STORAGE_VERSION`.
- Backlight brightness (`0–100`) in profiles + large dimmer UI; optional `number` backlight brightness entity in Config Flow / Zemismart adapter.
- Per-button `radio_member` for mixed radio/toggle participation in `radio_optional` / `radio_mandatory`.
- Theme system with **Noir gray** (3D charcoal/slate gradient) and **Ivory cool** (near-white stone); legacy theme ids map automatically.
- Reference photo at `frontend-src/assets/zemismart-4gang-faceplate.png` for topography (preview itself is a CSS recreation for HA reliability).

### Changed

- Radio modes are classic radio only: exactly one ON in `radio_mandatory`, `radio_optional`, and each `radio_split` group; re-pressing the selected member does not turn it off.
- Profiles tab: 3-column profile chips, 2-column panel/profile name fields, Create / Duplicate / Delete only (no rename button / no pinned-drag layout).
- Radio groups editor is shown only under Buttons; Appearance keeps Mode + colors + radar + backlight.
- Card text inputs mutate draft state in place so continuous typing keeps focus.
- Import accepts profiles as an object or array, validates `schema_version`, and rejects future schema versions.

## [0.1.0] - 2026-08-02

### Added

- Home Assistant custom integration `conx_dynamic_panel` with Config Flow, Reconfigure Flow, and Options Flow.
- Zemismart 4-gang adapter using Home Assistant `switch`, `text`, and `select` entities.
- Versioned profile storage with draft vs applied snapshot model.
- Toggle, radio mandatory, and radio optional profile engine.
- Transition suppression for integration-generated relay changes.
- Sync state machine with confirmation waits, overall sync timeout, and failed-sync snapshot preservation.
- Out-of-sync detection when a hardware pull differs from the applied snapshot.
- Integration entities: active profile select, sync status/last sync/last error sensors, sync/pull buttons, auto-sync switch.
- Services: sync, activate_profile, pull_from_panel, execute_button, reload.
- Authenticated WebSocket CRUD API for the custom card.
- Bundled Lit/TypeScript Lovelace card with English and Hebrew RTL UI.
- Private install/update/build scripts without HACS.
- Backend and frontend automated tests plus private CI workflow.
- Best-effort automatic Lovelace resource registration; manual resource step remains documented.
- Options wiring for confirmation timeout, sync timeout, auto-sync, and log level.
- Installation and troubleshooting documentation for private deployment.

### Fixed

- Reconfigure flow now updates the existing config entry instead of creating a new one.
- Summary step requires explicit confirmation after successful mapping validation.
- Mapping validation rejects unavailable/disabled text entities and select entities without options.
- Storage load failures preserve on-disk data and surface an in-memory error message.
- Pull-from-panel correctly sets `out_of_sync` when hardware differs from the applied snapshot.

### Changed

- Manifest `iot_class` set to `local_push` to reflect entity state listeners rather than a poll loop.

### Excluded by design

- HACS support.
- Public marketplace distribution.
- Open-source licensing.
- Direct MQTT implementation in the MVP.
