/** Portable profiles export schema shared by the Lit card and standalone wizard. */

import type { Profile, ProfilesExport, SchedulerExport, SchedulerTask } from "./types";

/** Must match custom_components/conx_dynamic_panel/const.py STORAGE_VERSION. */
export const PROFILES_EXPORT_SCHEMA_VERSION = 2;

const MODES = new Set([
  "toggle",
  "radio_mandatory",
  "radio_optional",
  "radio_split",
  "mixed",
  "cover",
]);

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
    const parseOptionalAction = (
      raw: unknown
    ): Profile["buttons"][number]["action"] => {
      if (!isRecord(raw) || typeof raw.action !== "string" || !raw.action) {
        return null;
      }
      return {
        action: raw.action,
        target: isRecord(raw.target) ? raw.target : {},
        data: isRecord(raw.data) ? raw.data : {},
      };
    };
    return {
      index,
      name: String(found.name ?? `Button ${index}`),
      action,
      action_double: parseOptionalAction(found.action_double),
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

/** Must match custom_components/conx_dynamic_panel/const.py SCHEDULER_EXPORT_SCHEMA_VERSION. */
export const SCHEDULER_EXPORT_SCHEMA_VERSION = 1;
export const EXPORT_SCOPE_SCHEDULER = "scheduler";

export type SchedulerExportValidation =
  | { ok: true; payload: SchedulerExport }
  | { ok: false; error: string };

function normalizeSchedulerTasks(
  raw: unknown,
  label: string
): { ok: true; tasks: Record<string, SchedulerTask> } | { ok: false; error: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, tasks: {} };
  }
  if (isRecord(raw)) {
    const tasks: Record<string, SchedulerTask> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (!isRecord(value)) {
        return { ok: false, error: `${label}.${key} must be an object` };
      }
      const id = String(value.id || key).trim();
      if (!id) {
        return { ok: false, error: `${label} entry is missing id` };
      }
      tasks[id] = { ...(value as unknown as SchedulerTask), id };
    }
    return { ok: true, tasks };
  }
  if (Array.isArray(raw)) {
    const tasks: Record<string, SchedulerTask> = {};
    for (let index = 0; index < raw.length; index += 1) {
      const value = raw[index];
      if (!isRecord(value)) {
        return { ok: false, error: `${label}[${index}] must be an object` };
      }
      const id = String(value.id || "").trim();
      if (!id) {
        return { ok: false, error: `${label}[${index}] is missing id` };
      }
      tasks[id] = { ...(value as unknown as SchedulerTask), id };
    }
    return { ok: true, tasks };
  }
  return { ok: false, error: `${label} must be an object or array` };
}

/** Validate/normalize a portable scheduler export JSON document. */
export function validateSchedulerExport(raw: unknown): SchedulerExportValidation {
  if (!isRecord(raw)) {
    return { ok: false, error: "Root must be a JSON object" };
  }

  const scope = String(raw.scope || EXPORT_SCOPE_SCHEDULER).trim().toLowerCase();
  if (scope !== EXPORT_SCOPE_SCHEDULER) {
    return {
      ok: false,
      error: `Unsupported scope "${scope}"; expected "${EXPORT_SCOPE_SCHEDULER}"`,
    };
  }

  const schemaVersionRaw = raw.schema_version ?? SCHEDULER_EXPORT_SCHEMA_VERSION;
  const schemaVersion = Number(schemaVersionRaw);
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    return { ok: false, error: "schema_version must be a positive integer" };
  }
  if (schemaVersion > SCHEDULER_EXPORT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Unsupported schema_version ${schemaVersion}; current is ${SCHEDULER_EXPORT_SCHEMA_VERSION}`,
    };
  }

  const locals = normalizeSchedulerTasks(raw.scheduler_tasks, "scheduler_tasks");
  if (!locals.ok) {
    return locals;
  }
  const masters = normalizeSchedulerTasks(
    raw.master_scheduler_tasks,
    "master_scheduler_tasks"
  );
  if (!masters.ok) {
    return masters;
  }

  let defaultProfileId: string | null | undefined;
  if (raw.default_profile_id === null || raw.default_profile_id === undefined) {
    defaultProfileId = raw.default_profile_id as null | undefined;
  } else {
    defaultProfileId = String(raw.default_profile_id).trim() || null;
  }

  return {
    ok: true,
    payload: {
      schema_version: SCHEDULER_EXPORT_SCHEMA_VERSION,
      scope: EXPORT_SCOPE_SCHEDULER,
      entry_id: typeof raw.entry_id === "string" ? raw.entry_id : undefined,
      default_profile_id: defaultProfileId,
      scheduler_tasks: locals.tasks,
      master_scheduler_tasks: masters.tasks,
      notes: typeof raw.notes === "string" ? raw.notes : undefined,
    },
  };
}
