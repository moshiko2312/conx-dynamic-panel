# Changelog

All notable changes to this private project will be documented here.

## [0.1.0] - 2026-08-02

### Added

- Home Assistant custom integration `conx_dynamic_panel` with Config Flow, Reconfigure Flow, and Options Flow.
- Zemismart 4-gang adapter using Home Assistant `switch`, `text`, and `select` entities.
- Versioned profile storage with draft vs applied snapshot model.
- Toggle, radio mandatory, and radio optional profile engine.
- Transition suppression for integration-generated relay changes.
- Sync state machine with confirmation waits and failed-sync snapshot preservation.
- Integration entities: active profile select, sync status/last sync/last error sensors, sync/pull buttons, auto-sync switch.
- Services: sync, activate_profile, pull_from_panel, execute_button, reload.
- Authenticated WebSocket CRUD API for the custom card.
- Bundled Lit/TypeScript Lovelace card with English and Hebrew RTL UI.
- Private install/update/build scripts without HACS.
- Backend and frontend automated tests plus private CI workflow.

### Excluded by design

- HACS support.
- Public marketplace distribution.
- Open-source licensing.
- Direct MQTT implementation in the MVP.

## [Unreleased]

### Added

- Initial private product specification.
- Home Assistant integration architecture.
- Bundled Lovelace custom-card architecture.
- Zemismart 4-gang entity mapping specification.
- Toggle, radio mandatory, and radio optional behavior.
- Draft, applied snapshot, and manual Sync model.
- Transition-suppression requirements.
- Cursor and Codex autonomous build instructions.
- Private commercial license and repository rules.
