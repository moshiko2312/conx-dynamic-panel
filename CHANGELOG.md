# Changelog

All notable changes to this private project will be documented here.

## [Unreleased]

## [0.3.1] - 2026-08-08

### Changed

- **Scheduler task switches moved out of Controls:** local and master scheduler task switches now carry `entity_category: config`, so they group under a separate "Configuration" section on the device page instead of mixing into "Controls" with Auto sync / Holiday mode / etc.
- **Scheduler task switch name simplified:** the entity name for a local scheduler task switch is now just the task's own name (e.g. "בדיקה"), dropping the "Schedule " prefix.

## [0.3.0] - 2026-08-08

### Added

- **Screenshot setup guide:** `docs/SETUP_GUIDE.md` walks a first-time installer through installation and card configuration (live faceplate, settings menu, all 4 wizard steps, and the scheduler task/trigger editor) with an explicit explanation of every control, backed by real card screenshots under `docs/screenshots/`.

- **Faceplate panel-unavailable status:** when mapped relay entities are all Home Assistant `unavailable`/`unknown` (typical Z2M/MQTT offline), `get_config` / `subscribe` expose `panel_available: false` and the card shows a clear red **Panel unavailable** / **הפאנל לא זמין** / **Панель недоступна** line under the faceplate buttons (replaces the scheduler next footer while offline). Live `hass.states` also drives the banner; relay transitions to unavailable now push a runtime refresh.

### Fixed

- **Live HA cover STOP ignored on position-aware covers:** stopping a linked cover mid-travel (wall button, app, or automation — the HA entity `state` is the source of truth either way) could leave the panel's direction LED lit and the relay energized. `opening`/`closing` → terminal `open`/`closed` transitions were being re-derived as continued travel via the position-delta heuristic whenever `current_position` drifted slightly at the moment of stop (normal for covers that report position throughout the move). That heuristic is now only applied when the cover never reported a transient state to begin with (the genuine "dumb" position-only case); a transient→terminal transition always resolves to `stop`.

- **Setup crash when panel entities are offline:** mapping validation no longer aborts `async_setup_entry` when label text entities (or color/radar selects) are Home Assistant `unavailable`/`unknown`. Those states are treated as soft warnings; domain/existence/disabled/password checks still hard-fail. Integration loads and the card can show panel unavailable until writes succeed on reconnect.

- **Live HA cover → panel indication:** linked `covers[].ha_entity_id` state changes from HA UI/automations now drive cover open/close relays (transition-suppressed) and faceplate indication like lights — `opening`→open ON, `closing`→close ON, `open`/`closed`/`stopped`→both OFF. Does not re-mirror back to HA; brief suppress ignores echoes of panel→HA mirrors. Reverse/`stop_then_reverse` preserved. Sync still ends cover relays OFF.

- **Live HA cover sync missed position-only covers:** the mapping above only reacted to transient `opening`/`closing` state strings. Many position-aware covers (Z-Wave/Nodon and similar) never surface those — `state` can stay `open` for an entire move while only `current_position` changes, or the entity jumps straight between `open`/`closed` with no transient state at all. The live listener also bailed out early whenever `old_state.state == new_state.state`, before the cover binding was even checked, so a same-string transition never reached the sync logic regardless. Now the cover branch is checked before that bail-out, and the command is derived from the `current_position` delta first, then a plain `open`↔`closed` state-string flip, before falling back to `stop` — so these covers now drive the panel relay/LED like transient-state covers already did. Tilt-only and attribute-only noise still resolve to a no-op.

- **Profile delete silently failed / blocked without feedback:** deleting a profile referenced by any local or master scheduler task raised a raw `ValueError`, which the WebSocket layer turned into a generic “Unknown error”, so the card looked like delete did nothing. Delete now returns a clear Home Assistant error listing every blocking task name; the card also pre-checks scheduler refs and the last-profile rule with EN/HE/RU messages, shows a success notice, and reassigns `active_profile_id` / `default_profile_id` when the deleted profile was selected.

- **Duplicate profile ignored the display name:** Duplicate always appended `" copy"` with no prompt, so a name the user typed (or expected) never became the chip title — and an empty source id produced odd ids like `_copy_<timestamp>` with a visible name of just “copy”. Duplicate now prompts for the display name (default `{original} copy`), persists exactly what the user entered, and builds ids as `{sourceId}_copy_<timestamp>` with a `profile` fallback when the source id is empty. Backend `Profile.clone` treats whitespace-only names as missing and falls back sensibly.

- **Scheduler task delete left unavailable switches:** deleting a local or master scheduler task removed it from storage but called plain `Entity.async_remove()`, which keeps the entity-registry entry and writes `unavailable`. Delete now purges the registry unique_id and force-removes the switch; setup also drops orphan Schedule/Master schedule registry entries so Controls no longer shows them after reload.

- **Profile export/import schema mismatch:** card Export wrote panel `STORAGE_VERSION` (5) into portable `schema_version` while the frontend importer still expected export schema **2**, so Import failed with `Unsupported schema_version 5; current is 2`. Export now stamps dedicated `PROFILES_EXPORT_SCHEMA_VERSION` (2); Import accepts 1–2 and legacy mistagged 3–5 (profiles extracted; scheduler/holiday/snapshot ignored). Frontend import normalization preserves mixed roles, `pulse_time_s`, `cover_id`, `action`/`action_double` data, and cover `ha_entity_id`. Re-export from the card after upgrading to get a clean schema 2 file (old schema-5 exports also import).

- **Setup crash on holiday Store version bump:** `HolidayStore` (and panel / master stores) now subclass HA `Store` with `_async_migrate_func`. Loading an on-disk holiday file at Store version 1 after the bump to version 2 no longer raises `NotImplementedError` during config-entry setup; legacy `holiday_mode` migrates to `master_holiday`.

### Changed

- **Scheduler triggers replace timeline ranges (no more "to" time):** since scheduler tasks only ever run a profile, not a self-contained time window, each range is now a single `{start, profile_id}` trigger — the `end` field is gone from the model, editor, and export schema (bumped `SCHEDULER_EXPORT_SCHEMA_VERSION` 1→2; legacy files with a stale `end` key still import fine, the key is just ignored). A trigger's profile stays active until the next chronological trigger fires — in the same task, another task, or after wrapping past midnight — instead of expiring at an explicit end time. Conflict detection simplified to match: two enabled triggers only conflict when they share the exact same start time (with overlapping days/months) and different profiles; the old duration-overlap math is gone. Multiple triggers per task are still supported. Backend `scheduler.py` and the frontend `scheduler.ts` mirror stay in lockstep.

- **Scheduler task rows redesigned as compact cards:** the local/master task list no longer shows a name + range-count chip behind a single enable switch. Each row is now a card with the task name, day-of-week pills, one time pill per trigger (sorted), and three explicit actions — Delete / Edit / Enable-Disable — so the row itself communicates what the task does without opening the editor. Delete asks for confirmation first.

- **Operate hamburger in title row:** operate-mode menu control moved out of `.faceplate-labels` (no longer covers button names) into the profile title row (`[data-operate-profile]`), start-side aligned for LTR/RTL and vertically centered with the title (Lit card + HTML preview).

- **Action / Double-click action accordions:** in the button editor (free-mix role cards and Buttons accordion), the full **Action** block (service + entity + YAML) and the full **Double-click action** block are each a collapsed-by-default accordion matching the button-row pattern (dark card, chevron, summary like `light.toggle · light.salon_w` or **Not set** / **לא הוגדר** / **Не задано**). Mode chips stay outside. EN/HE/RU + RTL; Lit card + HTML preview + tests.

## [0.2.0] - 2026-08-07

### Added

- **Per-panel holiday + master holiday:** each panel stores its own `holiday_mode` (schema **v5**) to suspend that panel’s schedulers (“ביטול שעונים”). Domain **master holiday** (migrated from the old global holiday flag) forces holiday on **every** panel when ON. Effective holiday = panel OR master. Faceplate shows a small holiday badge when effective; next-profile footer is hidden. Card Scheduler tab has separate panel + master toggles (EN/HE/RU). HA: per-entry holiday switch + legacy unique_id master holiday switch. Holiday is not exported.

- **Faceplate next-profile footer reliability:** `find_next_scheduler_change` look-ahead is **14 days**, and when a range profile matches the default (no identity change) it still returns the next range-start so a newly saved task populates the footer. Compact “Scheduler on” row when active but no computable next. Cross-day times show weekday + HH:MM.

- **Scheduler delete button labels:** red range/condition/task delete controls use text (**Delete** / **מחק** / **Удалить**, plus **Delete range** / **מחק טווח**) instead of icon-only ×.

- **Scheduler export / import (separate from profiles):** portable JSON with `scope: "scheduler"`, `schema_version`, `default_profile_id`, local `scheduler_tasks`, and `master_scheduler_tasks` that target the current entry. Panel/master holiday is not exported. WebSocket/services `export_scheduler` / `import_scheduler` with merge (upsert by id) and replace (local tasks only; masters in the file still merge). Unknown `profile_id`s are skipped with warnings; static time conflicts reject the import. Scheduler tab compact Export / Import (merge) / Import (replace) controls (EN/HE/RU + RTL) + HTML preview + tests.

- **Double-click actions:** each button can configure an optional `action_double` Home Assistant action alongside the normal single `action`. When set, unsuppressed physical relay edges within **0.4s** are classified as 1 / 2 clicks and **only the matching action runs once** (classic deferred single — not the single action twice). Without that slot, single-click behavior stays immediate. Integration-generated relay writes remain suppressed and never count. `conx_dynamic_panel_button_press` events include `click_count` (1 or 2). **On double classification the physical relay is restored to its pre-gesture state** (transition suppression) before `action_double` runs; single-click does not restore. Momentary and cover-direction roles skip restore. Radio groups restore the full member snapshot so exclusivity stays intact. Card UI (EN/HE/RU) + HTML preview + tests. Triple-click (`action_triple`) is not supported.

- **Internal scheduler Phase 2 + 3:** optional structured HA entity conditions per task (`eq` / `neq` / numeric compares; no templates). Failed/missing entities make the task inactive for that evaluation; condition entity listeners re-evaluate with time ticks. **Master** multi-panel tasks live in a domain store (`scope=master`, `entry_ids[]`) and apply via each panel’s `activate_profile(..., sync=True)`. Static time conflict blocking still applies across local + master (conditions do not override). Storage schema **v4** + master store; EN/HE/RU Scheduler UI (conditions, master multi-select, conflict note). Faceplate footer shows **next profile + time** from backend `scheduler_next` when the scheduler is active (hidden on holiday / no enabled tasks).

- **Internal scheduler (Phase 1):** per-panel scheduled tasks with weekday/month filters and `from`–`to` timeline ranges (overnight supported, e.g. 22:00–06:00). Outside all enabled ranges the selectable **default profile** is applied. Global **Holiday mode** switch pauses schedulers on every panel. Saving blocks when two enabled ranges would activate different profiles at the same overlapping time (same-profile overlap allowed). On HA restart / time edges the coordinator evaluates the desired profile now and calls `activate_profile(..., sync=True)` when the scheduler owns the panel. Card **Scheduler** tab (EN/HE/RU) + WebSocket CRUD/validation APIs; storage schema **v3** (preserves profiles/snapshots).

### Changed

- **Scheduler day/month chip contrast:** weekday and month selectors in the task editor now use solid gold/accent fill with dark contrast text when selected, and muted darker chips when unselected (same treatment for master panel chips). Larger tap targets, 7-column day row, 4-column month grid (3 on narrow), plus light polish on ranges/conditions blocks. Lit card + HTML preview; EN/HE/RU + RTL unchanged.

- **Settings menu layout:** removed the Export Wizard button; language flags use a tight equal 3-column grid; Export / Import / Info / Automation actions use a compact 2-column grid instead of full-width stacked pills (Lit card + HTML preview; EN/HE/RU).

- **Live Action data (YAML) examples per domain/service:** choosing an Action prefills editable `data:` YAML for that service (e.g. `light.turn_on` → brightness/rgb, `climate.set_temperature` → temperature/hvac_mode, `cover.set_cover_position` → position). Empty or still-matching last auto-default is replaced; customized YAML is preserved. EN/HE/RU hints + HTML preview.

- **Info / מידע card guide:** settings menu opens a full-card guide (profiles, appearance, buttons, modes, roles, draft vs sync, operate mode, cover motor vs HA entity, actions/YAML, menu). EN/HE/RU; free-mix cover hints moved into the guide instead of inline clutter.

- **Optional HA `cover.*` entity on cover motors:** free-mix `cover_open` / `cover_close` role cards (and dedicated `mode=cover` editor) include a searchable **HA cover entity (optional)** / **ישות תריס ב-HA (אופציונלי)** picker beside the motor slot + travel times. Stored as `covers[].ha_entity_id` (one per motor). When the cover engine starts or stops, it best-effort mirrors `cover.open_cover` / `close_cover` / `stop_cover` to that entity — panel relays still drive the physical motor; HA failures are logged and never block the motor path. Live HA→panel indication also listens to that entity (`opening`/`closing` light the matching direction; terminal states force both OFF).

- **Live HA entity → panel LED/relay sync:** while a profile is active, the backend listens to `state_changed` for linked toggle (and safe radio) entities and updates the matching panel relay with transition suppression — so turning a light/switch off in the HA app turns the physical button LED off without waiting for Sync. Same Sync rules for toggles: momentary never latch from entity state; unavailable/unknown skipped. Cover motors use `covers[].ha_entity_id` (not toggle latch rules). Listeners rebuild on profile change / sync / unload.

- **Optional Action data (YAML) on button actions:** after Action + Entity pickers (free-mix role cards and Buttons accordion), a collapsible **Action data (YAML)** / **נתוני פעולה (YAML)** editor writes `button.action.data`. Flat `key: value` lines or a JSON object (HA Developer Tools → Actions `data:` style). Invalid input shows an inline error and does not wipe the last good data; entity picker still sets `target.entity_id` and keeps extra data fields additive. EN/HE/RU + HTML preview.

- **Sync matches linked HA entity → panel LED/relay:** after applying names/colors/modes on Sync (and activate+sync), toggle buttons set each relay ON/OFF from the linked entity state (`action.target.entity_id`). Lights/switches `on`→ON / `off`→OFF; domain-aware mapping for covers/media/locks when used as toggles. Mixed mode syncs `toggle` (and ungrouped `radio`); `cover_*` and `momentary` stay OFF. Radio groups prefer the member whose entity is ON when exactly one is active; cover direction relays never stay ON after sync.

### Changed

- **Scheduler range end is exclusive:** timeline ranges use start-inclusive / end-exclusive minutes (e.g. Morning `08:00–12:00` and Evening `12:00–17:00` — at exactly 12:00 Evening applies). Adjacent ranges sharing a boundary no longer conflict; true overlaps still do. Overnight ranges (e.g. `22:00–06:00`) stay active until the end minute exclusive. EN/HE/RU help copy updated.
- **Free-mix cover extras denser grid:** motor slot, optional HA cover entity, open/close/settle, and opposite-press use a consistent label-above-field `mixed-cover-grid` (auto-fit / 2×2 under narrow width, RTL-safe). Long inline role-card hints removed; guide text is in hamburger **Info**.
- **Free-mix role cards show Action + searchable Entity:** Toggle / Momentary / Radio extras include primary HA Action + Entity pickers in the same role window (not only buried in the button accordion). Uses `ha-service-picker` / `ha-entity-picker` when Home Assistant provides them; otherwise searchable filter + select. Cover roles keep motor-slot + inline travel times only (no fake HA entity for `cover_1`). Hint copy (EN/HE/RU) no longer says “look below”.
- **Operate mode hides cover live controls:** when the card is in Operate / תפעול, open/stop/close chrome is hidden — faceplate (and corner menu / profile name) only. Covers remain controllable via physical panel buttons and Settings-mode live controls.
- **Free-mix cover times live in the role card:** when a button is `cover_open` / `cover_close`, open/close/settle/opposite fields render compactly inside that L# mixed-role card (once per motor slot when open+close share `cover_1`). The large bottom “זמני נסיעת תריס” / mixed cover editor is removed. `cover_1` is labeled **Motor / Cover slot** (מנוע / מזהה תריס) — not an HA entity. Dedicated `mode=cover` editor stays, denser. Lit card + HTML preview + tests.

### Added

- **Operate / תפעול card mode:** after setup, **Operate** shows **only the faceplate card** (pressable rings + labels) — no live cover open/stop/close chrome, ConX brand header, status pills, large Settings button, draft/sync banners, or “Panel preview” / תצוגת פאנל section chrome (profile name stays visible above the faceplate). A small RTL-aware hamburger sits on a corner of the faceplate bezel; the menu exits to full Settings (**הגדרות** / Settings / Настройки) and keeps theme/language/export/automation. Preference persists in `localStorage` (`conx-dynamic-panel-operate`), EN/HE/RU, mirrored in the HTML preview.

### Fixed

- **Operate-mode hamburger menu opens full-size:** in Operate / תפעול the settings popover no longer clips inside the short faceplate card with awkward inner scroll. Opening the corner menu (or Info / automation / export overlays) inflates the card to a comfortable near-fullscreen height so the short settings panel fits without scrolling; longer Info/automation bodies scroll only in their content area.
- **Cover reverse no longer dies after direction switch:** on `stop_then_reverse`, the halt that clears the old direction no longer mirrors `cover.stop_cover` before the reverse `open_cover`/`close_cover`. A deferred HA/Zigbee stop after the new direction started was turning the action off (switch direction → then OFF). True stop / travel-complete / `stop_only` still mirror stop. Post-reverse stale-OFF grace lengthened 1.5s → 2.5s for slow deferred relay OFF echoes. Idle start no-chatter and hard mutex unchanged.
- **Broken warm LED colors never written:** `warm_white` / `warm_yellow` are filtered from card/preview color pickers (even if HA `options` still list them). Sync always remaps them to `white` / `yellow` before writing so Z2M cannot stick/freeze the Zemismart panel. Stale drafts migrate on load. Use `white`/`yellow` until the Z2M converter keys are fixed. HE: לבן חם / צהוב חם לא זמינים — בחרו לבן / צהוב.
- **Cover `stop_then_reverse` stays ON after reverse:** root cause was single-slot transition suppression — halt `OFF` was overwritten by reverse `ON`, so a deferred Zigbee/HA OFF event was treated as a stop and immediately killed the new direction (OFF old → ON new → OFF new). Suppression now queues per-entity expectations (OFF+ON both stay armed). After reverse `force_energize` only, active-direction OFF within 2.5s is ignored and re-asserted ON if HA flipped off (stale echo); idle starts still treat immediate OFF as stop; stops after the grace still halt. Inactive-direction OFF while moving still ignored; `force_energize` after settle kept; `stop_only` / hard mutex / idle no-chatter unchanged.
- **Cover `stop_then_reverse` re-energizes the opposite relay:** after halt+settle, reverse always issues `turn_on` for the new direction (`force_energize`) so a stale HA/Zigbee “still ON” reading from the physical reverse press cannot skip the start. Duplicate OFF reports on the *inactive* direction while travelling no longer abort motion (they previously killed reverse right after it started). Idle physical presses still skip OFF→ON chatter on an already-ON target. `stop_only` still stops without reversing; hard mutex unchanged.
- **Cover reverse keeps traveling:** `stop_then_reverse` no longer halts both relays (OFF→ON on the newly pressed direction killed latching Zemismart travel). Reverse now turns off only the previous direction, settles, keeps/ensures the new relay ON, and arms a fresh travel timer. If hardware turns the old direction OFF while the opposite is already ON, that is treated as reverse — not a full stop.
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
