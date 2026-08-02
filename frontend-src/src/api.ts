import type { HomeAssistant, PanelConfig, Profile } from "./types";

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

export function cloneProfile(profile: Profile): Profile {
  return structuredClone(profile);
}

export function profilesEqual(a: Profile | null, b: Profile | null): boolean {
  if (!a || !b) {
    return a === b;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}
