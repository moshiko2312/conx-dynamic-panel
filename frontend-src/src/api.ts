import type { HomeAssistant, PanelConfig, Profile, ProfilesExport } from "./types";

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
