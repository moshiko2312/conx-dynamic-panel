import type {
  CoverConfig,
  CoverState,
  HomeAssistant,
  PanelConfig,
  Profile,
  ProfilesExport,
} from "./types";

/** Mirrors the backend CoverConfig defaults and clamping ranges. */
export const COVER_TIME_MIN = 1;
export const COVER_TIME_MAX = 600;
export const COVER_SETTLE_MIN = 0;
export const COVER_SETTLE_MAX = 5;

export const DEFAULT_COVER: CoverConfig = {
  open_button: 1,
  close_button: 2,
  open_time_s: 20,
  close_time_s: 20,
  direction_settle_s: 0.5,
  opposite_press: "stop_only",
};

export async function fetchConfig(
  hass: HomeAssistant,
  entryId: string
): Promise<PanelConfig> {
  return hass.callWS<PanelConfig>({
    type: "conx_dynamic_panel/get_config",
    entry_id: entryId,
  });
}

export async function updateProfile(
  hass: HomeAssistant,
  entryId: string,
  profileId: string,
  profile: Profile
): Promise<Profile> {
  return hass.callWS<Profile>({
    type: "conx_dynamic_panel/update_profile",
    entry_id: entryId,
    profile_id: profileId,
    profile,
  });
}

export async function createProfile(
  hass: HomeAssistant,
  entryId: string,
  profile: Profile
): Promise<Profile> {
  return hass.callWS<Profile>({
    type: "conx_dynamic_panel/create_profile",
    entry_id: entryId,
    profile,
  });
}

export async function deleteProfile(
  hass: HomeAssistant,
  entryId: string,
  profileId: string
): Promise<void> {
  await hass.callWS({
    type: "conx_dynamic_panel/delete_profile",
    entry_id: entryId,
    profile_id: profileId,
  });
}

export async function duplicateProfile(
  hass: HomeAssistant,
  entryId: string,
  profileId: string,
  newId: string,
  newName?: string
): Promise<Profile> {
  return hass.callWS<Profile>({
    type: "conx_dynamic_panel/duplicate_profile",
    entry_id: entryId,
    profile_id: profileId,
    new_id: newId,
    new_name: newName,
  });
}

export async function setActiveProfile(
  hass: HomeAssistant,
  entryId: string,
  profileId: string,
  sync = false
): Promise<PanelConfig> {
  return hass.callWS<PanelConfig>({
    type: "conx_dynamic_panel/set_active_profile",
    entry_id: entryId,
    profile_id: profileId,
    sync,
  });
}

export async function syncPanel(
  hass: HomeAssistant,
  entryId: string
): Promise<PanelConfig> {
  return hass.callWS<PanelConfig>({
    type: "conx_dynamic_panel/sync",
    entry_id: entryId,
  });
}

export async function pullPanel(
  hass: HomeAssistant,
  entryId: string
): Promise<PanelConfig> {
  return hass.callWS<PanelConfig>({
    type: "conx_dynamic_panel/pull",
    entry_id: entryId,
  });
}

export async function exportProfiles(
  hass: HomeAssistant,
  entryId: string
): Promise<ProfilesExport> {
  return hass.callWS<ProfilesExport>({
    type: "conx_dynamic_panel/export_profiles",
    entry_id: entryId,
  });
}

export async function importProfiles(
  hass: HomeAssistant,
  entryId: string,
  payload: ProfilesExport,
  mode: "merge" | "replace" = "merge"
): Promise<PanelConfig> {
  return hass.callWS<PanelConfig>({
    type: "conx_dynamic_panel/import_profiles",
    entry_id: entryId,
    payload,
    mode,
  });
}

export async function updatePanelName(
  hass: HomeAssistant,
  entryId: string,
  panelName: string
): Promise<PanelConfig> {
  return hass.callWS<PanelConfig>({
    type: "conx_dynamic_panel/update_panel_name",
    entry_id: entryId,
    panel_name: panelName,
  });
}

/** Ask the backend safety engine to open, close, or stop the cover. */
export async function coverCommand(
  hass: HomeAssistant,
  entryId: string,
  command: "open" | "close" | "stop"
): Promise<CoverState> {
  return hass.callWS<CoverState>({
    type: "conx_dynamic_panel/cover_command",
    entry_id: entryId,
    command,
  });
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

/** Out-of-range button indexes fall back to the default, matching the backend. */
function coverButton(value: unknown, fallback: number): number {
  const parsed = Math.round(typeof value === "number" ? value : Number(value));
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 4) {
    return fallback;
  }
  return parsed;
}

/** Normalize a cover block so the editor always has complete, in-range values. */
export function normalizeCover(raw: Partial<CoverConfig> | undefined): CoverConfig {
  const source = raw || {};
  const openButton = coverButton(source.open_button, DEFAULT_COVER.open_button);
  let closeButton = coverButton(source.close_button, DEFAULT_COVER.close_button);
  if (closeButton === openButton) {
    closeButton = [1, 2, 3, 4].find((index) => index !== openButton) ?? 2;
  }
  return {
    open_button: openButton,
    close_button: closeButton,
    open_time_s: clampNumber(
      source.open_time_s,
      COVER_TIME_MIN,
      COVER_TIME_MAX,
      DEFAULT_COVER.open_time_s
    ),
    close_time_s: clampNumber(
      source.close_time_s,
      COVER_TIME_MIN,
      COVER_TIME_MAX,
      DEFAULT_COVER.close_time_s
    ),
    direction_settle_s: clampNumber(
      source.direction_settle_s,
      COVER_SETTLE_MIN,
      COVER_SETTLE_MAX,
      DEFAULT_COVER.direction_settle_s
    ),
    opposite_press:
      source.opposite_press === "stop_then_reverse" ? "stop_then_reverse" : "stop_only",
  };
}

/** Normalize legacy/partial profiles so new fields always exist in the card draft. */
export function normalizeProfile(profile: Profile): Profile {
  const cloned = structuredClone(profile);
  if (typeof cloned.backlight_brightness !== "number" || !Number.isFinite(cloned.backlight_brightness)) {
    cloned.backlight_brightness = 100;
  } else {
    cloned.backlight_brightness = Math.max(
      0,
      Math.min(100, Math.round(cloned.backlight_brightness))
    );
  }
  cloned.buttons = [1, 2, 3, 4].map((index) => {
    const found = cloned.buttons?.find((button) => button.index === index);
    return {
      index,
      name: found?.name ?? `Button ${index}`,
      action: found?.action ?? null,
      radio_member: found?.radio_member !== false,
    };
  });
  const groups = Array.isArray(cloned.radio_groups) ? cloned.radio_groups : [];
  const normalizedGroups = groups.map((group, index) => ({
    id: String(group?.id || `g${index + 1}`),
    buttons: Array.isArray(group?.buttons)
      ? group.buttons
          .map((n) => Number(n))
          .filter((n, i, arr) => n >= 1 && n <= 4 && arr.indexOf(n) === i)
      : [],
  }));
  while (normalizedGroups.length < 2) {
    normalizedGroups.push({ id: `g${normalizedGroups.length + 1}`, buttons: [] });
  }
  cloned.radio_groups = normalizedGroups;
  cloned.cover = normalizeCover(cloned.cover);
  return cloned;
}

export function cloneProfile(profile: Profile): Profile {
  return normalizeProfile(profile);
}

export function profilesEqual(a: Profile | null, b: Profile | null): boolean {
  if (!a || !b) {
    return a === b;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
