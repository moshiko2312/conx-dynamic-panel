/** Visual UI themes for the ConX Lovelace card and HTML previews. */

export type CardThemeId = "noir" | "ivory";

export interface ThemeSwatch {
  id: CardThemeId;
  /** CSS gradient for the picker swatch preview. */
  swatch: string;
  accent: string;
}

export const THEME_STORAGE_KEY = "conx-dynamic-panel-theme";

/**
 * Legacy aliases map onto current theme ids.
 * Inspired by a noir/gold + ivory/stone visual language (premium dark + warm light).
 */
const THEME_ALIASES: Record<string, CardThemeId> = {
  industrial: "ivory",
  glass: "ivory",
  glass_light: "ivory",
  light_soft: "ivory",
  light: "ivory",
  black_orange: "noir",
  obsidian: "noir",
  obsidian_orange: "noir",
  graphite: "noir",
  midnight_teal: "noir",
  dark: "noir",
};

export const THEME_OPTIONS: ThemeSwatch[] = [
  {
    id: "noir",
    swatch: "linear-gradient(145deg, #070809 0%, #1d1e20 55%, #d7b56d 100%)",
    accent: "#d7b56d",
  },
  {
    id: "ivory",
    swatch: "linear-gradient(145deg, #fffaf2 0%, #f5f0e7 55%, #9d7837 100%)",
    accent: "#9d7837",
  },
];

const THEME_IDS = new Set<string>(THEME_OPTIONS.map((item) => item.id));

export function normalizeTheme(value: string | undefined | null): CardThemeId {
  if (!value) {
    return "noir";
  }
  if (THEME_IDS.has(value)) {
    return value as CardThemeId;
  }
  return THEME_ALIASES[value] || "noir";
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
  return stored || "noir";
}
