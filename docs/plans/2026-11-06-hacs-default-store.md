# Plan: publish ConX Dynamic Panel in the HACS default store

Date: 2026-11-06
Decision (owner): relicense under **Apache-2.0** (keeps attribution via `NOTICE`), target the **HACS default store**.

## Current state (verified 2026-11-06)

| Requirement | Status |
|---|---|
| Public GitHub repo | Done (`moshiko2312/conx-dynamic-panel` is PUBLIC) |
| Single integration under `custom_components/<domain>/` | Done |
| `manifest.json` has domain, name, version, documentation, issue_tracker, codeowners | Done |
| Brand icon | Done (`custom_components/conx_dynamic_panel/brand/icon.png`, `logo.png`, `@2x`) |
| Issues enabled | Done |
| At least one GitHub release | Done (`v0.3.14`) |
| OSI-approved license detectable by GitHub | **Missing** (only `LICENSE-PRIVATE.md`) |
| `hacs.json` | **Missing** |
| Repo description | **Missing** (empty) |
| Repo topics | **Missing** |
| HACS Action + hassfest passing in CI | **Missing** |
| Project rules allow HACS | **No**: `AGENTS.md:14-15,43`, `.cursor/rules/conx-dynamic-panel.mdc:8-9`, `CLAUDE.md` hard constraints forbid it |

Owner confirmed (2026-11-06): not sold commercially; published free for the community. All "private commercial" wording is outdated and gets replaced.

## Steps

1. **License.** Add `LICENSE` (verbatim Apache-2.0 text) and `NOTICE` ("ConX Dynamic Panel, Copyright 2025-2026 Moshiko ..."). Delete `LICENSE-PRIVATE.md`. Set `license = "Apache-2.0"` in `pyproject.toml` and `frontend-src/package.json`.
   → verify: `gh api repos/moshiko2312/conx-dynamic-panel/license --jq .license.spdx_id` prints `Apache-2.0` after push.

2. **Project rules.** Rewrite the hard constraints in `AGENTS.md`, `.cursor/rules/conx-dynamic-panel.mdc`, `CLAUDE.md`: drop "no HACS / no open-source license", keep the remaining constraints (no direct MQTT, no templates, storage is sacred, i18n...). Add "keep `hacs.json` and the HACS/hassfest workflow green".
   → verify: grep for `HACS`, `LICENSE-PRIVATE`, `private commercial` returns only CHANGELOG history and the new allowed wording.

3. **Docs wording.** Update `README.md` (add a HACS install section plus a "My Home Assistant" add-repository badge, and keep manual install via scripts), `docs/SETUP_GUIDE.md`, `MOSHIKO_BUILD_SPEC.md`, `PROJECT_BUILD_BRIEF.md`. Remove or rename `docs/PRIVATE_DEPLOYMENT.md`. User guide in EN/HE/RU gets the HACS install path.
   → verify: re-grep; read the README install section.

4. **`hacs.json`** at the repo root: `{"name": "ConX Dynamic Panel", "homeassistant": "<min HA version>", "render_readme": true}`. The min HA version is the oldest one we test against; confirm it from the spec.
   → verify: HACS Action passes (step 5).

5. **CI.** Add `.github/workflows/validate.yml` running `hacs/action@main` (category `integration`) and `home-assistant/actions/hassfest@master` on push, PR and schedule.
   → verify: both jobs are green on GitHub; fix whatever hassfest flags (likely `services.yaml` or `strings.json` schema nits, manifest key order).

6. **Repo metadata.** Run `gh repo edit` with a description and the topics `home-assistant`, `hacs`, `homeassistant-integration`, `lovelace`, `zigbee2mqtt`, `smart-panel`.
   → verify: `gh repo view --json description,repositoryTopics`.

7. **Release 0.3.15.** Bump `manifest.json`, add a CHANGELOG entry ("Relicensed under Apache-2.0; HACS support"), rebuild the frontend bundle if touched, run the full local CI (ruff, mypy, pytest, npm lint/test/build). Commit `Release 0.3.15: ...`, tag, and create a GitHub release.
   → verify: all local checks print clean; `gh release view v0.3.15`.

8. **Smoke test as a custom repo.** On a real HA, add the repo URL in HACS → Custom repositories, install, restart, check that the integration loads and the card serves. The update path from a manual install must preserve `.storage`.
   → verify: the integration is loaded in HA and existing profiles are intact.

9. **Submit to `hacs/default`** (outward-facing, needs your explicit go). Fork `hacs/default`, add `moshiko2312/conx-dynamic-panel` alphabetically to the `integration` file, and open a PR using their template.
   → verify: the PR bot checks pass; then wait for maintainer review (can take weeks).

## Out of scope
- Submitting brand images to `home-assistant/brands` (local `brand/` folder already satisfies HACS).
- Any functional code change.
