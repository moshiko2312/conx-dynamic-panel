# Architecture

## Data flow

```text
Zemismart / Zigbee2MQTT entities
              ↓
      Panel adapter layer
              ↓
 Runtime + suppression + profile engine
              ↓
 Storage / entities / services / WebSocket API
              ↓
      ConX Dynamic Panel card
```

## Backend responsibilities

### Config entry

Stores installer-selected entity mappings and adapter type.

### Versioned storage

Stores profiles, active profile, applied snapshot, last sync, and last error. Migrations must be explicit and preserve user data.

### Runtime object

Owns adapter, async locks, suppression tracker, state subscriptions, sync state, and unload callbacks.

### Adapter

Performs all device-specific validation, reads, writes, and confirmation waits through Home Assistant services and states.

### Profile engine

Handles Toggle, Radio Mandatory, and Radio Optional behavior. It receives only unsuppressed physical transitions.

### Sync engine

Compares draft and applied snapshot, writes settings sequentially, confirms each state, and commits the new snapshot only after complete success.

### Home Assistant entities

Expose active profile, sync status, last sync, last error, sync button, pull button, and auto-sync switch.

### WebSocket API

Provides authenticated profile CRUD and synchronization commands to the custom card. Configuration-changing commands require administrator permission.

## Frontend responsibilities

- Load profile and panel data through the integration API.
- Maintain local unsaved draft state.
- Never call mapped hardware entities directly.
- Save drafts through backend validation.
- Trigger explicit Sync or Pull operations.
- Show live preview, pending state, errors, and synchronization progress.
- Support mobile layouts and Hebrew RTL.

## State ownership

- Hardware entities own current physical values.
- Draft storage owns user-edited intended configuration.
- Applied snapshot owns the last completely successful synchronization.
- The frontend owns temporary unsaved form edits only.

## Failure rules

- Partial sync never replaces the previous applied snapshot.
- A timeout or unavailable entity produces a useful error.
- Listener and service exceptions must not crash Home Assistant.
- Updates must preserve storage.
- Integration-generated relay changes must be suppressed before service calls.

## Extensibility

New panel models implement the adapter contract without changing card behavior or profile storage. Adapter-specific supported values and capability flags are exposed to the frontend through the backend API.
