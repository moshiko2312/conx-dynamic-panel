# Private Deployment

## Development installation

1. **Build the frontend bundle.**

   ```bash
   ./scripts/build_frontend.sh
   ```

   This installs locked dependencies, runs type checks and tests, builds the
   production bundle, and copies it to
   `custom_components/conx_dynamic_panel/frontend/`.

2. **Install the component.** Either run the script:

   ```bash
   ./scripts/install_local.sh /path/to/homeassistant/config
   ```

   or copy `custom_components/conx_dynamic_panel/` into the target Home
   Assistant configuration directory under `custom_components/`. Copy the whole
   directory: it carries the built card in `frontend/` and the brand images in
   `brand/`.

3. **Restart Home Assistant.** Python integration files are only read at start-up.

4. **Add the integration** from **Settings → Devices & services → Add
   integration → ConX Dynamic Panel**.

5. **Complete the entity mapping and validation flow.** Map the four relay
   `switch` entities, the four name `text` entities, and the shared `select` /
   `switch` settings entities. The flow validates availability and domains, then
   asks for explicit confirmation on the summary step.

6. **Add the card resource** if the integration cannot register it automatically
   through a supported API: add
   `/conx_dynamic_panel/frontend/conx-dynamic-panel-card.js` as a Lovelace
   **module** resource. The integration attempts best-effort automatic
   registration on setup; keep the manual step as a fallback.

7. **Add the card** to a dashboard:

   ```yaml
   type: custom:conx-dynamic-panel-card
   entry_id: YOUR_CONFIG_ENTRY_ID
   # optional: compact: true
   # optional: language: he   # en | he | ru
   ```

8. **Hard-refresh the browser** so the new card bundle and brand images are
   fetched instead of cached copies.

## Brand icons

`custom_components/conx_dynamic_panel/brand/` ships `icon.png` (256x256),
`icon@2x.png` (512x512), `logo.png` (664x256), and `logo@2x.png` (1329x512).

- **Home Assistant 2026.3 and later** serve these automatically through
  `/api/brands/integration/conx_dynamic_panel/...`, and local files take priority
  over the public brands CDN. No configuration and no manifest change is needed.
- **Older Home Assistant versions** have no supported local override. The
  frontend loads integration icons directly from `brands.home-assistant.io`, so
  a generic puzzle-piece icon appears until the domain is published there. ConX
  does not publish to the public brands repository, so the only fix is to
  upgrade Home Assistant.
- Brand images are cached by the browser. After an update, restart Home
  Assistant and hard-refresh before reporting a missing icon.
- Never resize the files by hand. Edit the masters in `brands/master/` and run
  `python3 scripts/build_brand_images.py` (requires Pillow) to regenerate every
  size, including the `brands/custom_integrations/conx_dynamic_panel/` mirror.

## Draft and sync model

Understanding this model prevents most "the panel did not change" reports.

- Editing anything in the card changes only the **draft** and moves the sync
  status to `pending`. Hardware is untouched.
- **Sync to Panel** writes the draft to the device in order (names, OFF colour,
  ON colour, radar, backlight, child lock, relay state), confirming each write
  from Home Assistant state with a timeout. On success the draft becomes the
  **applied snapshot**.
- A failed sync sets status `error`, preserves the previous applied snapshot,
  and exposes the failure on the last-error sensor.
- **Pull from Panel** reads current hardware values into the draft. If they
  differ from the applied snapshot the status becomes `out_of_sync`.
- Enabling the auto-sync switch is the only way draft edits reach hardware
  without pressing Sync.

### Switching profiles from automations

`conx_dynamic_panel.activate_profile` updates the stored draft. The physical
panel only changes when the call also syncs, so automations must pass
`sync: true`:

```yaml
action: conx_dynamic_panel.activate_profile
data:
  entry_id: YOUR_CONFIG_ENTRY_ID
  profile_id: scenes
  sync: true
```

The card's hamburger menu has an **Automation example** entry that opens a
copy-ready automation for switching profiles by time of day, pre-filled with the
panel's own `entry_id` and profile ids. The same example is committed to
`examples/automations.yaml` as `conx_profile_by_time_of_day`.

## Card overview for installers

- **Hamburger menu** opens a centered settings modal: language (Hebrew / English
  / Russian, RTL for Hebrew), theme (**Noir gray** / **Ivory cool**), the
  export/import wizard, and the automation example.
- **Hero faceplate** shows the four LED rings left to right using the draft
  `color_on` / `color_off`, with the active profile name centered above.
- **Profiles tab:** profile chips, editable panel and profile names, Create /
  Duplicate / Delete.
- **Appearance tab:** mode, ON/OFF colours, radar timeout, backlight with
  brightness dimmer, child lock.
- **Buttons tab:** collapsible per-button editors. In **Radio split** mode a
  single **Radio groups** collapse switch controls the whole block; membership
  is set by tapping the L1–L4 chips, and the collapsed header shows a one-line
  recap of the assignments.
- **Export** downloads a profiles JSON file; **Import (merge)** and
  **Import (replace)** go through the authenticated WebSocket API and reject
  future schema versions.

## Production update rules

- Back up the Home Assistant configuration and `.storage` directory before a major update.
- Never delete ConX Dynamic Panel storage during an update.
- Replace integration code and the bundled frontend artifact together so backend and frontend versions match.
- Restart Home Assistant after updating Python integration files.
- Hard-refresh the browser or update the resource URL version after frontend changes.
- Run storage migrations automatically and atomically.
- If migration fails, keep the previous storage file and surface a clear repair message.

## Intended scripts

### `scripts/build_frontend.sh`

- Install locked frontend dependencies.
- Run type checks and tests.
- Build the production JavaScript bundle.
- Copy it to `custom_components/conx_dynamic_panel/frontend/`.

### `scripts/install_local.sh`

- Accept a Home Assistant config path.
- Validate that the destination exists.
- Copy the integration without deleting user storage.
- Print the exact restart and resource steps.

### `scripts/update_local.sh`

- Accept a Home Assistant config path.
- Create a timestamped backup of the installed integration directory.
- Copy the new code and frontend bundle.
- Preserve `.storage` and all Home Assistant configuration.
- Print rollback instructions.

### `scripts/build_brand_images.py`

- Read the master artwork from `brands/master/`.
- Render `icon.png`, `icon@2x.png`, `logo.png`, and `logo@2x.png` at the sizes
  Home Assistant requires.
- Write them to the integration `brand/` directory and the
  `brands/custom_integrations/conx_dynamic_panel/` mirror.
- Requires Pillow; it is a design-time tool and is not a runtime dependency.

## Troubleshooting

- **Sync timeouts / color stays unchanged:** raise Confirm timeout and Sync timeout in the integration Options (defaults are now 20s / 90s). In Developer Tools → States, open `select.*_switch_color_off` / `_color_on` and confirm the `options` list includes the color you want (e.g. `warm_white` vs `Warm White`). Try `select.select_option` manually; if the state does not change, fix Zigbee2MQTT / the entity before Syncing from ConX.
- **Resource 404:** rebuild with `./scripts/build_frontend.sh`, reinstall/update, restart Home Assistant, then hard-refresh the browser.
- **Out of sync:** hardware no longer matches the last applied snapshot. Pull, review the draft, then Sync.
- **Profiles missing after update:** never delete `.storage` files for this integration; restore from backup if storage was removed.
- **Reconfigure created a second panel:** use the Reconfigure entry action on the existing config entry (0.1.0+ updates in place).
- **Generic integration icon:** expected on Home Assistant older than 2026.3. On 2026.3+ confirm `brand/icon.png` was copied with the integration, restart, and hard-refresh the browser.
- **Automation changes the profile but not the panel:** the call is missing `sync: true`; activation alone only updates the draft.

## Customer installations

This project is private ConX software. Customer systems receive only builds and files authorized by ConX. Repository access, source sharing, and redistribution are not part of the installation process.
