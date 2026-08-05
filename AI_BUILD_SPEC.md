# ConX Dynamic Panel — Complete Build Specification

## Mission

Build the first production-ready private version of `conx-dynamic-panel` as a Home Assistant custom integration with a bundled Lovelace custom card.

This is private commercial software for ConX. Do not prepare it for HACS, public distribution, package marketplaces, or third-party resale.

Work autonomously. Do not ask routine implementation questions. Make safe, conventional engineering decisions using current public Home Assistant APIs. Use placeholders only for values that genuinely belong to the owner or deployment environment.

## Non-negotiable behavior

1. One configured panel maps to four relay switch entities, four text-name entities, and shared color, radar, backlight, and child-lock entities.
2. Profiles are edited as drafts.
3. Draft changes never update the physical panel unless auto-sync is explicitly enabled.
4. The user presses Sync to apply the active profile.
5. A profile contains an ID, display name, four labels, four actions, color settings, radar, backlight, child lock, mode, and selected radio state when relevant.
6. Toggle mode executes once for every real physical relay state transition.
7. Radio mandatory allows exactly one ON relay.
8. Radio optional uses classic radio exclusivity: exactly one ON among radio members (no self-toggle-off).
9. Integration-generated relay changes must never trigger user actions.
10. Profile activation and profile synchronization are separate operations, with an option to perform both.
11. The UI must support English, Hebrew RTL, and Russian.
12. The MVP communicates through Home Assistant entities, not directly through MQTT.
13. The project must install manually and remain independent of HACS.

## Example entity mapping

```yaml
relay_entities:
  - switch.b_l1
  - switch.b_l2
  - switch.b_l3
  - switch.b_l4
name_entities:
  - text.name_l1
  - text.name_l2
  - text.name_l3
  - text.name_l4
color_off_entity: select.switch_color_off
color_on_entity: select.switch_color_on
radar_entity: select.radar_config
backlight_entity: switch.backlight_mode
child_lock_entity: switch.child_lock
```

These IDs are examples and test fixtures only. Never hard-code them into production runtime logic.

## Supported adapter defaults

Colors:

```text
red, blue, green, white, yellow, magenta, cyan, warm_white, warm_yellow
```

Radar:

```text
none, 10s, 20s, 30s, 45s, 60s
```

Validate against the actual `options` attribute of the selected Home Assistant select entities. Adapter defaults are fallback values only.

## Backend architecture

Use a modern Home Assistant config-entry integration.

- `manifest.json` must include `config_flow: true`, an internal version, and suitable `iot_class` metadata.
- Config Flow validates entity existence, domain, uniqueness, and writable capability.
- Reconfigure Flow changes entity mappings without deleting profiles.
- Options Flow manages sync timeout, auto-sync, confirmation timeout, and logging level.
- Store hardware mapping in `ConfigEntry.data`.
- Store normal editable options in `ConfigEntry.options`.
- Store profiles, snapshots, and schema version with `homeassistant.helpers.storage.Store`.
- Attach typed runtime data to `ConfigEntry.runtime_data`.
- Use public Home Assistant APIs only.
- Keep hardware-specific behavior inside adapters.

## Adapter layer

Create an abstract `PanelAdapter` and a `Zemismart4GangAdapter`.

Required adapter API:

```python
async def async_validate_mapping() -> None
async def async_read_hardware_state() -> HardwareState
async def async_apply_profile(profile: Profile) -> SyncResult
async def async_set_relay(index: int, state: bool, *, suppress_event: bool = True) -> None
async def async_set_names(names: tuple[str, str, str, str]) -> None
async def async_set_colors(color_on: str, color_off: str) -> None
async def async_set_radar(value: str) -> None
async def async_set_backlight(enabled: bool) -> None
async def async_set_child_lock(enabled: bool) -> None
```

Use Home Assistant services:

- `text.set_value`
- `select.select_option`
- `switch.turn_on`
- `switch.turn_off`

After every hardware write, wait for the corresponding state to confirm the expected value. Use a configurable timeout and raise a clear integration-specific exception on failure.

## Event suppression

Implement a dedicated suppression tracker.

```python
@dataclass
class ExpectedTransition:
    expected_state: str
    expires_at: float
    operation_id: str
```

Before a relay service call, register the expected transition. In the relay state listener, consume and ignore the transition only when entity ID, expected state, and expiry match.

Clean expired entries lazily or periodically. Do not rely only on sleeps or fixed delays.

## Relay state listeners

Subscribe only to the four mapped relay entities.

Ignore transitions when:

- old or new state is missing
- new state is `unknown` or `unavailable`
- old state equals new state
- the transition matches suppression
- the integration is unloading

Then route to the active profile mode handler.

## Button action execution

Store normalized Home Assistant action/service-call objects.

```json
{
  "action": "light.toggle",
  "target": {"entity_id": "light.living_room"},
  "data": {}
}
```

Execute through Home Assistant public service APIs with blocking completion and exception handling. Validate service existence when saving when practical, and validate again at execution time.

Emit an integration event after every real physical press with config entry ID, panel name, profile ID, button index, label, mode, and relay state.

Do not execute arbitrary Python or untrusted templates.

## Storage model

Use typed dataclasses or immutable typed models with explicit serializers.

```json
{
  "schema_version": 1,
  "active_profile_id": "lighting",
  "profiles": {
    "lighting": {
      "id": "lighting",
      "name": "Lighting",
      "mode": "toggle",
      "color_on": "cyan",
      "color_off": "blue",
      "radar": "30s",
      "backlight": true,
      "child_lock": false,
      "selected_button": null,
      "buttons": [
        {
          "index": 1,
          "name": "Living room",
          "action": {
            "action": "light.toggle",
            "target": {"entity_id": "light.living_room"},
            "data": {}
          }
        }
      ]
    }
  },
  "applied_snapshot": {},
  "last_sync": null,
  "last_error": null
}
```

Always implement explicit storage migrations when the schema version changes.

## Sync state machine

States:

```text
synced
pending
syncing
error
out_of_sync
```

Rules:

- Draft differs from applied snapshot → `pending`.
- Sync begins → `syncing`.
- All writes and confirmations succeed → copy draft to applied snapshot and set `synced`.
- Any write or confirmation fails → set `error`, preserve the previous applied snapshot, and store the error.
- A hardware read differs from applied snapshot → `out_of_sync`.

Use a per-entry async lock so only one sync can run at a time.

## Persistence and restart restore

Versioned `Store` persistence (`schema_version`, profiles, `active_profile_id`, `applied_snapshot`, sync metadata) must survive Home Assistant restarts. Migrations must never drop profiles or the applied snapshot.

On integration setup / HA start:

1. Load storage (with migrations).
2. Abort cover motion and momentary pulse timers (safe OFF for those relays).
3. If an `applied_snapshot` exists, **re-apply it to hardware** (names, colors, radar, backlight, child lock, mode relay intents). Draft profiles are not overwritten — applied wins for the panel; the editor keeps any unsaved/pending draft.
4. If restore fails, keep the snapshot on disk, set `error`, and expose `last_error`.

Live state:

- Listen to mapped relay entities for physical presses (with transition suppression for self-writes).
- Always notify the card when mapped entity states change so UI tracks the real world (Zigbee restore, external control).
- Listen to other mapped entities (names/colors/radar/backlight/lock); when they drift from the applied snapshot outside an active sync, mark `out_of_sync`.

## Profile modes

### Toggle

Every unsuppressed physical relay transition executes the associated action once. Do not reset the relay automatically.

### Radio mandatory

Exactly one relay must remain ON.

- Physical transition to ON: execute action, suppress and turn all other relays OFF, persist selected index.
- Physical transition of selected relay to OFF: suppress and restore it to ON without executing the action.
- Profile activation with no valid selected index defaults to button 1 unless the profile explicitly stores another valid index.

### Radio optional

Classic radio among radio members: exactly one relay remains ON (same exclusivity as radio mandatory; no self-toggle-off).

- Physical transition to ON: execute action, suppress and turn all other member relays OFF, persist selected index.
- Physical transition of selected relay to OFF: suppress and restore it to ON without executing the action.
- Profile activation with no valid selected index defaults to the first radio member.

### Radio split

Multiple independent radio groups via profile `radio_groups` (each `{ id, buttons }`).

- A button belongs to at most one group.
- Ungrouped buttons behave as toggle.
- Physical ON within a group: execute action, suppress and turn other members of that group only OFF.
- Physical OFF within a group: suppress and restore that member to ON (classic radio; no all-off).
- Sync does not force a global single selected relay pattern.

### Mixed (free mix)

Per-button `role` on the profile (`mode: mixed`):

| Role | Behavior |
|---|---|
| `toggle` | Latched on/off; action on every real physical transition |
| `momentary` | ON + action once, then OFF after `pulse_time_s`; re-press cancels and forces OFF |
| `radio` | Classic radio within `radio_groups` (ungrouped radio acts as toggle) |
| `cover_open` / `cover_close` | Same fail-safe cover engine; `cover_id` + `covers[]` timing |

There is no separate `relay` role. A latched panel relay is `toggle`; configure a Home Assistant `action` when the press should also run a service.

Validation: cover open/close must be paired and exclusive; radio groups may only contain `role=radio` buttons (non-radio members are pruned); radio groups exclusive; momentary timers cancel on profile change / sync / unload. `gang_count === 1` allows toggle and momentary only. Legacy modes stay available; alias `momentary_mix` normalizes to `mixed`.

**Draft vs Sync for presses:** physical press routing (mode, roles, actions, radio exclusivity, momentary pulse, cover) uses the **saved active profile draft** in storage — not the applied snapshot and not an unsaved editor buffer. **Save Draft** makes role/action changes live for presses. **Sync** pushes labels, colors, radar, backlight, child lock, and mode relay safety to hardware. With `auto_sync`, a successful draft save also syncs hardware. Unsaved card edits never affect presses.

On Save Draft / profile activation, the coordinator persists the new draft first, then aborts cover/momentary engines against that saved profile so newly assigned pulse/cover roles start from OFF (a latched ON leftover would otherwise swallow the next physical press). Mixed-mode unused cover timing templates are not live motors and must not force L1/L2 OFF.

### Cover

Timed shutter/awning control for motors wired to relay pairs. The engine is
fail-safe by construction and lives entirely in the backend coordinator.

Profile fields:

```json
"gang_count": 4,
"covers": [
  {
    "id": "cover_1",
    "open_button": 1,
    "close_button": 2,
    "open_time_s": 20.0,
    "close_time_s": 20.0,
    "direction_settle_s": 0.5,
    "opposite_press": "stop_only"
  }
]
```

- `gang_count`: `1..4` (default 4). UI and validation expose only L1…Ln.
- `covers[]`: up to `floor(gang_count/2)` independent motors. Legacy single
  `cover` objects migrate into `covers` (storage schema version 2).
- Buttons are exclusive across covers. Unused buttons stay independent toggles.
- Per-cover mutual exclusion is absolute; different covers may travel at once
  when their relay pairs do not overlap.
- `cover_command` accepts optional `cover_id` (defaults to the first cover).
- UI chip rows for L1–Ln always render left→right with L1 on the left, including
  under Hebrew RTL.
- Travel times / settle use compact numeric inputs in the card and preview.

Behavior contract (per cover):

- **Mutual exclusion is absolute within a cover.** Only one direction relay of a
  given cover is ever energized. Every start de-energizes the opposite relay
  first and only proceeds once that write succeeds.
- **All decisions are serialized** by a per-entry `asyncio.Lock`.
- Press same direction while moving → stop. Opposite press → stop, then optional
  reverse after `direction_settle_s`.
- Force both of a cover's relays OFF on stop, timer expiry, write failure, unsafe
  config, profile change, sync, setup, and unload.
- State events include `cover_id` plus the button pair and duration.

## Integration entities

Implement per panel:

- Select entity: active profile
- Sensor entity: sync status
- Sensor entity: last sync timestamp
- Sensor entity: last error, diagnostic
- Button entity: sync
- Button entity: pull from panel
- Switch entity: auto-sync
- Event entity for button presses when supported; otherwise fire a namespaced Home Assistant bus event

All entities must share one Home Assistant device with correct identifiers and manufacturer/model metadata.

## Services

Register:

```text
conx_dynamic_panel.sync
conx_dynamic_panel.activate_profile
conx_dynamic_panel.pull_from_panel
conx_dynamic_panel.execute_button
conx_dynamic_panel.reload
conx_dynamic_panel.export_profiles
conx_dynamic_panel.import_profiles
conx_dynamic_panel.cover_command
```

`cover_command` takes `command: open | close | stop` and applies the same cover
contract as a physical press.

Portable profiles JSON (card download, WebSocket `export_profiles`, and service
`export_profiles`) uses:

```json
{
  "schema_version": 1,
  "active_profile_id": "lighting",
  "profiles": {
    "lighting": {
      "id": "lighting",
      "name": "Lighting",
      "mode": "toggle",
      "color_on": "cyan",
      "color_off": "blue",
      "radar": "30s",
      "backlight": true,
      "child_lock": false,
      "selected_button": null,
      "buttons": [
        {"index": 1, "name": "L1", "action": null}
      ]
    }
  }
}
```

`import_profiles` accepts the same object (profiles may also be an array of
profile objects). `mode` is `merge` or `replace`.

Validate service payloads. Services must target a specific config entry or device.

## WebSocket API

Implement authenticated commands under `conx_dynamic_panel/*`:

```text
conx_dynamic_panel/get_config
conx_dynamic_panel/subscribe
conx_dynamic_panel/list_profiles
conx_dynamic_panel/create_profile
conx_dynamic_panel/update_profile
conx_dynamic_panel/delete_profile
conx_dynamic_panel/duplicate_profile
conx_dynamic_panel/set_active_profile
conx_dynamic_panel/sync
conx_dynamic_panel/pull
conx_dynamic_panel/export_profiles
conx_dynamic_panel/import_profiles
```

`subscribe` pushes live runtime fields (`sync_status`, `cover_state`, `relay_entities`, …) on coordinator notify. It must never include profile drafts. The card mirrors mapped relays via `hass.states` for faceplate LEDs.

Require admin permission for configuration-changing commands. Validate payloads with current Home Assistant schema tools.

## Config Flow UX

### Step 1: Panel identity

- Panel name
- Adapter type, initially Zemismart 4 Gang

### Step 2: Relay entities

- L1-L4, filtered to `switch`

### Step 3: Name entities

- Name L1-L4, filtered to `text`

### Step 4: Shared setting entities

- Color OFF `select`
- Color ON `select`
- Radar `select`
- Backlight `switch`
- Child lock `switch`

### Step 5: Validation summary

Validation:

- No duplicate relay entities.
- No duplicate name entities.
- Correct domains.
- Select entities expose options.
- Text entities are writable.
- All mapped entities exist.
- Prevent configuring the same relay set twice.

## Frontend custom card

Build with TypeScript and Lit. Bundle with Vite into the integration's frontend directory.

Custom elements:

```text
conx-dynamic-panel-card
conx-dynamic-panel-card-editor
```

Card config:

```yaml
type: custom:conx-dynamic-panel-card
entry_id: CONFIG_ENTRY_ID
compact: false
```

Required sections:

1. Header: panel name, active profile, sync badge.
2. Profile list: select, create, duplicate, rename, delete.
3. Profile editor: four labels, four actions, colors, radar, backlight, child lock, mode.
4. Live preview of the four-button panel.
5. Actions: Save Draft, Discard Changes, Sync to Panel, Pull from Panel.
6. Clear status and error area.

UI requirements:

- Mobile-first.
- English and Hebrew RTL.
- Light and dark theme support.
- No fixed colors that ignore Home Assistant theme variables, except the profile color preview itself.
- Prevent accidental loss of unsaved draft changes.
- Never write hardware directly from form field changes.

## Private frontend distribution

Do not create `hacs.json` or HACS workflows.

Preferred production design:

- The integration serves the built JavaScript from a versioned static URL.
- On setup, register the Lovelace resource only through a supported public API when available.
- If reliable automatic resource registration is not available, document the one-time manual resource step.
- `scripts/build_frontend.sh` builds and copies the artifact.
- `scripts/install_local.sh` installs the integration into a selected Home Assistant config directory.
- `scripts/update_local.sh` updates an existing installation while preserving user storage.

## Brand images

Home Assistant 2026.3 and later serve custom-integration brand images from a
`brand/` directory inside the integration, proxied through
`/api/brands/integration/<domain>/<image>`. Local files take priority over the
public brands CDN, so ConX ships its own icons instead of submitting them to the
`home-assistant/brands` repository.

Requirements:

- `custom_components/conx_dynamic_panel/brand/` holds `icon.png` (256x256),
  `icon@2x.png` (512x512), `logo.png`, and `logo@2x.png`.
- Logo shortest side is 256 for the normal file and 512 for the hDPI file.
- Images are PNG, optimized, and carry no Home Assistant branding.
- `brands/master/` keeps the master artwork and `scripts/build_brand_images.py`
  regenerates every derived file, so sizes never drift by hand.
- Do not open a `home-assistant/brands` pull request; the local `brand/`
  directory is the shipping path for this private integration.

## Repository and CI

Required files:

- `README.md`
- `AI_BUILD_SPEC.md`
- `CURSOR_CODEX_MASTER_PROMPT.md`
- `AGENTS.md`
- `.cursor/rules/conx-dynamic-panel.mdc`
- `LICENSE-PRIVATE.md`
- `CHANGELOG.md`
- `.gitignore`
- `pyproject.toml`
- backend and frontend tests

Private GitHub Actions may run:

- Python lint/type/test checks
- frontend lint/type/test/build checks
- Home Assistant validation appropriate for private custom integrations

Do not add HACS validation.

## Testing requirements

Backend tests:

- Config Flow validation.
- Duplicate mapping rejection.
- Storage creation and migration.
- Toggle action execution.
- Radio mandatory behavior.
- Radio optional behavior.
- Suppressed transitions never execute actions.
- Sync success.
- Partial sync failure preserves previous snapshot.
- Timeout handling.
- Pull and out-of-sync detection.
- Clean unload and listener removal.

Frontend tests:

- Profile loading.
- Draft editing without hardware calls.
- Dirty state handling.
- Sync request and result display.
- RTL rendering.
- Mobile layout.
- Error display.

## MVP completion criteria

1. The integration is installed manually without HACS.
2. A panel is added entirely through the UI.
3. Required entities and capabilities are validated.
4. Profiles can be created, edited, duplicated, deleted, and selected.
5. Draft edits do not affect hardware.
6. Sync applies the active profile with state confirmation.
7. Toggle, radio mandatory, and radio optional work without loops.
8. Actions execute once per real press.
9. The card works on desktop and mobile, including Hebrew RTL.
10. Tests and builds pass.
11. Documentation contains complete installation and troubleshooting instructions.
12. No public-distribution or HACS-specific files remain.
