# Changelog

All notable changes to this private project will be documented here.

## [Unreleased]

### Added

- **Live HA entity → panel LED/relay sync:** while a profile is active, the backend listens to `state_changed` for linked toggle (and safe radio) entities and updates the matching panel relay with transition suppression — so turning a light/switch off in the HA app turns the physical button LED off without waiting for Sync. Same Sync rules: `cover_*` / momentary never latch from entity state; unavailable/unknown skipped. Listeners rebuild on profile change / sync / unload.

- **Optional Action data (YAML) on button actions:** after Action + Entity pickers (free-mix role cards and Buttons accordion), a collapsible **Action data (YAML)** / **נתוני פעולה (YAML)** editor writes `button.action.data`. Flat `key: value` lines or a JSON object (HA Developer Tools → Actions `data:` style). Invalid input shows an inline error and does not wipe the last good data; entity picker still sets `target.entity_id` and keeps extra data fields additive. EN/HE/RU + HTML preview.

- **Sync matches linked HA entity → panel LED/relay:** after applying names/colors/modes on Sync (and activate+sync), toggle buttons set each relay ON/OFF from the linked entity state (`action.target.entity_id`). Lights/switches `on`→ON / `off`→OFF; domain-aware mapping for covers/media/locks when used as toggles. Mixed mode syncs `toggle` (and ungrouped `radio`); `cover_*` and `momentary` stay OFF. Radio groups prefer the member whose entity is ON when exactly one is active; cover direction relays never stay ON after sync.

### Changed

- **Free-mix role cards show Action + searchable Entity:** Toggle / Momentary / Radio extras include primary HA Action + Entity pickers in the same role window (not only buried in the button accordion). Uses `ha-service-picker` / `ha-entity-picker` when Home Assistant provides them; otherwise searchable filter + select. Cover roles keep motor-slot + inline travel times only (no fake HA entity for `cover_1`). Hint copy (EN/HE/RU) no longer says “look below”.
- **Operate mode hides cover live controls:** when the card is in Operate / תפעול, open/stop/close chrome is hidden — faceplate (and corner menu / profile name) only. Covers remain controllable via physical panel buttons and Settings-mode live controls.
- **Free-mix cover times live in the role card:** when a button is `cover_open` / `cover_close`, open/close/settle/opposite fields render compactly inside that L# mixed-role card (once per motor slot when open+close share `cover_1`). The large bottom “זמני נסיעת תריס” / mixed cover editor is removed. `cover_1` is labeled **Motor / Cover slot** (מנוע / מזהה תריס) — not an HA entity. Dedicated `mode=cover` editor stays, denser. Lit card + HTML preview + tests.

### Added

- **Operate / תפעול card mode:** after setup, **Operate** shows **only the faceplate card** (pressable rings + labels) — no live cover open/stop/close chrome, ConX brand header, status pills, large Settings button, draft/sync banners, or “Panel preview” / תצוגת פאנל section chrome (profile name stays visible above the faceplate). A small RTL-aware hamburger sits on a corner of the faceplate bezel; the menu exits to full Settings (**הגדרות** / Settings / Настройки) and keeps theme/language/export/automation. Preference persists in `localStorage` (`conx-dynamic-panel-operate`), EN/HE/RU, mirrored in the HTML preview.

### Fixed

- **Broken warm LED colors never written:** `warm_white` / `warm_yellow` are filtered from card/preview color pickers (even if HA `options` still list them). Sync always remaps them to `white` / `yellow` before writing so Z2M cannot stick/freeze the Zemismart panel. Stale drafts migrate on load. Use `white`/`yellow` until the Z2M converter keys are fixed. HE: לבן חם / צהוב חם לא זמינים — בחרו לבן / צהוב.
- **Cover `stop_then_reverse` stays ON after reverse:** root cause was single-slot transition suppression — halt `OFF` was overwritten by reverse `ON`, so a deferred Zigbee/HA OFF event was treated as a stop and immediately killed the new direction (OFF old → ON new → OFF new). Suppression now queues per-entity expectations (OFF+ON both stay armed). After reverse `force_energize` only, active-direction OFF within 1.5s is ignored and re-asserted ON if HA flipped off (stale echo); idle starts still treat immediate OFF as stop; stops after the grace still halt. Inactive-direction OFF while moving still ignored; `force_energize` after settle kept; `stop_only` / hard mutex / idle no-chatter unchanged.
- **Cover `stop_then_reverse` re-energizes the opposite relay:** after halt+settle, reverse always issues `turn_on` for the new direction (`force_energize`) so a stale HA/Zigbee “still ON” reading from the physical reverse press cannot skip the start. Duplicate OFF reports on the *inactive* direction while travelling no longer abort motion (they previously killed reverse right after it started). Idle physical presses still skip OFF→ON chatter on an already-ON target. `stop_only` still stops without reversing; hard mutex unchanged.
- **Warm LED colors + radar `none` on Zigbee panels:** select writes (colors and radar) use stronger fuzzy matching (case/space/hyphen **and** underscore collapse so `warm_white` ↔ `warmwhite`), alias/closest fallbacks (`warm_*` → `white`/`yellow` when absent; radar `none`/`off`/`0`/HE labels), wait/retry when the select is `unknown`/`unavailable` or options are empty, and timeout errors list entity id, current state, and available options. Card color/radar pickers prefer live mapped `select` options and keep the current draft value visible if missing from the list. **Root cause note:** Z2M ZMS-206 exposes `warm_white`/`warm_yellow` but the converter lookup keys are `warmwhite`/`warmyellow`, so those two colors often fail even when set directly in Z2M/HA — use `white`/`yellow` until Z2M is fixed.
- **Z2M `blue` looks cyan on panel LEDs:** card swatches and EN/HE/RU color labels treat Z2M option `blue` as cyan-appearing hardware (no true deep blue); wire value stays `blue`. `cyan` remains a separate option.
- **Faceplate LED rings no longer overlap header labels:** label bar is ~28%, rings are slightly smaller (`12.5cqw` / max 56px), and the touch face uses top/bottom padding with `overflow: hidden` so rings sit in the light body with clear separation under HE/EN/RU names (Lit card + HTML preview).
- **Free-mix role width grid:** per-button roles (L1–Ln) use a compact horizontal layout — `L#` + name beside a **5-column chip grid** (3+2 under ~360px), not a tall stack with a lone wrapping fifth chip. Pulse/`cover_id` extras stay on a second inline row only when needed; mixed cover travel times use a denser auto-fit grid. Lit card + HTML preview.
- **Buttons / free-mix density + contrast:** mixed-role cards are tighter (less padding, smaller chips, no redundant role label). Labels on card surfaces use theme text (not gold-on-gray). Selected mode/role chips use solid accent fill with `--accent-text` (black on gold in noir) for readable contrast.
- **Color/radar select sync timeout on physical panels:** profile values like `warm_white` are now fuzzy-matched to the live Home Assistant select options (case/space/hyphen), writes retry up to 3 times, select confirmation waits at least 20s (even if Confirm timeout is lower), and timeout errors list the available options. Default confirm timeout is 20s and sync timeout is 90s so Zigbee report-back can finish. Relay/name sync paths are unchanged aside from shared wait helpers.
- **Cover motor hard mutex (never both direction relays ON):** before energizing any cover direction, the opposite relay is forced OFF (serialized). Physical presses that already left the target ON are not pulsed OFF→ON (that chatter caused Zemismart latching loops). Card/service commands still turn the target ON when it is off. `stop_then_reverse` still halts both, settles with both OFF, then starts the other direction. Halt kills the active direction first. Mixed cover roles sync `open_button`/`close_button` from roles so unused template pairs never force-off toggle buttons. `cover_command` works in mixed mode when cover roles are active. Free-mix UI shows travel times / settle / opposite immediately under per-button roles.
- **Cover motor hard mutex (legacy note):** older builds forced both relays OFF then re-energized the target on every start; that path was restored to opposite-only OFF for latching Zigbee panels.
- **Card faceplate presses now drive the physical panel:** ring clicks were left as local LED preview only (to avoid dirty drafts), so the card never called the integration. Presses now call WebSocket `conx_dynamic_panel/execute_button`, which toggles/drives mapped relays and runs the same engines as a physical press (toggle, radio exclusivity, momentary pulse, cover). Draft stays clean — no Save Draft prompt. Live relay/`subscribe` updates still refresh the rings.

### Added

- **Config flow device-prefix auto-mapping:** enter the Zigbee2MQTT device name (e.g. `tp4`) and ConX fills L1–L4 relays, name texts, color ON/OFF, radar, backlight, brightness, and child lock from that prefix (or matching HA device). Manual entity picking remains available. Review/edit steps stay so you can override before create.
- **HA live Action / Entity pickers on the Buttons tab:** Action is a select built from `hass.services` (`domain.service`); Entity uses native `ha-entity-picker` when Home Assistant has loaded it, otherwise a select from `hass.states` filtered to the action’s domain. Clearing action clears the HA call; changing domain clears a mismatched entity. Same stored schema (`action` + `target.entity_id`). Standalone HTML preview uses sample service/entity lists. EN/HE/RU.

### Changed

- **Wider card + denser Buttons UI:** host/`ha-card` fill the Lovelace column (`width: 100%`, no small max-width). Faceplate bezel uses full card width with container-query ring/label scaling (keeps 4-gang landscape proportions). Sticky action pills, mode chips, free-mix role cards/chips, cover/radio blocks, tabs, and field spacing are tightened so Hebrew cover roles fit a denser wrapping row. Standalone HTML preview matches.

### Fixed

- **HA Lit card visual parity with HTML preview:** faceplate bezel/rings/labels (warm stone gradient, larger rings, slate header bar), Manrope + Cormorant Garamond fonts (was Outfit/Sora), ConX brand + panel name title, settings-tabs underline chrome, pill buttons, theme swatch cards, menu bevel, centered hero profile name, and dimmer % pill — so the Lovelace card matches `previews/conx-card-preview.html` graphics. Behavior (free-mix roles, momentary pulse, Save Draft vs Sync, gang/cover rules) was already aligned; modal overlays stay absolute inside `ha-card` (preview uses viewport-fixed siblings).
- **Standalone HTML preview momentary LED never auto-off:** the faceplate pulse timer called nonexistent `render()`, so after `pulse_time_s` the ring stayed visually ON on `file://` (no HA). Timer now clears via `renderFaceplate()`, uses the button’s draft `pulse_time_s`, and still cancels on re-press without marking dirty. Manual check: Free mix → set a button to Momentary / רגעי → set pulse → press ring → ON then OFF after pulse; re-press while ON turns OFF immediately; toggle still latches.
- **Momentary faceplate rings still stuck after live-refresh commit:** Lovelace often mutates `hass.states` then reassigns the *same* `hass` object, so Lit’s default `!==` skipped re-renders (unit tests passed only because they assigned new objects). The card now uses `hasChanged: () => true` on `hass`, prefers live relay ON / armed UI pulse for momentary rings, arms a matching `pulse_time_s` UI timer on physical/runtime ON (and clears on OFF), and subscribe/`get_config` include `relay_states` + `momentary_active` so rings track ON→OFF without reload or draft dirty.
- **Card UI did not auto-refresh on live actions:** faceplate LED rings ignored mapped relay entities and the card never subscribed to coordinator runtime pushes, so physical presses and momentary ON→OFF required a manual page reload. The card now reads `hass.states` for mapped `relay_entities`, prefers live relay state for rings (local faceplate preview remains optimistic and still auto-clears on the momentary timer), and subscribes to `conx_dynamic_panel/subscribe` for sync/cover runtime updates without touching the draft (live state never marks dirty).
- **Momentary auto-off timer:** pulse OFF is armed via `loop.call_later` *before* the HA action runs (and outside the lock for relay I/O), so a slow/hung action can no longer leave the relay latched ON. Faceplate momentary preview now pulses ON then auto-OFF after `pulse_time_s` (re-press cancels). Regression tests cover mocked `call_later` expiry and slow-action arming.
- **Momentary poisoned toggle / false Save Draft:** mixed-mode faceplate logic treated every `radio_member` button as classic radio, so toggle and momentary presses shared exclusivity LEDs and (before the local-preview fix) could mutate `selected_button` → dirty. Presses are now role-routed: toggle/momentary use local LED only, mixed radio uses group preview like `radio_split`, cover roles use cover preview. Physical mixed presses do not rewrite the profile draft. Strong regression tests for toggle / momentary / mixed L1+L2 / edit→save→press. Lit card + HTML preview.
- **Faceplate press demanded Save Draft:** in-card LED ring presses for classic radio modes mutated `draft.selected_button`, which flipped `_dirty` and showed the unsaved banner (and confirm dialogs) on every press. Presses now use local faceplate preview only; Save Draft stays for real editor edits, and Sync stays for hardware faceplate labels/colors. Lit card + HTML preview.
- **Save Draft left free-mix presses dead:** `async_update_profile` aborted engines against the *previous* draft, so a newly assigned momentary/cover role could stay latched ON — the next physical press produced no state change and looked unresponsive. Save now stores first, then resets pulse/cover relays on the saved active profile. Unused mixed cover timing templates no longer count as live motors (so Save/Sync no longer force L1/L2 OFF for non-cover roles).
- **Free mix presses felt dead:** unsaved editor drafts never drive the panel — presses use the last **saved** active profile. The red unsaved banner now states this; a post-save sync notice clarifies that Sync is for labels/colors while press behavior already follows the saved draft. Radio-group membership in mixed mode auto-promotes to `role=radio` and prunes non-radio members so toggle/momentary buttons cannot sit in a conflicting group. Role chip `radio` is labeled **Radio group / קבוצת רדיו** (not a phantom “relay” role); empty actions show a clear “relay-only” hint.

### Changed

- Draft action buttons (Save / Discard / Sync / Pull) move into a **sticky top status bar** under the unsaved/sync banners so Save stays reachable without scrolling (Lit card + HTML preview; footer dock removed).
- **Free mix discoverability:** Buttons tab now shows a full-width **Per-button roles / תפקיד לכל כפתור** section immediately under Mode (not buried in collapsed accordion rows). Each L1…Ln has role chips (toggle / momentary / radio / cover open / cover close), with pulse time for momentary, `cover_id` + Cover section for shutter roles, and Radio groups when any button is radio. Action/entity fields stay in the accordion for non-cover roles. Lit card + HTML preview parity.

### Added

- Profile mode **`mixed` (Free mix / מיקס חופשי / Свободный микс)** with per-button `role`: `toggle`, `momentary`, `radio`, `cover_open`, `cover_close`. Momentary pulses ON then OFF after `pulse_time_s` (`0.1–600 s`, default `2`); re-press cancels the timer and forces OFF. Cover and radio reuse the existing fail-safe engines. Legacy global modes remain. Alias `momentary_mix` / `press_mode` migrate into `mixed` / `role`.
- **Startup restore:** on integration setup / HA restart, hardware is re-applied from the stored **applied snapshot** (last successful Sync). Draft profiles stay as saved for the editor; applied wins for the panel. Cover/momentary abort still runs first for safety.
- **Live mapped-entity updates:** relay changes always refresh card runtime (including suppressed self-writes); non-relay mapped entities (names/colors/radar/backlight/lock) refresh the UI and mark `out_of_sync` when they drift from the applied snapshot.

### Changed

- Faceplate columns follow product photos: for N gangs, **N equal columns** across the glass (labels centered in the black header, LED rings centered under each label). Outer landscape bezel size stays similar across N; no more left-aligned N-of-4 empty trailing slots (Lit card + HTML preview).
- When `gang_count === 1`, the mode picker shows **toggle** and **mixed** (radio / radio_split / cover are hidden). Multi-button roles inside mixed are coerced to toggle on 1-gang. Switching a radio/cover profile to 1 gang coerces mode to `toggle`.
- Unsaved-draft warning (`card.unsaved` / `.warn.unsaved-draft`) is centered, bold red, and larger than body text so dirty draft state is unmistakable on noir and ivory (Lit card + HTML preview). Other status/notice/error banners keep their existing styling.
- Profiles tab (step 1) now shows **profile chips + panel gang count** (`מספר גאנגים` / Panel gangs / Число кнопок) together so gang selection sits with profile context. Cover mode still repeats the gang picker for convenience when editing shutters; Appearance no longer hosts it.
- Hero faceplate adapts to `gang_count`: only L1…Ln labels and LED rings render (Lit card + HTML preview). Bezel width/aspect stay locked to the landscape footprint while columns redistribute evenly.

### Added

- Multi-cover + gang count: profiles store `gang_count` (`1–4`) and `covers[]` (schema **v2**; migrates legacy `cover`). Up to `floor(n/2)` covers with per-cover fail-safe motors; different covers may run together when buttons do not overlap. Card/preview gang selector, add/remove cover blocks, optional `cover_id` on `cover_command`, EN/HE/RU.
- Compact numeric inputs in the Lit card and HTML preview (travel times / settle no longer stretch full width).

### Changed

- Mode control moved from Appearance (step 2) to Buttons (step 3), above radio groups / cover editors. Segmented mode chips replace the `<select>` and now span the full grid width with larger tap targets (Lit card + HTML preview; EN/HE/RU).
- Cover mode on a 4-gang panel always surfaces **Cover 1** plus a prominent **Cover 2** empty slot with **Add cover** (gang picker also available in the cover section; selecting Cover mode raises `gang_count` to 4 when lower). Preview migrated from legacy single `cover` to `covers[]` + multi-cover live controls.
- L1–L4 chip rows and faceplate force LTR so **L1 is leftmost** under Hebrew RTL.

- Profile mode `cover` for timed shutter/awning control. The installer maps any two of L1–L4 to open and close and sets a travel time per direction; the remaining buttons stay independent toggles. The whole engine lives in the coordinator, so physical presses, the card, services, and automations all share one code path.
  - **Hard mutual exclusion:** the engine never energizes both directions. A direction may only start after the opposite relay has been switched off and that write has succeeded; a failed write halts instead of starting. All decisions run under a per-entry `asyncio.Lock`.
  - Press the same direction while moving → full stop (both relays OFF, timer cancelled). Press the opposite direction while moving → always stop first, then either end there (`stop_only`, default) or wait `direction_settle_s` and reverse (`stop_then_reverse`).
  - Both relays are forced OFF on stop, travel-timer expiry, relay write failure, unsafe cover config, profile activation/update/delete/import, sync, integration setup, and unload. Setup is included, so a restart mid-travel cannot inherit an energized relay. The last energized relay pair is remembered in runtime state, so a mid-travel profile switch still de-energizes the buttons actually wired to the motor.
  - New `cover` profile block: `open_button`, `close_button`, `open_time_s` / `close_time_s` (`1–600 s`), `direction_settle_s` (`0–5 s`), `opposite_press`. Values are clamped on load and older stored profiles gain defaults without a storage schema bump.
  - New service `conx_dynamic_panel.cover_command` and WebSocket command `conx_dynamic_panel/cover_command` (`open` / `close` / `stop`), plus a `conx_dynamic_panel_cover_state` bus event carrying direction, reason, mapped buttons, and duration.
  - Card and HTML preview gain a **Cover / shutter** editor (button pickers that swap instead of colliding, travel times, direction-change delay, opposite-press policy) and a live **Cover control** row with Open / Stop / Close and the current state, in EN/HE/RU.
  - `tests/test_cover_engine.py` uses an adapter fake that raises if both directions are ever energized, and covers repress-to-stop, opposite-press in both policies, timer expiry, rapid alternating presses, profile switch/update/sync/unload cancellation, failed energize, unsafe config, and non-cover buttons.
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
- Suppression tracker drops a stale expectation when the observed transition does not match it, instead of keeping it around to swallow a later, unrelated physical press.

### Documentation

- `README.md`: brand icon table with install behaviour per Home Assistant version, corrected radio-groups card UX description, refreshed repository tree, and troubleshooting rows for the generic integration icon and for automations that omit `sync: true`.
- `docs/PRIVATE_DEPLOYMENT.md`: step-by-step install walkthrough (build → copy component → restart → add integration → map entities → card resource → card → hard refresh), a brand-icons section, an explicit draft-versus-sync explanation, guidance for switching profiles from automations, and an installer-facing card overview.
- `AI_BUILD_SPEC.md`: full cover-mode behavior contract and schema, plus brand-image requirements, including that the local `brand/` directory is the shipping path and that no `home-assistant/brands` pull request is to be opened.
- `README.md`: cover-mode section with the press/stop/reverse table and the fail-safe list, the `cover_command` service, card UX notes, and a troubleshooting row for an unsafe cover mapping.
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
