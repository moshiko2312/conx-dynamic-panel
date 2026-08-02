#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HA_CONFIG="${1:-}"

if [[ -z "$HA_CONFIG" ]]; then
  echo "Usage: $0 /path/to/homeassistant/config"
  exit 1
fi

DEST="$HA_CONFIG/custom_components/conx_dynamic_panel"
if [[ ! -d "$DEST" ]]; then
  echo "Existing installation not found at $DEST"
  echo "Use scripts/install_local.sh instead."
  exit 1
fi

if [[ ! -f "$ROOT/custom_components/conx_dynamic_panel/frontend/conx-dynamic-panel-card.js" ]]; then
  echo "Frontend bundle missing. Run scripts/build_frontend.sh first."
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP="$HA_CONFIG/custom_components/conx_dynamic_panel.backup_$STAMP"
cp -R "$DEST" "$BACKUP"

# Replace integration code only. Never touch Home Assistant .storage.
rm -rf "$DEST"
cp -R "$ROOT/custom_components/conx_dynamic_panel" "$DEST"

echo "Updated ConX Dynamic Panel at $DEST"
echo "Backup saved at $BACKUP"
echo "Home Assistant .storage was not modified."
echo "Rollback: rm -rf \"$DEST\" && mv \"$BACKUP\" \"$DEST\""
echo "Restart Home Assistant and hard-refresh the browser after frontend changes."
