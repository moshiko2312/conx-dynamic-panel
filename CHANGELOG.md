# Changelog

All notable changes to this private project will be documented here.

## [Unreleased]

### Added

- Premium Lovelace card redesign with industrial glass/steel depth, collapsible settings sections, and intentional motion (section expand, sync pulse, ring press).
- On-card language flag selectors for Hebrew, English, and Russian (RTL for Hebrew); preference persisted in `localStorage`, with optional card `language` config.
- Zemismart-accurate horizontal faceplate preview: black label bar on top, white glass face, four LED rings left→right; CSS skin extension point `--conx-faceplate-skin`.
- Step-by-step setup wizard in the Lovelace card: Language → Profile → Edit → Faceplate preview → Review/Sync → Export/Import.
- Standalone wizard at `previews/conx-panel-wizard.html` with the same portable JSON schema, HE/EN/RU, live LED preview, file export/import, and ready-to-paste `conx_dynamic_panel.import_profiles` YAML.
- Profile import/export via WebSocket (`export_profiles`, `import_profiles` with merge/replace), HA services `export_profiles` / `import_profiles`, and card file download/upload UI.
- Shared frontend export schema validator (`frontend-src/src/exportSchema.ts`) matching backend `STORAGE_VERSION`.
- Reference photo at `frontend-src/assets/zemismart-4gang-faceplate.png` for topography (preview itself is a CSS recreation for HA reliability).

### Changed

- Card text inputs mutate draft state in place so continuous typing keeps focus.
- Button preview layout is a single horizontal row matching physical L1–L4 order (no 2×2 grid).
- Faceplate LED rings now follow draft `color_on` / `color_off` (live while editing): radio uses on-color for the selected button and off-color for the rest; toggle uses mapped entity state when available, otherwise a mixed on/off sample so both LED colors stay visible.
- Buttons section uses compact collapsible rows (number + label summary); editors expand on demand.
- Toggle switches redesigned with balanced track/thumb proportions and physical LTR thumb travel (fixes RTL misalignment).
- HTML previews (`conx-card-preview.html`, `conx-panel-wizard.html`) persist editable state in `localStorage` across refresh, with a Reset control.
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
