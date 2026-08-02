# ConX Dynamic Panel

Private commercial Home Assistant project for ConX.

ConX Dynamic Panel transforms a supported multi-button smart switch into a configurable, multi-profile control panel. A single physical 4-button Zemismart panel can represent many virtual profiles, with different button names, actions, colors, radar settings, and button behavior.

> **Private software:** This repository is intended only for ConX business use. It is not prepared for HACS, public distribution, resale, or third-party redistribution.

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
- Draft configuration separated from applied hardware state.
- Manual **Sync to Panel**.
- Sync status: `synced`, `pending`, `syncing`, `error`, `out_of_sync`.
- Pull hardware state into the current profile.
- Profile activation from the card, services, scripts, and automations.
- Bundled private Lovelace custom card.
- English and Hebrew RTL UI.
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

Zero or one button may remain ON.

When a button changes to ON:

1. Execute its action.
2. Turn the other buttons OFF.

If the selected button changes to OFF, leave all buttons OFF.

### Feedback-loop protection

Every integration-generated relay change must be registered in a per-entity suppression tracker before the service call. A matching expected transition is ignored by the physical-press handler. Do not depend only on delays.

## Draft and sync model

Each profile has:

- **Draft:** editable configuration stored by the integration.
- **Applied snapshot:** the last configuration successfully written to the physical panel.

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

## Repository structure

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
├── docs/
├── examples/
├── tests/
├── scripts/
│   ├── build_frontend.sh
│   ├── install_local.sh
│   └── update_local.sh
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

1. Build the frontend.
2. Copy `custom_components/conx_dynamic_panel` to the target Home Assistant configuration under `custom_components/`.
3. Restart Home Assistant.
4. Add **ConX Dynamic Panel** from **Settings → Devices & services**.
5. Select all mapped entities.
6. Add the bundled JavaScript resource if it is not registered automatically.
7. Add the card:

```yaml
type: custom:conx-dynamic-panel-card
entry_id: YOUR_CONFIG_ENTRY_ID
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
10. The custom card works on desktop and mobile, including Hebrew RTL.
11. Backend and frontend tests pass.

## Roadmap

### v0.1.0

- Config Flow
- Zemismart adapter
- Profile storage
- Toggle mode
- Manual sync
- Basic custom card

### v0.2.0

- Radio mandatory and optional
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
- Additional panel adapters
- Internal ConX profile library
- Advanced preview

## Ownership

Copyright © ConX. All rights reserved.

See `LICENSE-PRIVATE.md`.
