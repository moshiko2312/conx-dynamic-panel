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
  id: "cover_1",
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

/** Ask the backend safety engine to open, close, or stop a cover. */
export async function coverCommand(
  hass: HomeAssistant,
  entryId: string,
  command: "open" | "close" | "stop",
  coverId?: string
): Promise<CoverState> {
  const msg: Record<string, unknown> = {
    type: "conx_dynamic_panel/cover_command",
    entry_id: entryId,
    command,
  };
  if (coverId) {
    msg.cover_id = coverId;
  }
  return hass.callWS<CoverState>(msg);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

export function clampGangCount(value: unknown): number {
  return Math.round(clampNumber(value, 1, 4, 4));
}

/** Modes that need at least two physical buttons (radio exclusivity / cover pair). */
const MULTI_BUTTON_MODES = new Set([
  "radio_mandatory",
  "radio_optional",
  "radio_split",
  "cover",
]);

export const PULSE_TIME_MIN = 0.1;
export const PULSE_TIME_MAX = 600;
export const DEFAULT_PULSE_TIME = 2;

export const BUTTON_ROLES = [
  "toggle",
  "momentary",
  "radio",
  "cover_open",
  "cover_close",
] as const;

const MULTI_BUTTON_ROLES = new Set(["radio", "cover_open", "cover_close"]);

export function clampPulseTime(value: unknown, fallback = DEFAULT_PULSE_TIME): number {
  return clampNumber(value, PULSE_TIME_MIN, PULSE_TIME_MAX, fallback);
}

export function normalizeButtonRole(
  value: unknown,
  legacyPressMode?: unknown
): (typeof BUTTON_ROLES)[number] {
  const role = String(value || "").trim().toLowerCase();
  if ((BUTTON_ROLES as readonly string[]).includes(role)) {
    return role as (typeof BUTTON_ROLES)[number];
  }
  const legacy = String(legacyPressMode || "").trim().toLowerCase();
  if (legacy === "momentary") {
    return "momentary";
  }
  return "toggle";
}

export function rolesForGangCount(gangCount: number): string[] {
  if (clampGangCount(gangCount) > 1) {
    return [...BUTTON_ROLES];
  }
  return BUTTON_ROLES.filter((role) => !MULTI_BUTTON_ROLES.has(role));
}

export function isMultiButtonMode(mode: string): boolean {
  return MULTI_BUTTON_MODES.has(mode);
}

/** Filter capability modes for the picker: 1-gang only offers toggle (and other 1-button-safe modes). */
export function modesForGangCount(
  modes: readonly string[],
  gangCount: number
): string[] {
  if (clampGangCount(gangCount) > 1) {
    return [...modes];
  }
  return modes.filter((mode) => !isMultiButtonMode(mode));
}

/** Coerce radio/cover down to toggle when the profile is 1-gang. */
export function coerceModeForGangCount(
  mode: string,
  gangCount: number
): string {
  if (clampGangCount(gangCount) === 1 && isMultiButtonMode(mode)) {
    return "toggle";
  }
  return mode;
}

export function maxCoversForGangs(gangCount: number): number {
  return Math.max(0, Math.floor(clampGangCount(gangCount) / 2));
}

function defaultCoverPair(slot: number, gangCount: number): [number, number] {
  const openButton = slot * 2 + 1;
  const closeButton = slot * 2 + 2;
  if (closeButton > gangCount) {
    return [1, gangCount >= 2 ? 2 : 1];
  }
  return [openButton, closeButton];
}

/** Out-of-range button indexes fall back to the default, matching the backend. */
function coverButton(value: unknown, fallback: number, gangCount: number): number {
  const parsed = Math.round(typeof value === "number" ? value : Number(value));
  const limit = clampGangCount(gangCount);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > limit) {
    return Math.min(fallback, limit);
  }
  return parsed;
}

/** Normalize a cover block so the editor always has complete, in-range values. */
export function normalizeCover(
  raw: Partial<CoverConfig> | undefined,
  options: { gangCount?: number; defaultId?: string; slot?: number } = {}
): CoverConfig {
  const gangCount = clampGangCount(options.gangCount ?? 4);
  const slot = options.slot ?? 0;
  const defaultId = options.defaultId ?? `cover_${slot + 1}`;
  const [openDefault, closeDefault] = defaultCoverPair(slot, gangCount);
  const source = raw || {};
  const openButton = coverButton(source.open_button, openDefault, gangCount);
  let closeButton = coverButton(source.close_button, closeDefault, gangCount);
  if (closeButton === openButton) {
    closeButton =
      Array.from({ length: gangCount }, (_, i) => i + 1).find((index) => index !== openButton) ??
      Math.min(openButton + 1, gangCount);
  }
  return {
    id: String(source.id || "").trim() || defaultId,
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

/** Normalize legacy ``cover`` or modern ``covers[]`` into a cover list. */
export function normalizeCovers(
  profile: Pick<Profile, "covers" | "cover" | "gang_count"> | undefined
): CoverConfig[] {
  const gangCount = clampGangCount(profile?.gang_count ?? 4);
  const maxCovers = maxCoversForGangs(gangCount);
  let covers: CoverConfig[] = [];
  if (Array.isArray(profile?.covers) && profile!.covers!.length) {
    covers = profile!.covers!.map((item, index) =>
      normalizeCover(item, { gangCount, defaultId: `cover_${index + 1}`, slot: index })
    );
  } else if (profile?.cover) {
    covers = [normalizeCover(profile.cover, { gangCount, defaultId: "cover_1", slot: 0 })];
  } else if (maxCovers > 0) {
    covers = [normalizeCover(undefined, { gangCount, defaultId: "cover_1", slot: 0 })];
  }
  if (maxCovers === 0) {
    return [];
  }
  covers = covers.slice(0, maxCovers);
  const seen = new Set<string>();
  return covers.map((cover, index) => {
    let id = cover.id || `cover_${index + 1}`;
    let suffix = 2;
    while (seen.has(id)) {
      id = `${cover.id || `cover_${index + 1}`}_${suffix}`;
      suffix += 1;
    }
    seen.add(id);
    return { ...cover, id };
  });
}

/** Normalize legacy/partial profiles so new fields always exist in the card draft. */
export function normalizeProfile(profile: Profile): Profile {
  const cloned = structuredClone(profile);
  cloned.gang_count = clampGangCount(cloned.gang_count ?? 4);
  let mode = String(cloned.mode || "toggle");
  if (mode === "momentary_mix") {
    mode = "mixed";
  }
  cloned.mode = coerceModeForGangCount(mode, cloned.gang_count) as Profile["mode"];
  if (typeof cloned.backlight_brightness !== "number" || !Number.isFinite(cloned.backlight_brightness)) {
    cloned.backlight_brightness = 100;
  } else {
    cloned.backlight_brightness = Math.max(
      0,
      Math.min(100, Math.round(cloned.backlight_brightness))
    );
  }
  const allowedRoles = new Set(rolesForGangCount(cloned.gang_count));
  cloned.buttons = [1, 2, 3, 4].map((index) => {
    const found = cloned.buttons?.find((button) => button.index === index);
    let role = normalizeButtonRole(found?.role, (found as { press_mode?: string } | undefined)?.press_mode);
    if (!allowedRoles.has(role)) {
      role = "toggle";
    }
    return {
      index,
      name: found?.name ?? `Button ${index}`,
      action: found?.action ?? null,
      radio_member: found?.radio_member !== false,
      role,
      pulse_time_s: clampPulseTime(found?.pulse_time_s, DEFAULT_PULSE_TIME),
      cover_id:
        role === "cover_open" || role === "cover_close"
          ? String(found?.cover_id || "cover_1").trim() || "cover_1"
          : null,
    };
  });
  const groups = Array.isArray(cloned.radio_groups) ? cloned.radio_groups : [];
  const radioIndexes = new Set(
    cloned.buttons
      .filter((button) => button.role === "radio" && button.index <= cloned.gang_count)
      .map((button) => button.index)
  );
  const normalizedGroups = groups.map((group, index) => ({
    id: String(group?.id || `g${index + 1}`),
    buttons: Array.isArray(group?.buttons)
      ? group.buttons
          .map((n) => Number(n))
          .filter(
            (n, i, arr) =>
              n >= 1 &&
              n <= cloned.gang_count &&
              arr.indexOf(n) === i &&
              (cloned.mode !== "mixed" || radioIndexes.has(n))
          )
      : [],
  }));
  while (normalizedGroups.length < 2) {
    normalizedGroups.push({ id: `g${normalizedGroups.length + 1}`, buttons: [] });
  }
  cloned.radio_groups = normalizedGroups;
  cloned.covers = normalizeCovers(cloned);
  delete cloned.cover;
  if (
    cloned.selected_button != null &&
    (cloned.selected_button < 1 || cloned.selected_button > cloned.gang_count)
  ) {
    cloned.selected_button = null;
  }
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
