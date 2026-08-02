# ConX Dynamic Panel

Transform a supported multi-button smart switch into a configurable, multi-profile control panel for Home Assistant.

ConX Dynamic Panel is a Home Assistant custom integration with a built-in Lovelace custom card. It allows one physical 4-button Zemismart panel to represent multiple virtual pages/profiles. Each profile can change the four displayed names, ON/OFF colors, radar timeout, backlight behavior, and button logic.

## Project status

Initial development specification / MVP.

## Core idea

A physical panel has four relays and four editable text labels. The relays are not connected to electrical loads; they are used only as physical input and LED state indicators.

The same four buttons can therefore represent different controls depending on the active profile.

Example:

| Profile | L1 | L2 | L3 | L4 |
|---|---|---|---|---|
| Lighting | Living room | Kitchen | Outdoor | All off |
| Climate | Living AC | Bedroom AC | All AC | ECO |
| Scenes | Morning | Evening | Hosting | Night |
| Security | Arm home | Arm away | Disarm | Panic |

Profile editing is performed inside Home Assistant. Changes remain in a draft until the user presses **Sync to Panel**.

## Supported device for MVP

Zemismart 4-button smart screen switch exposed through Zigbee2MQTT and Home Assistant entities.

Default entity mapping used during development:

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

The integration must not hard-code these entity IDs. The user selects them in the config flow.

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

### Supported radar values

```text
none
10s
20s
30s
45s
60s
```

## Main features

- UI-based setup through Home Assistant Config Flow.
- Support for multiple physical panels.
- Unlimited profiles per panel.
- Four configurable button names per profile.
- Configurable ON and OFF colors per profile.
- Radar timeout, backlight, and child-lock settings.
- Toggle and Radio button modes.
- Optional Mixed mode in a later release.
- Draft editing separated from the running panel state.
- Manual **Sync to Panel** operation.
- Sync state: `synced`, `pending`, `syncing`, `error`, `out_of_sync`.
- Pull current hardware display/settings into a profile.
- Activate a profile from the card, service call, automation, or script.
- Lovelace editor and live preview.
- Import/export profile JSON in a later release.
- Adapter architecture for future panel models.

## Button modes

### Toggle

All four buttons are independent. Every physical state change is treated as a press. The configured action is executed once per physical state change.

The integration must not automatically reset a relay in Toggle mode.

### Radio mandatory

Only one button may remain ON.

When a button changes to ON:

1. Execute its action.
2. Turn the other radio-group relays OFF.
3. Keep the selected relay ON.

When the active button is physically pressed and changes to OFF, restore it to ON without executing the action again.

### Radio optional

Only one button may be ON, but all buttons may also be OFF.

When a button changes to ON:

1. Execute its action.
2. Turn all other radio-group relays OFF.

When the active button changes to OFF, leave all buttons OFF.

### Preventing feedback loops

Home Assistant state changes caused by the integration itself must not be interpreted as physical button presses.

Implement a per-entity suppression mechanism. Before the integration writes a relay state, record the expected target state and an expiry timestamp. Ignore the matching state transition while the suppression entry is valid.

Do not rely only on delays.

## Draft and sync model

Each profile has two representations:

- **Draft**: the editable configuration stored by the integration.
- **Applied snapshot**: the last configuration successfully written to the physical panel.

Changing a draft marks the panel/profile as `pending`. No device entity is changed while editing.

Pressing **Sync to Panel** writes, in this order:

1. `text.name_l1`
2. `text.name_l2`
3. `text.name_l3`
4. `text.name_l4`
5. `select.switch_color_off`
6. `select.switch_color_on`
7. `select.radar_config`
8. `switch.backlight_mode`
9. `switch.child_lock`
10. Relay states required by the profile's button mode

Writes should be sequential, with state confirmation and a configurable timeout. A failed write must set sync status to `error` and expose a useful error message.

## Home Assistant entities created by the integration

Suggested entities per configured panel:

```text
select.<panel>_active_profile
sensor.<panel>_sync_status
sensor.<panel>_last_sync
sensor.<panel>_last_error
button.<panel>_sync
button.<panel>_pull_from_panel
switch.<panel>_auto_sync
```

Optional event entity:

```text
event.<panel>_button
```

Event attributes:

```yaml
panel_id: kitchen_panel
profile_id: lighting
button: 2
button_name: Kitchen
mode: toggle
new_relay_state: "on"
```

## Services

```yaml
conx_dynamic_panel.sync
conx_dynamic_panel.activate_profile
conx_dynamic_panel.pull_from_panel
conx_dynamic_panel.execute_button
conx_dynamic_panel.reload
```

Example:

```yaml
action: conx_dynamic_panel.activate_profile
data:
  entry_id: YOUR_CONFIG_ENTRY_ID
  profile_id: scenes
  sync: true
```

## Action model

A button action is stored as a Home Assistant service call structure, not arbitrary Python or templates.

```json
{
  "action": "light.toggle",
  "target": {
    "entity_id": "light.living_room"
  },
  "data": {}
}
```

Supported MVP action targets:

- Entity service call
- Scene activation
- Script execution
- Automation trigger
- Generic Home Assistant action/service call

The frontend should provide presets, but the backend must store and execute the normalized Home Assistant action structure.

## Repository structure

The frontend card is bundled inside the integration repository so the project can be distributed as one HACS integration.

```text
conx-dynamic-panel/
├── custom_components/
│   └── conx_dynamic_panel/
│       ├── __init__.py
│       ├── manifest.json
│       ├── const.py
│       ├── config_flow.py
│       ├── coordinator.py
│       ├── runtime.py
│       ├── storage.py
│       ├── services.yaml
│       ├── strings.json
│       ├── translations/
│       │   ├── en.json
│       │   └── he.json
│       ├── adapters/
│       │   ├── __init__.py
│       │   ├── base.py
│       │   └── zemismart_4gang.py
│       ├── select.py
│       ├── sensor.py
│       ├── button.py
│       ├── switch.py
│       ├── event.py
│       └── frontend/
│           └── conx-dynamic-panel-card.js
├── frontend-src/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── conx-dynamic-panel-card.ts
│       ├── conx-dynamic-panel-editor.ts
│       ├── api.ts
│       ├── types.ts
│       └── styles.ts
├── tests/
├── .github/workflows/
│   ├── hassfest.yml
│   ├── hacs.yml
│   ├── pytest.yml
│   └── frontend.yml
├── hacs.json
├── pyproject.toml
├── README.md
├── LICENSE
└── CHANGELOG.md
```

## Installation during development

1. Copy `custom_components/conx_dynamic_panel` into Home Assistant's `config/custom_components/` directory.
2. Restart Home Assistant.
3. Add the integration from **Settings → Devices & services → Add integration**.
4. Select the relay, name, color, radar, backlight, and child-lock entities.
5. Add the frontend resource:

```text
/conx_dynamic_panel_static/conx-dynamic-panel-card.js
```

Resource type: `JavaScript Module`.

6. Add a manual card:

```yaml
type: custom:conx-dynamic-panel-card
entry_id: YOUR_CONFIG_ENTRY_ID
```

## Development principles

- UI setup only; no YAML configuration for the integration.
- Fully asynchronous backend.
- No direct MQTT dependency in the MVP; communicate through Home Assistant entities.
- Never hard-code user entity IDs.
- Avoid private Home Assistant frontend/backend APIs where a public API exists.
- All user-visible strings must support translations.
- Mobile-first, RTL-aware, and compatible with light/dark themes.
- Do not execute untrusted code or arbitrary templates stored by users.
- Keep hardware-specific behavior inside adapters.
- Add tests for state-change suppression, radio behavior, profile activation, storage migration, and failed sync recovery.

## MVP acceptance criteria

The MVP is complete when:

1. A user can add a panel entirely through the UI.
2. The integration validates all required entity domains and capabilities.
3. A user can create at least two profiles.
4. Each profile supports four names, ON/OFF colors, radar, backlight, child lock, and four actions.
5. Editing does not immediately modify the physical panel.
6. Sync applies the selected profile and reports success/failure.
7. Activating another profile can optionally sync it immediately.
8. Toggle mode executes exactly once per physical state change.
9. Radio mandatory and optional modes behave as specified without event loops.
10. The custom card works on desktop and mobile, including Hebrew RTL.
11. Backend and frontend tests pass.
12. Hassfest and HACS validation pass.

## Planned roadmap

### v0.1.0

- Config Flow
- Zemismart adapter
- Profile storage
- Toggle mode
- Manual sync
- Basic card

### v0.2.0

- Radio mandatory/optional
- Pull from panel
- Better sync diagnostics
- Hebrew translation

### v0.3.0

- Mixed mode
- Import/export
- Profile duplication
- Sync all panels

### Later

- Multi-click experiments
- Automatic profile conditions
- Additional manufacturers/adapters
- Profile library
- Advanced device preview

## License

Choose a license before the first public release. MIT is recommended for a permissive open-source project.
