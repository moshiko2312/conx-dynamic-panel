#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/frontend-src"
DEST="$ROOT/custom_components/conx_dynamic_panel/frontend"

cd "$SRC"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi
npm run lint
npm test
npm run build

mkdir -p "$DEST"
cp -f "$SRC/dist/conx-dynamic-panel-card.js" "$DEST/conx-dynamic-panel-card.js"
if [[ -f "$SRC/dist/conx-dynamic-panel-card.js.map" ]]; then
  cp -f "$SRC/dist/conx-dynamic-panel-card.js.map" "$DEST/conx-dynamic-panel-card.js.map"
fi

echo "Frontend bundle copied to $DEST/conx-dynamic-panel-card.js"
