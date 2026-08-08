# Master Prompt — Build ConX Dynamic Panel

You are working inside the private GitHub repository `moshiko2312/conx-dynamic-panel`.

Build the complete project described in `README.md` and `AI_BUILD_SPEC.md`. Treat `AI_BUILD_SPEC.md` as the authoritative engineering contract.

## Project ownership and distribution

- This is private commercial software owned by ConX.
- Do not add HACS support.
- Do not add `hacs.json`, HACS validation workflows, marketplace metadata, public-release instructions, or open-source licensing.
- Do not publish, mirror, or upload code outside this repository.
- Use `LICENSE-PRIVATE.md` as the licensing authority.

## Operating instructions

- Work autonomously from start to finish.
- Do not ask routine implementation questions.
- Read `README.md`, `AI_BUILD_SPEC.md`, `AGENTS.md`, and `.cursor/rules/conx-dynamic-panel.mdc` before changing code.
- Use current public Home Assistant APIs.
- Never hard-code the example entity IDs into production runtime code.
- Keep device-specific behavior inside the adapter layer.
- Implement both the backend integration and bundled Lovelace card in this repository.
- Preserve a clean, commit-ready structure.
- Add tests while implementing features.
- Run all available checks and fix failures.
- Do not leave TODO-only stubs for MVP requirements.
- Do not use private Home Assistant APIs when a public alternative exists.
- Do not add direct MQTT logic to the MVP.
- Never execute arbitrary Python or untrusted templates stored in profiles.
- Never delete or overwrite Home Assistant user storage during an update.

## Development sequence

1. Inspect the repository and write a concise implementation plan.
2. Create the backend package and typed runtime/storage models.
3. Implement Config Flow, Reconfigure Flow, Options Flow, and validation.
4. Implement the adapter interface and Zemismart adapter.
5. Implement transition suppression and button-mode engine.
6. Implement profile storage, sync state machine, and hardware confirmation.
7. Implement entities, services, events, and WebSocket CRUD commands.
8. Implement the TypeScript/Lit card and editor.
9. Add English and Hebrew translations.
10. Add local build/install/update scripts.
11. Add tests and private CI workflows.
12. Run lint, type checks, tests, frontend build, and relevant Home Assistant validation.
13. Update README and CHANGELOG with the actual completed behavior.

## Decision policy

Make reasonable conventional decisions without asking. Stop only when a decision requires a secret, credential, physical device observation, or owner-only business value. In those cases, use a safe placeholder, document the exact unresolved value, and continue with all other work.

## Required completion report

At completion provide:

1. Architecture summary.
2. Full list of created and modified files.
3. Setup, build, installation, and update commands.
4. Test and validation results.
5. Remaining limitations genuinely outside the MVP or blocked by the environment.
6. Exact steps for the first physical-panel test.

Begin now by reading all project instruction files and inspecting the repository. Then execute the implementation plan without requesting confirmation.
