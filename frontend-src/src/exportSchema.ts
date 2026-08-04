/** Portable profiles export schema shared by the Lit card and standalone wizard. */

import type { Profile, ProfilesExport } from "./types";

/** Must match custom_components/conx_dynamic_panel/const.py STORAGE_VERSION. */
export const PROFILES_EXPORT_SCHEMA_VERSION = 2;

const MODES = new Set(["toggle", "radio_mandatory", "radio_optional", "radio_split", "cover"]);

function normalizeRadioGroups(raw: unknown): Profile["radio_groups"] {
  const groups: NonNullable<Profile["radio_groups"]> = [];
  if (Array.isArray(raw)) {
    raw.forEach((item, index) => {
      if (!isRecord(item)) return;
      const buttons: number[] = [];
      const rawButtons = Array.isArray(item.buttons) ? item.buttons : [];
      for (const value of rawButtons) {
        const n = Number(value);
        if (n >= 1 && n <= 4 && !buttons.includes(n)) buttons.push(n);
      }
      groups.push({ id: String(item.id || `g${index + 1}`), buttons });
    });
  }
  while (groups.length < 2) {
    groups.push({ id: `g${groups.length + 1}`, buttons: [] });
  }
  return groups;
}

export type ProfilesExportValidation =
  | { ok: true; payload: ProfilesExport }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeProfiles(
  raw: unknown
): { ok: true; profiles: Record<string, Profile> } | { ok: false; error: string } {
  if (isRecord(raw)) {
    const entries = Object.entries(raw);
    if (!entries.length) {
      return { ok: false, error: "profiles must be a non-empty object or array" };
    }
    const profiles: Record<string, Profile> = {};
    for (const [key, value] of entries) {
      const parsed = parseProfile(value, key);
      if (!parsed.ok) {
        return parsed;
      }
      profiles[parsed.profile.id] = parsed.profile;
    }
    return { ok: true, profiles };
  }

  if (Array.isArray(raw)) {
    if (!raw.length) {
      return { ok: false, error: "profiles must be a non-empty object or array" };
    }
    const profiles: Record<string, Profile> = {};
    for (let index = 0; index < raw.length; index += 1) {
      const parsed = parseProfile(raw[index], undefined);
      if (!parsed.ok) {
        return { ok: false, error: `${parsed.error} (index ${index})` };
      }
      profiles[parsed.profile.id] = parsed.profile;
    }
    return { ok: true, profiles };
  }

  return { ok: false, error: "profiles must be a non-empty object or array" };
}

function parseProfile(
  value: unknown,
  fallbackId: string | undefined
): { ok: true; profile: Profile } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: "each profile must be an object" };
  }
  const id = String(value.id || fallbackId || "").trim();
  if (!id) {
    return { ok: false, error: "profile is missing id" };
  }
  const mode = String(value.mode || "toggle");
  if (!MODES.has(mode)) {
    return { ok: false, error: `unsupported mode for profile ${id}: ${mode}` };
  }
  const buttonsRaw = Array.isArray(value.buttons) ? value.buttons : [];
  const buttons = [1, 2, 3, 4].map((index) => {
    const found = buttonsRaw.find(
      (item) => isRecord(item) && Number(item.index) === index
    );
    if (!isRecord(found)) {
      return { index, name: `Button ${index}`, action: null };
    }
    let action: Profile["buttons"][number]["action"] = null;
    if (isRecord(found.action) && typeof found.action.action === "string") {
      action = {
        action: found.action.action,
        target: isRecord(found.action.target) ? found.action.target : {},
        data: isRecord(found.action.data) ? found.action.data : {},
      };
    }
    return {
      index,
      name: String(found.name ?? `Button ${index}`),
      action,
      radio_member: found.radio_member === undefined ? true : Boolean(found.radio_member),
    };
  });

  let brightness = 100;
  if (value.backlight_brightness !== undefined && value.backlight_brightness !== null) {
    const raw = Number(value.backlight_brightness);
    if (!Number.isFinite(raw)) {
      return { ok: false, error: `invalid backlight_brightness for profile ${id}` };
    }
    brightness = Math.max(0, Math.min(100, Math.round(raw)));
  }

  return {
    ok: true,
    profile: {
      id,
      name: String(value.name || id),
      mode: mode as Profile["mode"],
      color_on: String(value.color_on || "cyan"),
      color_off: String(value.color_off || "blue"),
      radar: String(value.radar || "30s"),
      backlight: Boolean(value.backlight ?? true),
      backlight_brightness: brightness,
      child_lock: Boolean(value.child_lock ?? false),
      selected_button:
        value.selected_button === null || value.selected_button === undefined
          ? null
          : Number(value.selected_button),
      gang_count: Math.max(1, Math.min(4, Number(value.gang_count) || 4)),
      buttons,
      radio_groups: normalizeRadioGroups(value.radio_groups),
      covers: Array.isArray(value.covers)
        ? (value.covers as Profile["covers"])
        : value.cover
          ? [value.cover as NonNullable<Profile["covers"]>[number]]
          : undefined,
    },
  };
}

/** Validate/normalize a portable export JSON document. */
export function validateProfilesExport(raw: unknown): ProfilesExportValidation {
  if (!isRecord(raw)) {
    return { ok: false, error: "Root must be a JSON object" };
  }

  const schemaVersionRaw = raw.schema_version ?? PROFILES_EXPORT_SCHEMA_VERSION;
  const schemaVersion = Number(schemaVersionRaw);
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    return { ok: false, error: "schema_version must be a positive integer" };
  }
  if (schemaVersion > PROFILES_EXPORT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Unsupported schema_version ${schemaVersion}; current is ${PROFILES_EXPORT_SCHEMA_VERSION}`,
    };
  }

  const normalized = normalizeProfiles(raw.profiles);
  if (!normalized.ok) {
    return normalized;
  }

  let active: string | null = null;
  if (typeof raw.active_profile_id === "string" && raw.active_profile_id) {
    active = raw.active_profile_id;
    if (!(active in normalized.profiles)) {
      return {
        ok: false,
        error: `active_profile_id "${active}" is not present in profiles`,
      };
    }
  }

  return {
    ok: true,
    payload: {
      schema_version: PROFILES_EXPORT_SCHEMA_VERSION,
      active_profile_id: active,
      profiles: normalized.profiles,
    },
  };
}

/** Build a portable export payload from in-memory profiles. */
export function buildProfilesExport(
  profiles: Record<string, Profile>,
  activeProfileId: string | null
): ProfilesExport {
  return {
    schema_version: PROFILES_EXPORT_SCHEMA_VERSION,
    active_profile_id: activeProfileId,
    profiles: structuredClone(profiles),
  };
}

/** Generate Developer Tools YAML for conx_dynamic_panel.import_profiles. */
export function buildImportServiceYaml(
  payload: ProfilesExport,
  mode: "merge" | "replace",
  entryId = "YOUR_CONFIG_ENTRY_ID"
): string {
  const indented = JSON.stringify(payload, null, 2)
    .split("\n")
    .map((line, index) => (index === 0 ? line : `    ${line}`))
    .join("\n");
  return [
    "service: conx_dynamic_panel.import_profiles",
    "data:",
    `  entry_id: ${entryId}`,
    `  mode: ${mode}`,
    `  payload: ${indented}`,
  ].join("\n");
}
