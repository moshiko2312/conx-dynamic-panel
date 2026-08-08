# AGENTS.md

## Scope

These instructions apply to the entire repository.

## Product

`conx-dynamic-panel` is private commercial software for ConX. It is a Home Assistant custom integration with a bundled Lovelace card for managing dynamic profiles on supported smart panels.

## Mandatory rules

- Read `README.md` and `MOSHIKO_BUILD_SPEC.md` before implementation.
- Do not add HACS support or public marketplace files.
- Do not replace `LICENSE-PRIVATE.md` with an open-source license.
- Do not hard-code customer entity IDs.
- Do not add direct MQTT behavior to the MVP.
- Use only current public Home Assistant APIs.
- Keep hardware-specific behavior in adapters.
- Preserve user profiles and storage across updates.
- Use asynchronous I/O throughout the backend.
- Add tests for every behavior change.
- Support English and Hebrew RTL.
- Never execute arbitrary stored code or untrusted templates.

## Architecture boundaries

- `config_flow.py`: mapping and installer UX only.
- `storage.py`: versioned persistence and migrations.
- `runtime.py`: typed per-entry runtime state.
- `coordinator.py`: orchestration, listeners, sync state, and profile engine.
- `adapters/`: all device-specific reads and writes.
- entity platform files: thin Home Assistant entity wrappers.
- WebSocket handlers: validation and delegation only.
- frontend: communicates with backend APIs; it must not call mapped device entities directly.

## Quality gates

Before declaring work complete:

- Run Python formatting, lint, type checks, and tests.
- Run frontend lint, type checks, tests, and production build.
- Confirm no HACS-specific file or wording was introduced.
- Confirm manual installation instructions are accurate.
- Update `CHANGELOG.md`.
- Report any hardware-dependent behavior that could not be verified.
