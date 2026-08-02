#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HA_CONFIG="${1:-}"

if [[ -z "$HA_CONFIG" ]]; then
  echo "Usage: $0 /path/to/homeassistant/config"
  exit 1
fi

if [[ ! -d "$HA_CONFIG" ]]; then
  echo "Home Assistant config directory does not exist: $HA_CONFIG"
  exit 1
fi

if [[ ! -f "$ROOT/custom_components/conx_dynamic_panel/frontend/conx-dynamic-panel-card.js" ]]; then
  echo "Frontend bundle missing. Run scripts/build_frontend.sh first."
  exit 1
fi

DEST="$HA_CONFIG/custom_components/conx_dynamic_panel"
mkdir -p "$HA_CONFIG/custom_components"
rm -rf "$DEST"
cp -R "$ROOT/custom_components/conx_dynamic_panel" "$DEST"

echo "Installed ConX Dynamic Panel to $DEST"
echo "Next steps:"
echo "1. Restart Home Assistant."
echo "2. Add the integration from Settings → Devices & services."
echo "3. If the card is not available, add a Lovelace resource:"
echo "   /conx_dynamic_panel/frontend/conx-dynamic-panel-card.js (module)"
echo "   or copy the JS into www/ and register /local/conx_dynamic_panel/conx-dynamic-panel-card.js?v=0.1.0"
