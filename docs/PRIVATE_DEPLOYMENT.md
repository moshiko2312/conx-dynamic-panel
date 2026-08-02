# Private Deployment

## Development installation

1. Build the frontend bundle.
2. Copy `custom_components/conx_dynamic_panel/` into the target Home Assistant configuration directory under `custom_components/`.
3. Restart Home Assistant.
4. Add the integration from **Settings → Devices & services**.
5. Complete the entity mapping and validation flow.
6. Add the custom-card JavaScript resource if the integration cannot register it automatically through a supported API:
   `/conx_dynamic_panel/frontend/conx-dynamic-panel-card.js` as a Lovelace **module** resource.
   The integration attempts best-effort automatic registration on setup; keep the manual step as fallback.

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

## Troubleshooting

- **Resource 404:** rebuild with `./scripts/build_frontend.sh`, reinstall/update, restart Home Assistant, then hard-refresh the browser.
- **Sync timeouts:** raise confirm/sync timeouts in Options; verify Zigbee2MQTT and entity availability.
- **Out of sync:** hardware no longer matches the last applied snapshot. Pull, review the draft, then Sync.
- **Profiles missing after update:** never delete `.storage` files for this integration; restore from backup if storage was removed.
- **Reconfigure created a second panel:** use the Reconfigure entry action on the existing config entry (0.1.0+ updates in place).

## Customer installations

This project is private ConX software. Customer systems receive only builds and files authorized by ConX. Repository access, source sharing, and redistribution are not part of the installation process.
