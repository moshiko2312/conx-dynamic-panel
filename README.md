# ConX Dynamic Panel

Private commercial Home Assistant project for ConX.

ConX Dynamic Panel transforms a supported multi-button smart switch into a configurable, multi-profile control panel. A single physical 4-button Zemismart panel can represent many virtual profiles, with different button names, actions, colors, radar settings, and button behavior.

> **Private software:** This repository is intended only for ConX business use. It is not prepared for HACS, public distribution, resale, or third-party redistribution.

## Start here

For Cursor or Codex:

1. Read `CURSOR_CODEX_MASTER_PROMPT.md`.
2. Read `AI_BUILD_SPEC.md` as the authoritative engineering contract.
3. Follow `AGENTS.md` and `.cursor/rules/conx-dynamic-panel.mdc`.
4. Review `docs/ARCHITECTURE.md` before creating code.

### Implementation status

MVP `0.1.1` is implemented in this repository:

- Backend package under `custom_components/conx_dynamic_panel/`
- Bundled card source under `frontend-src/`
- Built card artifact under `custom_components/conx_dynamic_panel/frontend/`
- Brand icon and logo under `custom_components/conx_dynamic_panel/brand/`
- Tests under `tests/` and `frontend-src/tests/`
- Private scripts under `scripts/`

## Product concept

The physical relays are not connected to electrical loads. They are used only as physical inputs and LED-state indicators.

Example profiles:

| Profile | L1 | L2 | L3 | L4 |
|---|---|---|---|---|
| Lighting | Living room | Kitchen | Outdoor | All off |
| Climate | Living AC | Bedroom AC | All AC | ECO |
| Scenes | Morning | Evening | Hosting | Night |
| Security | Arm home | Arm away | Disarm | Panic |

Profiles are edited inside Home Assistant. Changes remain as a draft until the user presses **Sync to Panel**.

## MVP device mapping

The first supported device is a Zemismart 4-button smart screen switch exposed through Zigbee2MQTT and Home Assistant entities.

```yaml
relays:
  l1: switch.b_l1
  l2: switch.b_l2
  l3: switch.b_l3
  l4: switch.b_l4

names:
  l1: text.name_l1
  l2: text.name_l2
  l3: text.name_l3
  l4: text.name_l4

settings:
  color_off: select.switch_color_off
  color_on: select.switch_color_on
  radar: select.radar_config
  backlight: switch.backlight_mode
  child_lock: switch.child_lock
```

These IDs are examples only. The integration must let the installer select every entity through Config Flow and must never hard-code customer entity IDs.

### Supported colors

```text
red
blue
green
white
yellow
magenta
cyan
warm_white
warm_yellow
```

These match the Zigbee2MQTT ZMS-206 / TS0601 expose list for `switch_color_on` /
`switch_color_off`. The card prefers **live** `options` from the mapped Home Assistant
`select` entities when available; defaults above are fallbacks only.

**Note (Z2M / hardware):** current `zigbee-herdsman-converters` exposes
`warm_white` / `warm_yellow` but the Tuya datapoint lookup keys are `warmwhite` /
`warmyellow` (no underscore). Setting the underscored values via Z2M or HA often
times out and the select stays on the previous color (e.g. `blue`). That is a
Zigbee2MQTT converter mismatch, not a ConX-only bug. If your HA `options` list
omits the warm variants, ConX maps them to the closest supported colors
(`white` / `yellow`). Prefer colors that already work when you set them manually
in Developer Tools.

### Supported radar values

```text
none
10s
20s
30s
45s
60s
```

Canonical Z2M value for radar off is `none`. ConX also accepts aliases such as
`off`, `0`, `disabled`, and Hebrew `ללא` / `כבוי` when resolving against live
select options. If the radar entity state is `unknown`, Sync still attempts to
write and waits for confirmation; a timeout error lists the available options.
## Main features

- Home Assistant Config Flow setup.
- Multiple physical panels.
- Unlimited profiles per panel.
- Four editable button names per profile.
- Four Home Assistant actions per profile.
- Configurable ON/OFF colors.
- Radar timeout, backlight, and child lock.
- Toggle mode.
- Radio mandatory mode.
- Radio optional mode.
- Radio split mode (per-group classic radio + independent toggles).
- Cover mode: timed shutter control with mapped up/down buttons and hard mutual exclusion.
- Draft configuration separated from applied hardware state.
- Manual **Sync to Panel**.
- Sync status: `synced`, `pending`, `syncing`, `error`, `out_of_sync`.
- Pull hardware state into the current profile.
- Profile activation from the card, services, scripts, and automations.
- Bundled private Lovelace custom card with premium industrial glass UI.
- Card languages: English, Hebrew (RTL), and Russian, with on-card flag selectors.
- Profile import/export (JSON merge or replace) from the card and WebSocket API.
- Zemismart-style horizontal faceplate preview (labels on top black bar, LED rings below).
- Copy-ready automation example generated from the panel's own profiles.
- Bundled ConX brand icon and logo for the Home Assistant integrations UI.
- Adapter architecture for additional panel models.

## Button modes

### Toggle

All four buttons are independent. Every real physical relay state transition executes the configured action once. The integration must not automatically reset the relay.

### Radio mandatory

Exactly one button remains ON.

When a button changes to ON:

1. Execute its action.
2. Turn the other buttons OFF.
3. Keep the selected button ON.

If the selected button is physically switched OFF, restore it to ON without executing the action again.

### Radio optional

Classic radio among radio members: exactly one button remains ON. Re-pressing the selected button does not turn it off (same exclusivity as radio mandatory).

### Radio split

Define multiple radio groups (for example buttons 1+4 in one group and 2+3 in another). Within a group exactly one button stays ON (classic radio; no self-toggle-off). Buttons not assigned to any group behave as independent toggles.

### Free mix (`mixed`)

Configure each button separately with a `role`: toggle, momentary (timed pulse), radio (via radio groups), or cover open/close. Momentary presses turn the relay ON, run the button action once, then turn it OFF after `pulse_time_s`. A re-press cancels the timer and forces OFF. Cover roles reuse the fail-safe motor engine. Legacy single-behavior modes remain available.

### Cover

Timed shutter/awning control. Choose which panel buttons are **Open** and **Close** (any two of L1–L4, they must differ) and set a travel time for each direction. Remaining buttons stay independent toggles.

This mode drives a motor, so the entire engine lives in the integration. The card, services, and automations all call the backend; nothing writes the direction relays directly.

| Situation | Result |
|---|---|
| Press a direction while stopped | That direction starts and a travel timer is armed |
| Press the same direction while moving | Full stop: both relays OFF, timer cancelled |
| Press the opposite direction while moving | Always stops first. `Stop only` (default) ends there; `Stop, then reverse` waits the direction-change delay and then starts the other direction |
| Travel time elapses | Both relays forced OFF |
| Profile change, sync, reload, unload, or any relay write failure | Both relays forced OFF |

The two directions are never energized together: before a direction can start, the opposite relay is switched off and that write must succeed. **Direction change delay** (`0–5 s`, default `0.5 s`) is the dead time between the two, and it is worth keeping above zero for relay and motor life. Travel times accept `1–600 s`.

Cover state changes fire `conx_dynamic_panel_cover_state` on the Home Assistant bus with the current direction, the reason, the mapped button pair, and the travel duration.

### Feedback-loop protection

Every integration-generated relay change must be registered in a per-entity suppression tracker before the service call. A matching expected transition is ignored by the physical-press handler. Do not depend only on delays.

## Draft and sync model

Each profile has:

- **Draft:** editable configuration stored by the integration.
- **Applied snapshot:** the last configuration successfully written to the physical panel.

Both survive Home Assistant restarts via versioned storage. On startup the integration re-applies the **applied snapshot** to the physical panel so hardware matches the last successful Sync; any pending draft remains in the editor until you Sync again.

Editing changes only the draft and sets the state to `pending`.

Sync writes sequentially:

1. Names L1-L4.
2. OFF color.
3. ON color.
4. Radar timeout.
5. Backlight.
6. Child lock.
7. Relay state required by the selected mode.

Every write must be confirmed from Home Assistant state with a timeout. A failed write sets the state to `error`, preserves the previous applied snapshot, and exposes a useful error message.

## Integration-created entities

Suggested entities per panel:

```text
select.<panel>_active_profile
sensor.<panel>_sync_status
sensor.<panel>_last_sync
sensor.<panel>_last_error
button.<panel>_sync
button.<panel>_pull_from_panel
switch.<panel>_auto_sync
```

Button events should expose:

```yaml
panel_id: kitchen_panel
profile_id: lighting
button: 2
button_name: Kitchen
mode: toggle
new_relay_state: "on"
```

## Services

```text
conx_dynamic_panel.sync
conx_dynamic_panel.activate_profile
conx_dynamic_panel.pull_from_panel
conx_dynamic_panel.execute_button
conx_dynamic_panel.cover_command
conx_dynamic_panel.reload
```

`cover_command` takes `command: open | close | stop` and behaves exactly like a physical press on the mapped button, including repress-to-stop and the mutual-exclusion guarantees.

Example:

```yaml
action: conx_dynamic_panel.activate_profile
data:
  entry_id: YOUR_CONFIG_ENTRY_ID
  profile_id: scenes
  sync: true
```

Activating a profile only updates the stored draft. The physical panel changes
only when the call also syncs, so automations that switch profiles must pass
`sync: true`.

The card's hamburger menu has an **Automation example** entry that opens a
copy-ready automation for switching profiles by time of day, pre-filled with the
panel's own `entry_id` and profile ids. The same example lives in
`examples/automations.yaml` (`conx_profile_by_time_of_day`).

## Repository structure

```text
conx-dynamic-panel/
├── custom_components/
│   └── conx_dynamic_panel/
│       ├── brand/          # icons served by Home Assistant 2026.3+
│       └── frontend/       # built Lovelace card artifact
├── frontend-src/
├── brands/                 # master artwork + brands-repo layout mirror
├── previews/
├── docs/
├── examples/
├── tests/
├── scripts/
├── .cursor/rules/
├── .github/workflows/
├── AGENTS.md
├── AI_BUILD_SPEC.md
├── CURSOR_CODEX_MASTER_PROMPT.md
├── CHANGELOG.md
├── LICENSE-PRIVATE.md
├── README.md
└── pyproject.toml
```

## Private installation

No HACS support is required.

```bash
./scripts/build_frontend.sh
./scripts/install_local.sh /path/to/homeassistant/config
```

Or manually:

1. Build the frontend with `./scripts/build_frontend.sh`.
2. Copy `custom_components/conx_dynamic_panel` to the target Home Assistant configuration under `custom_components/`.
3. Restart Home Assistant.
4. Add **ConX Dynamic Panel** from **Settings → Devices & services**.
5. Select all mapped entities.
6. Add the bundled JavaScript resource if it is not registered automatically:
   `/conx_dynamic_panel/frontend/conx-dynamic-panel-card.js` as a Lovelace module resource.
7. Add the card:

```yaml
type: custom:conx-dynamic-panel-card
entry_id: YOUR_CONFIG_ENTRY_ID
# optional: compact: true
# optional: language: he   # en | he | ru (also choosable on the card; persisted in localStorage)
```

### Brand icons

The integration ships its own icon and logo in
`custom_components/conx_dynamic_panel/brand/`:

| File | Size | Used for |
|---|---|---|
| `icon.png` | 256x256 | Integration tile in Settings → Devices & services |
| `icon@2x.png` | 512x512 | hDPI displays |
| `logo.png` | 664x256 | Wider brand lockup (config flow header, device pages) |
| `logo@2x.png` | 1329x512 | hDPI displays |

**Home Assistant 2026.3 and later** pick these up with no extra work. Home
Assistant serves them through `/api/brands/integration/conx_dynamic_panel/...`
and local files take priority over the public brands CDN. Because
`scripts/install_local.sh` and `scripts/update_local.sh` copy the whole
integration directory, the icons install automatically — restart Home Assistant
and hard-refresh the browser, since brand images are cached in the browser.

**On Home Assistant older than 2026.3** there is no supported local override:
the frontend fetches integration icons straight from `brands.home-assistant.io`,
so a generic puzzle-piece icon is shown until the domain exists in the public
brands repository. ConX does not publish to that repository, so upgrade to
2026.3+ to get the branded icon.

`brands/master/` holds the master artwork and `brands/custom_integrations/conx_dynamic_panel/`
mirrors the public brands-repo layout for marketing use and for a possible
future submission. Regenerate every derived file (never resize by hand) with:

```bash
python3 scripts/build_brand_images.py   # requires Pillow
```

### Card UX notes

- Draft edits never write hardware until **Sync to Panel** (unless auto-sync is enabled).
- **Hamburger menu** opens a centered settings modal: language (HE/EN/RU), theme (**Noir gray** / **Ivory cool**), and import/export actions (green Export).
- **Hero faceplate** sits above three tabs: **Profiles** · **Appearance** · **Buttons**. The active profile name is centered in the preview header; panel name is editable on Profiles.
- Profiles: 3-column chips, Create / Duplicate / Delete (no rename / no drag layout).
- Appearance: mode, colors, radar, backlight + large brightness dimmer, child lock.
- Buttons: collapsible per-button editors; when mode is **Cover**, a **Cover / shutter** block picks the open and close buttons (choosing a button already used by the other direction swaps the pair), the two travel times, the direction-change delay, and the opposite-press policy. A **Cover control** row under the faceplate sends Open / Stop / Close through the integration and shows the live state.
- Buttons: when mode is **Radio split**, the whole **Radio groups** block has a single collapse switch in its header. Group 1 / Group 2 / Independent toggle have no switches of their own — membership is set by tapping the L1–L4 chips. Collapsing shows a one-line recap such as `Group 1: L1, L4 · Group 2: L2, L3 · Independent toggle: —`, and the open/closed choice is remembered in `localStorage`.
- Faceplate is 1×4 L→R (not 2×2). LED rings follow draft `color_on` / `color_off`. CSS extension point: `--conx-faceplate-skin`.
- **Export** downloads profiles JSON; **Import (merge)** / **Import (replace)** use the authenticated WebSocket API.

### HTML preview

`previews/conx-card-preview.html` is a standalone interactive mock of the Lovelace card (no Home Assistant required). Use it to iterate on layout, themes, radio split, cover mode, and i18n before rebuilding the Lit bundle. Demo state persists in `localStorage` (`conx-card-preview-state-v9`). Cover motion in the preview is a simulation of the backend engine, provided so the preview shows the same observable behavior; the real card never drives relays itself. The companion file `previews/conx-panel-wizard.html` exercises portable JSON import/export.

Update an existing install without touching Home Assistant storage:

```bash
./scripts/update_local.sh /path/to/homeassistant/config
```

## Development rules

- Private commercial project only.
- Do not add HACS files, HACS workflows, public-store metadata, or public-release language.
- UI setup only; no YAML configuration for the integration.
- Fully asynchronous backend.
- Use Home Assistant entities, not direct MQTT, in the MVP.
- Use current public Home Assistant APIs.
- Keep device-specific behavior inside adapters.
- Support desktop, mobile, RTL, light theme, and dark theme.
- Do not store or execute arbitrary Python or untrusted templates.
- Add automated tests for suppression, radio behavior, storage migration, profile activation, and failed sync recovery.

## MVP acceptance criteria

1. Full UI setup.
2. Entity-domain and capability validation.
3. At least two profiles can be created.
4. Four labels, four actions, colors, radar, backlight, child lock, and mode per profile.
5. Editing never changes the panel before Sync.
6. Sync reports success or a useful failure.
7. Profile activation may optionally sync immediately.
8. Toggle executes once per physical state change.
9. Radio mandatory and optional work without loops.
10. The custom card works on desktop and mobile, including Hebrew RTL, English, and Russian.
11. Backend and frontend tests pass.

## Roadmap

### v0.1.0 (implemented)

- Config Flow, Reconfigure Flow, and Options Flow
- Zemismart adapter with confirmation waits
- Versioned profile storage with draft vs applied snapshot
- Toggle, radio mandatory, and radio optional
- Manual Sync, Pull from panel, and sync diagnostics
- Profile create / update / duplicate / delete
- Bundled Lit card with English and Hebrew RTL
- Services, WebSocket API, private install scripts, and automated tests

### v0.1.1 (implemented)

- Premium Lit card aligned with HTML preview (tabs, menu modal, themes, radio split)
- Profile import/export + panel rename WebSocket APIs
- Chip-based radio-group membership behind one master collapse toggle
- Copy-ready automation example modal
- Bundled brand icon and logo for Home Assistant 2026.3+

### Later

- Sync all panels
- Multi-click experiments
- Automatic profile conditions
- Additional panel adapters
- Internal ConX profile library
- Photo-based faceplate skin overlay

## Troubleshooting

| Symptom | Likely cause | What to do |
|---|---|---|
| Card missing / custom element unknown | Lovelace resource not registered | Add `/conx_dynamic_panel/frontend/conx-dynamic-panel-card.js` as a Lovelace **module** resource, then hard-refresh the browser |
| Sync status `error` / timeout | Entity unavailable, Zigbee delay, or short timeout | Confirm mapped entities are available; increase **Confirm timeout** / **Sync timeout** in integration options |
| Sync status `out_of_sync` | Hardware values differ from the last successful sync | Use **Pull from Panel** to inspect, then **Sync to Panel** to re-apply the draft, or keep the pulled draft and sync it |
| Draft edits do not change the panel | Expected draft behavior | Press **Sync to Panel** (or enable auto-sync in options) |
| Reconfigure cannot save mapping | Duplicate relays or invalid entity domains | Ensure each relay/name is unique and domains match (`switch` / `text` / `select`) |
| Actions do not run on press | Wrong mode, suppressed transition, or invalid service | Confirm the profile mode, that the press is physical (not sync-driven), and that the action service exists |
| Hebrew UI not RTL | Language not set to Hebrew | Use the on-card IL flag, set card `language: he`, or set HA language to Hebrew |
| Import fails | Invalid JSON or missing profiles object | Export first for the expected schema; import requires a non-empty `profiles` map |
| Automation switches the profile but the panel does not change | `activate_profile` called without `sync` | Pass `sync: true`; activation alone only updates the draft |
| Cover buttons do nothing | Open and close mapped to the same button, or travel time outside `1–600 s` | The card shows "Open and close must use different buttons"; pick two different buttons and re-sync. The engine refuses to move on an unsafe config and forces both relays OFF |
| Generic puzzle-piece integration icon | Home Assistant older than 2026.3, or cached brand image | On 2026.3+ restart Home Assistant and hard-refresh; older versions cannot load local brand images |

See also `docs/PRIVATE_DEPLOYMENT.md` for install/update rules.

## Ownership

Copyright © ConX. All rights reserved.

See `LICENSE-PRIVATE.md`.
