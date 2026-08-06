/** Helpers for Home Assistant service / entity pickers in the Lovelace card. */

export type HassServicesMap = Record<string, Record<string, unknown>>;

/** List `domain.service` ids from `hass.services`, sorted. */
export function listServiceActions(
  services: HassServicesMap | undefined | null
): string[] {
  if (!services) {
    return [];
  }
  const actions: string[] = [];
  for (const domain of Object.keys(services).sort()) {
    const domainServices = services[domain];
    if (!domainServices || typeof domainServices !== "object") {
      continue;
    }
    for (const service of Object.keys(domainServices).sort()) {
      actions.push(`${domain}.${service}`);
    }
  }
  return actions;
}

/** Domain portion of `domain.service`, or null. */
export function actionDomain(action: string | null | undefined): string | null {
  if (!action) {
    return null;
  }
  const trimmed = action.trim();
  const dot = trimmed.indexOf(".");
  if (dot <= 0 || dot === trimmed.length - 1) {
    return null;
  }
  return trimmed.slice(0, dot);
}

/** Entity ids from `hass.states`, optionally filtered to one domain. */
export function listEntityIds(
  states: Record<string, unknown> | undefined | null,
  domain?: string | null
): string[] {
  if (!states) {
    return [];
  }
  const needle = domain?.trim() || null;
  return Object.keys(states)
    .filter((entityId) => {
      if (!needle) {
        return true;
      }
      return entityId.startsWith(`${needle}.`);
    })
    .sort();
}

/** True when HA has registered its native entity picker element. */
export function isHaEntityPickerRegistered(): boolean {
  return (
    typeof customElements !== "undefined" &&
    typeof customElements.get === "function" &&
    !!customElements.get("ha-entity-picker")
  );
}

/**
 * Best-effort preload of `ha-entity-picker` via Lovelace card helpers.
 * Returns true when the element is available afterwards.
 */
export async function ensureHaEntityPickerLoaded(): Promise<boolean> {
  if (isHaEntityPickerRegistered()) {
    return true;
  }
  const loadHelpers = (
    globalThis as unknown as { loadCardHelpers?: () => Promise<unknown> }
  ).loadCardHelpers;
  if (typeof loadHelpers !== "function") {
    return false;
  }
  try {
    const helpers = (await loadHelpers()) as {
      createCardElement?: (config: Record<string, unknown>) => Promise<{
        constructor: { getConfigElement?: () => Promise<unknown> };
      }>;
    };
    const card = await helpers.createCardElement?.({
      type: "entities",
      entities: [],
    });
    await card?.constructor.getConfigElement?.();
  } catch {
    // Fall back to native selects when HA internals are unavailable.
  }
  return isHaEntityPickerRegistered();
}

/** Merge a current value into an options list when it is missing. */
export function withCurrentOption(
  options: string[],
  current: string | null | undefined
): string[] {
  const value = current?.trim() || "";
  if (!value || options.includes(value)) {
    return options;
  }
  return [value, ...options];
}
