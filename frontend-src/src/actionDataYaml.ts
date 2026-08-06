/**
 * Lightweight YAML-like editor for Home Assistant service `data:` objects.
 * Supports flat key: value lines (strings, numbers, booleans, null) and JSON
 * objects / JSON values — no heavy yaml dependency.
 */

export type ActionDataParseResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

const KEY_LINE =
  /^([A-Za-z_][\w.-]*)\s*:\s*(.*?)\s*$/;

function needsQuotes(value: string): boolean {
  if (!value) {
    return true;
  }
  if (/^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(value)) {
    return true;
  }
  if (/^(true|false|null|yes|no|on|off)$/i.test(value)) {
    return true;
  }
  return /[:#{}[\],&*!|>'"%@`]|\s/.test(value) || value !== value.trim();
}

function formatYamlScalar(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    return needsQuotes(value) ? JSON.stringify(value) : value;
  }
  return JSON.stringify(value);
}

/** Pretty-print `action.data` as YAML-like key: value lines (or empty string). */
export function serializeActionData(
  data: Record<string, unknown> | null | undefined
): string {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "";
  }
  const keys = Object.keys(data);
  if (!keys.length) {
    return "";
  }
  return keys.map((key) => `${key}: ${formatYamlScalar(data[key])}`).join("\n");
}

function parseScalar(raw: string): unknown {
  const text = raw.trim();
  if (!text) {
    return "";
  }
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    try {
      if (text.startsWith('"')) {
        return JSON.parse(text) as string;
      }
      return text.slice(1, -1).replace(/\\'/g, "'");
    } catch {
      return text.slice(1, -1);
    }
  }
  if (text === "null" || text === "~") {
    return null;
  }
  if (text === "true" || text === "yes" || text === "on") {
    return true;
  }
  if (text === "false" || text === "no" || text === "off") {
    return false;
  }
  if (/^[-+]?\d+$/.test(text)) {
    const n = Number(text);
    if (Number.isSafeInteger(n)) {
      return n;
    }
  }
  if (/^[-+]?(\d+\.\d*|\.\d+)([eE][-+]?\d+)?$/.test(text)) {
    const n = Number(text);
    if (!Number.isNaN(n)) {
      return n;
    }
  }
  if (
    (text.startsWith("{") && text.endsWith("}")) ||
    (text.startsWith("[") && text.endsWith("]"))
  ) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      // fall through — treat as plain string
    }
  }
  return text;
}

/**
 * Parse YAML-like `data:` body or a JSON object into a plain record.
 * Empty / whitespace-only input → {}.
 */
export function parseActionData(text: string): ActionDataParseResult {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return { ok: true, data: {} };
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return { ok: false, error: "JSON data must be an object" };
      }
      return { ok: true, data: { ...(parsed as Record<string, unknown>) } };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid JSON";
      return { ok: false, error: message };
    }
  }

  const data: Record<string, unknown> = {};
  const lines = trimmed.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const match = KEY_LINE.exec(line);
    if (!match) {
      return {
        ok: false,
        error: `Invalid line ${i + 1}: expected key: value`,
      };
    }
    const key = match[1];
    data[key] = parseScalar(match[2]);
  }
  return { ok: true, data };
}

/** True when two data objects have the same JSON content (sorted keys). */
export function actionDataEqual(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined
): boolean {
  const norm = (value: Record<string, unknown> | null | undefined) => {
    const obj = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = obj[key];
    }
    return JSON.stringify(sorted);
  };
  return norm(a) === norm(b);
}
