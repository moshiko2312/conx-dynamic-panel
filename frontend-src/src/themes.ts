/** Visual UI themes for the ConX Lovelace card and HTML previews. */

export type CardThemeId =
  | "industrial"
  | "black_orange"
  | "graphite"
  | "midnight_teal"
  | "light_soft";

export interface ThemeSwatch {
  id: CardThemeId;
  /** CSS gradient for the picker swatch preview. */
  swatch: string;
  accent: string;
}

export const THEME_STORAGE_KEY = "conx-dynamic-panel-theme";

/** Legacy aliases map onto current theme ids. */
const THEME_ALIASES: Record<string, CardThemeId> = {
  glass: "industrial",
  glass_light: "industrial",
  obsidian: "black_orange",
  obsidian_orange: "black_orange",
};

export const THEME_OPTIONS: ThemeSwatch[] = [
  {
    id: "industrial",
    swatch: "linear-gradient(145deg, #f4f7fa 0%, #d7e1ea 52%, #9eb0bf 100%)",
    accent: "#1f7a8c",
  },
  {
    id: "black_orange",
    swatch: "linear-gradient(145deg, #0b0d10 0%, #1a120e 48%, #ff7a1a 100%)",
    accent: "#ff7a1a",
  },
  {
    id: "graphite",
    swatch: "linear-gradient(145deg, #0e1216 0%, #232a32 50%, #7dd3fc 100%)",
    accent: "#7dd3fc",
  },
  {
    id: "midnight_teal",
    swatch: "linear-gradient(145deg, #061218 0%, #0d2a32 50%, #2dd4bf 100%)",
    accent: "#2dd4bf",
  },
  {
    id: "light_soft",
    swatch: "linear-gradient(145deg, #ffffff 0%, #f3f6f9 55%, #d5e0ea 100%)",
    accent: "#3d7ea6",
  },
];

const THEME_IDS = new Set<string>(THEME_OPTIONS.map((item) => item.id));

export function normalizeTheme(value: string | undefined | null): CardThemeId {
  if (!value) {
    return "industrial";
  }
  if (THEME_IDS.has(value)) {
    return value as CardThemeId;
  }
  return THEME_ALIASES[value] || "industrial";
}

export function loadStoredTheme(): CardThemeId | null {
  try {
    const value = globalThis.localStorage?.getItem?.(THEME_STORAGE_KEY);
    if (!value) {
      return null;
    }
    return normalizeTheme(value);
  } catch {
    /* ignore */
  }
  return null;
}

export function persistTheme(theme: CardThemeId): void {
  try {
    globalThis.localStorage?.setItem?.(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** Resolve active theme: explicit card config wins, then localStorage, then default. */
export function resolveTheme(
  configTheme: string | undefined,
  stored: CardThemeId | null
): CardThemeId {
  if (configTheme) {
    return normalizeTheme(configTheme);
  }
  return stored || "industrial";
}
