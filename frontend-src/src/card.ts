import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { PropertyValues } from "lit";
import {
  COVER_SETTLE_MAX,
  COVER_SETTLE_MIN,
  COVER_TIME_MAX,
  COVER_TIME_MIN,
  DEFAULT_PULSE_TIME,
  PULSE_TIME_MAX,
  PULSE_TIME_MIN,
  clampGangCount,
  clampPulseTime,
  cloneProfile,
  coerceModeForGangCount,
  coverCommand,
  createProfile,
  deleteProfile,
  downloadJson,
  duplicateProfile,
  executeButton,
  exportProfiles,
  fetchConfig,
  importProfiles,
  maxCoversForGangs,
  modesForGangCount,
  normalizeCover,
  normalizeCovers,
  profilesEqual,
  pullPanel,
  rolesForGangCount,
  setActiveProfile,
  subscribeRuntime,
  syncPanel,
  updatePanelName,
  updateProfile,
} from "./api";
import { buildAutomationExampleYaml } from "./automationExample";
import {
  buildImportServiceYaml,
  buildProfilesExport,
  validateProfilesExport,
} from "./exportSchema";
import {
  parseActionData,
  serializeActionData,
} from "./actionDataYaml";
import {
  actionDomain,
  ensureHaPickersLoaded,
  isHaEntityPickerRegistered,
  isHaServicePickerRegistered,
  listEntityIds,
  listServiceActions,
  withCurrentOption,
} from "./haPickers";
import {
  LANGUAGE_OPTIONS,
  type CardLanguage,
  isRtl,
  loadStoredLanguage,
  localize,
  normalizeLanguage,
  persistLanguage,
} from "./localize";
import {
  loadStoredOperateMode,
  persistOperateMode,
} from "./operateMode";
import {
  THEME_OPTIONS,
  type CardThemeId,
  loadStoredTheme,
  normalizeTheme,
  persistTheme,
  resolveTheme,
} from "./themes";
import type {
  ButtonRole,
  CardConfig,
  CoverConfig,
  HomeAssistant,
  PanelConfig,
  PanelRuntimeUpdate,
  Profile,
} from "./types";

type SectionId =
  | "profiles"
  | "appearance"
  | "buttons"
  | "theme"
  | "preview"
  | "actions"
  | "transfer";
type WizardStep =
  | "language"
  | "profiles"
  | "edit"
  | "preview"
  | "review"
  | "transfer";

const WIZARD_STEPS: WizardStep[] = [
  "language",
  "profiles",
  "edit",
  "preview",
  "review",
  "transfer",
];

/**
 * CSS colors for Zemismart LED name options (adapter select values).
 * Z2M's `blue` option lights a cyan LED on these panels — preview matches hardware,
 * not a true deep blue. `cyan` stays a slightly brighter / cooler cyan.
 * `warm_white` / `warm_yellow` stay in the map for legacy draft preview only;
 * pickers never offer them (Z2M converter hang — use white/yellow).
 */
export const COLOR_PREVIEW: Record<string, string> = {
  red: "#ff1744",
  blue: "#00c8de",
  green: "#00e676",
  white: "#f5f7fa",
  yellow: "#ffea00",
  magenta: "#f50057",
  cyan: "#00e5ff",
  warm_white: "#ffe0b2",
  warm_yellow: "#ffc400",
};

/** Z2M warm LED enums that hang Zemismart panels — never offer or sync as-is. */
export const BROKEN_WARM_LED_COLORS = new Set([
  "warm_white",
  "warm_yellow",
  "warmwhite",
  "warmyellow",
]);

const DEFAULT_RING_ON = "#00e5ff";
const DEFAULT_RING_OFF = "#00c8de";

const RADIO_GROUPS_OPEN_KEY = "conx-dynamic-panel-radio-groups-open";

function loadStoredRadioGroupsOpen(): boolean | null {
  try {
    const value = globalThis.localStorage?.getItem?.(RADIO_GROUPS_OPEN_KEY);
    if (value === "0") {
      return false;
    }
    if (value === "1") {
      return true;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function storeRadioGroupsOpen(open: boolean): void {
  try {
    globalThis.localStorage?.setItem?.(RADIO_GROUPS_OPEN_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function normalizeColorOptionKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-./]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/** True for known-broken Z2M warm LED enum values. */
export function isBrokenWarmLedColor(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  const key = normalizeColorOptionKey(value);
  if (BROKEN_WARM_LED_COLORS.has(key)) {
    return true;
  }
  return BROKEN_WARM_LED_COLORS.has(key.replace(/_/g, ""));
}

/** Map broken warm_* colors to working white/yellow for display and sync safety. */
export function remapBrokenWarmLedColor(value: string): string {
  const key = normalizeColorOptionKey(value);
  if (key === "warm_white" || key === "warmwhite") {
    return "white";
  }
  if (key === "warm_yellow" || key === "warmyellow") {
    return "yellow";
  }
  return value.trim();
}

/** Drop broken warm LED enums from color picker option lists. */
export function filterUiColorOptions(options: string[] | undefined): string[] {
  return (options || []).filter((option) => !isBrokenWarmLedColor(option));
}

/** Map a profile LED color name to a CSS color for the faceplate rings. */
export function resolveLedPreviewColor(
  name: string | undefined,
  fallback = DEFAULT_RING_ON
): string {
  if (!name) {
    return fallback;
  }
  const remapped = remapBrokenWarmLedColor(name);
  const key = remapped.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return COLOR_PREVIEW[key] || COLOR_PREVIEW[key.replace(/_/g, "")] || fallback;
}

/**
 * Prefer live select options for color pickers; never offer broken warm_* enums.
 * Remap a stale draft warm_* value to white/yellow so the picker shows a working color.
 */
export function ensureColorSelectOptions(
  live: string[] | undefined,
  ...current: Array<string | undefined>
): string[] {
  const options = filterUiColorOptions(live);
  const seen = new Set(options.map((o) => normalizeColorOptionKey(o)));
  for (const value of current) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      continue;
    }
    const safe = isBrokenWarmLedColor(trimmed)
      ? remapBrokenWarmLedColor(trimmed)
      : trimmed;
    const key = normalizeColorOptionKey(safe);
    if (!key || seen.has(key)) {
      continue;
    }
    options.push(safe);
    seen.add(key);
  }
  return options;
}

/** Prefer live select options; keep the current draft value visible if missing. */
export function ensureSelectOptions(
  live: string[] | undefined,
  ...current: Array<string | undefined>
): string[] {
  const options = [...(live || [])];
  const seen = new Set(options);
  for (const value of current) {
    const trimmed = String(value || "").trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    options.push(trimmed);
    seen.add(trimmed);
  }
  return options;
}

/** Human label for a Z2M/HA color option id (wire value stays unchanged). */
export function formatColorOptionLabel(
  color: string,
  language: string | undefined
): string {
  const key = color.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const localized = localize(language, `color.${key}`);
  if (localized !== `color.${key}`) {
    return localized;
  }
  return color;
}

/** Human label for radar select options (wire value stays unchanged). */
export function formatRadarOptionLabel(
  value: string,
  language: string | undefined
): string {
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const localized = localize(language, `radar.${key}`);
  if (localized !== `radar.${key}`) {
    return localized;
  }
  return value;
}

@customElement("conx-dynamic-panel-card")
export class ConXDynamicPanelCard extends LitElement {
  /**
   * Lovelace often mutates hass.states then reassigns the *same* object
   * reference. Default Lit !== would skip the update and freeze faceplate
   * rings — always treat hass assignment as a change.
   */
  @property({ attribute: false, hasChanged: () => true })
  public hass!: HomeAssistant;

  @state() private _config?: CardConfig;
  @state() private _panel?: PanelConfig;
  @state() private _draft?: Profile;
  @state() private _saved?: Profile;
  @state() private _error?: string;
  @state() private _notice?: string;
  @state() private _loading = false;
  @state() private _busy = false;
  @state() private _syncPulse = false;
  @state() private _pressedRing: number | null = null;
  @state() private _splitPreviewOn: Record<number, boolean> = {};
  /** Latest relay on/off from subscribe / get_config (parallel to relay_entities). */
  @state() private _runtimeRelayStates: Array<boolean | null> = [];
  /** Faceplate-only momentary auto-off timers (browser setTimeout handles). */
  private _momentaryPreviewTimers: Record<number, number> = {};
  /** Faceplate-only radio LED preview; never written into the draft. */
  @state() private _radioPreviewSelected: number | null = null;
  @state() private _uiLang?: CardLanguage;
  @state() private _theme: CardThemeId = "noir";
  /** Operational UI: faceplate + live controls only (hides draft editor chrome). */
  @state() private _operateMode = false;
  /** Main editor vs export/import wizard view. */
  @state() private _view: "editor" | "export" = "editor";
  @state() private _wizardStep: WizardStep = "transfer";
  @state() private _importMode: "merge" | "replace" = "merge";
  @state() private _serviceYaml = "";
  @state() private _sections: Record<SectionId, boolean> = {
    profiles: true,
    appearance: true,
    buttons: true,
    theme: false,
    preview: true,
    actions: true,
    transfer: true,
  };
  /** Expanded button editors (collapsed by default). */
  @state() private _expandedButtons: Record<number, boolean> = {};
  @state() private _activeTab: "profiles" | "appearance" | "buttons" = "profiles";
  @state() private _menuOpen = false;
  @state() private _automationOpen = false;
  @state() private _infoOpen = false;
  @state() private _previewOpen = true;
  @state() private _panelNameDraft = "";
  /** Single open/collapsed state for the whole radio_split groups block. */
  @state() private _radioGroupsOpen = true;
  /** True when HA's native `ha-entity-picker` is registered (or preload succeeded). */
  @state() private _haEntityPickerReady = false;
  /** True when HA's native `ha-service-picker` is registered (or preload succeeded). */
  @state() private _haServicePickerReady = false;
  /** Client-side filter text for fallback action/entity `<select>` lists. */
  @state() private _pickerFilter: Record<string, string> = {};
  /** Open state for per-button Action data (YAML) collapsible. */
  @state() private _actionDataOpen: Record<number, boolean> = {};
  /** In-progress YAML text (keeps invalid edits until fixed). */
  @state() private _actionDataText: Record<number, string> = {};
  /** Inline parse errors for Action data (YAML). */
  @state() private _actionDataError: Record<number, string> = {};

  private _importInput?: HTMLInputElement;
  private _haPickerLoadStarted = false;
  /** Unsubscribe from conx_dynamic_panel/subscribe runtime pushes. */
  private _unsubRuntime?: () => void;
  private _runtimeEntryId?: string;
  /** Last observed live relay on/off per button (for clearing stale optimistic LEDs). */
  private _lastLiveRelays: Record<number, boolean | null> = {};

  public static getConfigElement() {
    return document.createElement("conx-dynamic-panel-card-editor");
  }

  public static getStubConfig(): CardConfig {
    return {
      type: "custom:conx-dynamic-panel-card",
      entry_id: "",
      compact: false,
    };
  }

  public setConfig(config: CardConfig): void {
    if (!config.entry_id) {
      throw new Error("entry_id is required");
    }
    this._config = config;
    if (config.language) {
      this._uiLang = normalizeLanguage(config.language);
    }
    this._theme = resolveTheme(config.theme, loadStoredTheme());
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (!this._uiLang) {
      this._uiLang = loadStoredLanguage() || undefined;
    }
    this._theme = resolveTheme(this._config?.theme, loadStoredTheme());
    this._operateMode = loadStoredOperateMode();
    if (this._operateMode) {
      this._previewOpen = true;
    }
    this._ensureFonts();
    void this._ensureRuntimeSubscription();
    void this._ensureHaEntityPicker();
  }

  private _toggleOperateMode(): void {
    this._setOperateMode(!this._operateMode);
  }

  private _setOperateMode(operate: boolean): void {
    this._operateMode = operate;
    persistOperateMode(this._operateMode);
    if (this._operateMode) {
      this._previewOpen = true;
      this._menuOpen = false;
      this._automationOpen = false;
      this._infoOpen = false;
      if (this._view === "export") {
        this._view = "editor";
      }
    }
  }

  private _exitOperateMode(): void {
    this._setOperateMode(false);
    this._menuOpen = false;
  }

  disconnectedCallback(): void {
    this._teardownRuntimeSubscription();
    this._clearFaceplatePreview();
    super.disconnectedCallback();
  }

  private _stepLabel(step: WizardStep): string {
    return this.t(`card.step_${step}`);
  }

  private _goToStep(step: WizardStep): void {
    this._wizardStep = step;
    this._notice = undefined;
  }

  private _wizardIndex(): number {
    return WIZARD_STEPS.indexOf(this._wizardStep);
  }

  private _wizardNext(): void {
    const index = this._wizardIndex();
    if (index < WIZARD_STEPS.length - 1) {
      this._goToStep(WIZARD_STEPS[index + 1]);
    }
  }

  private _wizardBack(): void {
    const index = this._wizardIndex();
    if (index > 0) {
      this._goToStep(WIZARD_STEPS[index - 1]);
    }
  }

  private _buildServiceYaml(
    payload?: ReturnType<typeof buildProfilesExport>
  ): string {
    if (!this._panel || !this._config) {
      return "";
    }
    const exportPayload =
      payload ||
      buildProfilesExport(this._panel.profiles, this._panel.active_profile_id);
    return buildImportServiceYaml(
      exportPayload,
      this._importMode,
      this._config.entry_id
    );
  }

  private _refreshServiceYaml(payload?: ReturnType<typeof buildProfilesExport>): void {
    this._serviceYaml = this._buildServiceYaml(payload);
  }

  private async _copyServiceYaml(): Promise<void> {
    const yaml = this._buildServiceYaml();
    this._serviceYaml = yaml;
    await this._copyToClipboard(yaml);
  }

  private async _copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this._notice = this.t("card.copied") + " ✓";
    } catch {
      this._error = "Clipboard unavailable";
    }
  }

  private _buildAutomationYaml(): string {
    const profileIds = this._panel ? Object.keys(this._panel.profiles) : [];
    return buildAutomationExampleYaml({
      entryId: this._config?.entry_id,
      profileIds,
      comments: {
        alias: this.t("card.automation_yaml_alias"),
        header: this.t("card.automation_yaml_header"),
        sync: this.t("card.automation_yaml_sync"),
        ids: this.t("card.automation_yaml_ids"),
        morning: this.t("card.automation_yaml_morning"),
        evening: this.t("card.automation_yaml_evening"),
        night: this.t("card.automation_yaml_night"),
      },
    });
  }

  private async _copyAutomationYaml(): Promise<void> {
    await this._copyToClipboard(this._buildAutomationYaml());
  }

  private _ensureFonts(): void {
    const id = "conx-dynamic-panel-fonts";
    if (document.getElementById(id)) {
      return;
    }
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    // Match standalone HTML preview (Manrope + Cormorant Garamond).
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }

  protected updated(changed: Map<string | number | symbol, unknown>): void {
    if (
      (changed.has("hass") || changed.has("_config")) &&
      this.hass &&
      this._config?.entry_id &&
      !this._panel &&
      !this._loading
    ) {
      void this._load();
    }
    if (changed.has("hass") || changed.has("_config") || changed.has("_panel")) {
      void this._ensureRuntimeSubscription();
    }
  }

  protected willUpdate(changed: PropertyValues): void {
    // Reconcile faceplate preview with live relays before paint.
    if (
      (changed.has("hass") ||
        changed.has("_panel") ||
        changed.has("_runtimeRelayStates") ||
        changed.has("_draft")) &&
      this._panel?.relay_entities?.length
    ) {
      const next = this._previewAfterLiveReconcile();
      if (next) {
        this._splitPreviewOn = next;
      }
    }
  }

  private get _language(): CardLanguage {
    if (this._uiLang) {
      return this._uiLang;
    }
    return normalizeLanguage(
      this.hass?.locale?.language || this.hass?.language || "en"
    );
  }

  private t(key: string): string {
    return localize(this._language, key);
  }

  private get _dirty(): boolean {
    return !profilesEqual(this._draft || null, this._saved || null);
  }

  private _setLanguage(lang: CardLanguage): void {
    this._uiLang = lang;
    persistLanguage(lang);
  }

  private _setTheme(theme: CardThemeId): void {
    this._theme = normalizeTheme(theme);
    persistTheme(this._theme);
    if (this._config) {
      this._config = { ...this._config, theme: this._theme };
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: this._config },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private _openExportWizard(): void {
    this._view = "export";
    this._notice = undefined;
    this._refreshServiceYaml();
  }

  private _backToEditor(): void {
    this._view = "editor";
    this._notice = undefined;
  }

  private _isRadioMember(buttonIndex: number): boolean {
    const button = this._draft?.buttons.find((item) => item.index === buttonIndex);
    return button?.radio_member !== false;
  }

  private _ensureRadioGroups(draft: Profile): void {
    const groups = Array.isArray(draft.radio_groups) ? draft.radio_groups : [];
    const gangCount = clampGangCount(draft.gang_count ?? 4);
    const radioIndexes =
      draft.mode === "mixed"
        ? new Set(
            (draft.buttons || [])
              .filter(
                (button) =>
                  button.role === "radio" && button.index <= gangCount
              )
              .map((button) => button.index)
          )
        : null;
    const normalized = groups.map((group, index) => ({
      id: String(group?.id || `g${index + 1}`),
      buttons: Array.isArray(group?.buttons)
        ? group.buttons
            .map((n) => Number(n))
            .filter(
              (n, i, arr) =>
                n >= 1 &&
                n <= gangCount &&
                arr.indexOf(n) === i &&
                (radioIndexes == null || radioIndexes.has(n))
            )
        : [],
    }));
    while (normalized.length < 2) {
      normalized.push({ id: `g${normalized.length + 1}`, buttons: [] });
    }
    draft.radio_groups = normalized;
  }

  private _radioGroupFor(buttonIndex: number) {
    return (
      this._draft?.radio_groups?.find((group) =>
        group.buttons.includes(buttonIndex)
      ) ?? null
    );
  }

  private _radioGroupsOverlap(): boolean {
    const ownership = new Map<number, string>();
    for (const group of this._draft?.radio_groups || []) {
      for (const index of group.buttons) {
        if (ownership.has(index)) return true;
        ownership.set(index, group.id);
      }
    }
    return false;
  }

  private _toggleSplitGroupButton(groupIndex: number, buttonIndex: number, checked: boolean): void {
    this._patchDraft((draft) => {
      // In free mix, joining a radio group implies role=radio so press routing
      // and group membership stay consistent (no dead "toggle stuck in radio").
      if (checked && draft.mode === "mixed") {
        const button = draft.buttons.find((item) => item.index === buttonIndex);
        if (button && button.role !== "radio") {
          button.role = "radio";
          button.cover_id = null;
        }
      }
      this._ensureRadioGroups(draft);
      const groups = draft.radio_groups || [];
      groups.forEach((group, index) => {
        if (index === groupIndex) {
          if (checked && !group.buttons.includes(buttonIndex)) {
            group.buttons = [...group.buttons, buttonIndex];
          } else if (!checked) {
            group.buttons = group.buttons.filter((n) => n !== buttonIndex);
          }
        } else if (checked) {
          group.buttons = group.buttons.filter((n) => n !== buttonIndex);
        }
      });
    });
  }

  private _ungroupedButtons(): Set<number> {
    const grouped = new Set<number>();
    for (const group of this._draft?.radio_groups || []) {
      for (const index of group.buttons) {
        grouped.add(index);
      }
    }
    return new Set(this._gangIndexes().filter((index) => !grouped.has(index)));
  }

  private _makeButtonIndependent(buttonIndex: number): void {
    this._patchDraft((draft) => {
      this._ensureRadioGroups(draft);
      for (const group of draft.radio_groups || []) {
        group.buttons = group.buttons.filter((n) => n !== buttonIndex);
      }
    });
  }

  private _renderRadioMemberCell(
    buttonIndex: number,
    selected: boolean,
    options: { groupIndex?: number; independent?: boolean } = {}
  ) {
    const independent = Boolean(options.independent);
    const classes = [
      "radio-member",
      selected ? "on" : "",
      independent ? "is-independent" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const onClick = () => {
      if (this._busy) {
        return;
      }
      if (independent) {
        if (!selected) {
          this._makeButtonIndependent(buttonIndex);
        }
        return;
      }
      this._toggleSplitGroupButton(
        options.groupIndex ?? 0,
        buttonIndex,
        !selected
      );
    };
    return html`
      <button
        type="button"
        class=${classes}
        role="switch"
        aria-checked=${selected ? "true" : "false"}
        ?disabled=${this._busy || (independent && selected)}
        @click=${onClick}
      >
        <span class="radio-member-label">L${buttonIndex}</span>
      </button>
    `;
  }

  private _renderRadioGroupsEditor() {
    if (!this._draft) {
      return nothing;
    }
    if (this._draft.mode === "mixed") {
      const hasRadio = this._draft.buttons.some(
        (button) =>
          button.index <= this._gangCount() && button.role === "radio"
      );
      if (!hasRadio) {
        return nothing;
      }
    } else if (this._draft.mode !== "radio_split") {
      return nothing;
    }
    const ungrouped = this._ungroupedButtons();
    const open = this._radioGroupsOpen;
    return html`
      <div class="radio-groups-section ${open ? "open" : ""}">
        <div class="radio-groups-head">
          <div class="radio-groups-head-main">
            <span class="menu-label">${this.t("card.radio_groups")}</span>
            ${open
              ? nothing
              : html`<div class="radio-groups-summary">
                  ${this._radioGroupsSummary()}
                </div>`}
          </div>
          <label class="switch" title=${this.t("card.radio_groups_toggle")}>
            <input
              type="checkbox"
              data-radio-groups-open
              .checked=${open}
              ?disabled=${this._busy}
              @change=${(e: Event) =>
                this._setRadioGroupsOpen(
                  (e.target as HTMLInputElement).checked
                )}
            />
            <span class="slider"></span>
          </label>
        </div>
        ${open
          ? html`
              <p class="radio-groups-hint">
                ${this.t("card.radio_groups_hint")}
              </p>
              ${(this._draft.radio_groups || []).map(
                (group, gIndex) => html`
                  <div class="radio-group-card">
                    <div class="radio-group-title">
                      ${this.t("card.radio_group")} ${gIndex + 1}
                    </div>
                    <div
                      class="radio-group-members"
                      dir="ltr"
                      style="--conx-gang-count:${this._gangCount()}"
                    >
                      ${this._gangIndexes().map((buttonIndex) =>
                        this._renderRadioMemberCell(
                          buttonIndex,
                          group.buttons.includes(buttonIndex),
                          { groupIndex: gIndex }
                        )
                      )}
                    </div>
                  </div>
                `
              )}
              <div class="radio-group-card is-summary">
                <div class="radio-group-title">
                  ${this.t("card.radio_toggle")}
                </div>
                <div
                  class="radio-group-members"
                  dir="ltr"
                  style="--conx-gang-count:${this._gangCount()}"
                >
                  ${this._gangIndexes().map((buttonIndex) =>
                    this._renderRadioMemberCell(
                      buttonIndex,
                      ungrouped.has(buttonIndex),
                      { independent: true }
                    )
                  )}
                </div>
              </div>
            `
          : nothing}
        ${this._radioGroupsOverlap()
          ? html`<div class="radio-groups-error">
              ${this.t("card.radio_groups_overlap")}
            </div>`
          : nothing}
      </div>
    `;
  }

  private _toggleSection(id: SectionId): void {
    this._sections = { ...this._sections, [id]: !this._sections[id] };
  }

  private _toggleButtonEditor(index: number): void {
    this._expandedButtons = {
      ...this._expandedButtons,
      [index]: !this._expandedButtons[index],
    };
  }

  private async _load(): Promise<void> {
    if (!this.hass || !this._config?.entry_id) {
      return;
    }
    this._loading = true;
    this._error = undefined;
    try {
      const panel = await fetchConfig(this.hass, this._config.entry_id);
      this._applyPanel(panel);
      void this._ensureRuntimeSubscription();
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._loading = false;
    }
  }

  private _applyPanel(panel: PanelConfig): void {
    this._panel = panel;
    this._panelNameDraft = panel.panel_name;
    this._runtimeRelayStates = panel.relay_states ? [...panel.relay_states] : [];
    const activeId = panel.active_profile_id;
    const profile = activeId ? panel.profiles[activeId] : undefined;
    this._saved = profile ? cloneProfile(profile) : undefined;
    this._draft = profile ? cloneProfile(profile) : undefined;
    // Migrate broken warm_* LED colors in the in-memory draft so Sync cannot hang
    // the panel; leave _saved as stored so Save Draft can persist white/yellow.
    this._migrateBrokenWarmLedDraftColors();
    this._clearFaceplatePreview();
    if (this._draft?.mode === "radio_split") {
      this._radioGroupsOpen = loadStoredRadioGroupsOpen() ?? true;
    }
    this._syncMomentaryFromRuntime(panel.momentary_active);
  }

  /** Remap draft warm_white/warm_yellow → white/yellow (Z2M hang workaround). */
  private _migrateBrokenWarmLedDraftColors(): void {
    if (!this._draft) {
      return;
    }
    let changed = false;
    if (isBrokenWarmLedColor(this._draft.color_on)) {
      this._draft.color_on = remapBrokenWarmLedColor(this._draft.color_on);
      changed = true;
    }
    if (isBrokenWarmLedColor(this._draft.color_off)) {
      this._draft.color_off = remapBrokenWarmLedColor(this._draft.color_off);
      changed = true;
    }
    // Mutating draft vs saved flips the computed _dirty getter.
    if (changed) {
      this.requestUpdate();
    }
  }

  /** Merge coordinator runtime push — never overwrites draft / saved profiles. */
  private _applyRuntime(update: PanelRuntimeUpdate): void {
    if (!this._panel) {
      return;
    }
    if (update.entry_id && update.entry_id !== this._panel.entry_id) {
      return;
    }
    this._panel = {
      ...this._panel,
      sync_status: update.sync_status ?? this._panel.sync_status,
      last_sync:
        update.last_sync !== undefined ? update.last_sync : this._panel.last_sync,
      last_error:
        update.last_error !== undefined ? update.last_error : this._panel.last_error,
      auto_sync: update.auto_sync ?? this._panel.auto_sync,
      relay_entities: update.relay_entities ?? this._panel.relay_entities,
      relay_states: update.relay_states ?? this._panel.relay_states,
      momentary_active: update.momentary_active ?? this._panel.momentary_active,
      cover_state: update.cover_state ?? this._panel.cover_state,
    };
    if (update.relay_states) {
      this._runtimeRelayStates = [...update.relay_states];
    }
    this._syncMomentaryFromRuntime(update.momentary_active);
    this._reconcilePreviewWithLiveRelays();
  }

  private _teardownRuntimeSubscription(): void {
    if (this._unsubRuntime) {
      this._unsubRuntime();
      this._unsubRuntime = undefined;
    }
    this._runtimeEntryId = undefined;
  }

  private async _ensureRuntimeSubscription(): Promise<void> {
    const entryId = this._config?.entry_id;
    if (!this.hass || !entryId || !this._panel) {
      return;
    }
    if (this._unsubRuntime && this._runtimeEntryId === entryId) {
      return;
    }
    this._teardownRuntimeSubscription();
    this._runtimeEntryId = entryId;
    try {
      this._unsubRuntime = await subscribeRuntime(this.hass, entryId, (update) => {
        this._applyRuntime(update);
      });
    } catch {
      this._runtimeEntryId = undefined;
      this._unsubRuntime = undefined;
    }
  }

  private _isMomentaryButton(buttonIndex: number): boolean {
    return (
      this._draft?.mode === "mixed" &&
      this._buttonRole(buttonIndex) === "momentary"
    );
  }

  /**
   * When a mapped relay flips, keep faceplate preview aligned:
   * - Momentary ON (physical/engine): arm a matching UI pulse timer so the ring
   *   auto-clears even when entity OFF updates are slow or hass binding lags.
   * - Momentary OFF: clear timer + optimistic ON.
   * - Other roles: drop stale optimistic bits so live relay wins.
   * Stable unchanged OFF must not wipe an in-progress card-press preview.
   */
  private _previewAfterLiveReconcile(): Record<number, boolean> | null {
    const relays = this._panel?.relay_entities;
    if (!relays?.length) {
      return null;
    }
    let changed = false;
    const next = { ...this._splitPreviewOn };
    for (let index = 1; index <= relays.length; index++) {
      const live = this._liveRelayOn(index);
      const prev = Object.prototype.hasOwnProperty.call(this._lastLiveRelays, index)
        ? this._lastLiveRelays[index]
        : null;
      this._lastLiveRelays[index] = live;
      if (live === null || live === prev) {
        continue;
      }
      if (this._isMomentaryButton(index)) {
        if (live) {
          if (this._momentaryPreviewTimers[index] == null) {
            next[index] = true;
            this._armMomentaryUiPulse(index, next);
            changed = true;
          } else if (!next[index]) {
            next[index] = true;
            changed = true;
          }
        } else {
          this._clearMomentaryPreviewTimer(index);
          if (next[index]) {
            next[index] = false;
            changed = true;
          }
        }
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(next, index)) {
        delete next[index];
        changed = true;
      }
    }
    return changed ? next : null;
  }

  private _reconcilePreviewWithLiveRelays(): void {
    const next = this._previewAfterLiveReconcile();
    if (next) {
      this._splitPreviewOn = next;
    }
  }

  /** Backend armed a pulse — mirror with a UI timer if the ring is not pulsing yet. */
  private _syncMomentaryFromRuntime(active?: number[]): void {
    if (!active || !this._draft) {
      return;
    }
    const armed = new Set(active);
    for (const index of armed) {
      if (!this._isMomentaryButton(index)) {
        continue;
      }
      if (this._momentaryPreviewTimers[index] == null) {
        this._splitPreviewOn = {
          ...this._splitPreviewOn,
          [index]: true,
        };
        this._armMomentaryUiPulse(index);
      }
    }
    for (const index of Object.keys(this._momentaryPreviewTimers).map(Number)) {
      if (armed.has(index)) {
        continue;
      }
      // Only clear when live relay is already OFF (backend finished).
      if (this._liveRelayOn(index) === false) {
        this._clearMomentaryPreviewTimer(index);
        if (this._splitPreviewOn[index]) {
          this._splitPreviewOn = {
            ...this._splitPreviewOn,
            [index]: false,
          };
        }
      }
    }
  }

  /** Reset local LED preview so presses never leak into draft dirty state. */
  private _clearFaceplatePreview(): void {
    for (const handle of Object.values(this._momentaryPreviewTimers)) {
      window.clearTimeout(handle);
    }
    this._momentaryPreviewTimers = {};
    this._splitPreviewOn = {};
    this._radioPreviewSelected = null;
    this._pressedRing = null;
    this._lastLiveRelays = {};
  }

  private _clearMomentaryPreviewTimer(buttonIndex: number): void {
    const handle = this._momentaryPreviewTimers[buttonIndex];
    if (handle != null) {
      window.clearTimeout(handle);
      delete this._momentaryPreviewTimers[buttonIndex];
    }
  }

  /**
   * Arm UI auto-OFF after pulse_time_s. Does not toggle-cancel.
   * Optional `preview` mutates an in-progress reconcile map instead of state.
   */
  private _armMomentaryUiPulse(
    buttonIndex: number,
    preview?: Record<number, boolean>
  ): void {
    this._clearMomentaryPreviewTimer(buttonIndex);
    const button = this._draft?.buttons.find((item) => item.index === buttonIndex);
    const pulseMs =
      clampPulseTime(button?.pulse_time_s, DEFAULT_PULSE_TIME) * 1000;
    if (preview) {
      preview[buttonIndex] = true;
    } else {
      this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [buttonIndex]: true,
      };
    }
    this._momentaryPreviewTimers[buttonIndex] = window.setTimeout(() => {
      delete this._momentaryPreviewTimers[buttonIndex];
      // Prefer live OFF; if entity still reports ON, keep ring on until it clears.
      if (this._liveRelayOn(buttonIndex) === true) {
        return;
      }
      this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [buttonIndex]: false,
      };
    }, pulseMs);
  }

  /** Local faceplate pulse: ON now, auto-OFF after pulse_time_s; re-press cancels. */
  private _pulseMomentaryPreview(buttonIndex: number): void {
    this._clearMomentaryPreviewTimer(buttonIndex);
    if (this._splitPreviewOn[buttonIndex]) {
      this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [buttonIndex]: false,
      };
      return;
    }
    this._armMomentaryUiPulse(buttonIndex);
  }

  private _setRadioGroupsOpen(open: boolean): void {
    this._radioGroupsOpen = open;
    storeRadioGroupsOpen(open);
  }

  private _groupSummary(buttons: number[]): string {
    const list = [...buttons].sort((a, b) => a - b).map((n) => `L${n}`);
    return list.length ? list.join(", ") : "—";
  }

  /** One-line assignment recap shown while the radio groups block is collapsed. */
  private _radioGroupsSummary(): string {
    const ungrouped = this._ungroupedButtons();
    const parts = (this._draft?.radio_groups || []).map(
      (group, gIndex) =>
        `${this.t("card.radio_group")} ${gIndex + 1}: ${this._groupSummary(
          group.buttons
        )}`
    );
    parts.push(
      `${this.t("card.radio_toggle")}: ${this._groupSummary(
        [1, 2, 3, 4]
          .filter((n) => n <= this._gangCount() && ungrouped.has(n))
      )}`
    );
    return parts.join(" · ");
  }

  private _gangCount(profile?: Profile): number {
    return clampGangCount((profile || this._draft)?.gang_count ?? 4);
  }

  private _gangIndexes(profile?: Profile): number[] {
    const count = this._gangCount(profile);
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  private _covers(profile?: Profile): CoverConfig[] {
    return normalizeCovers(profile || this._draft || undefined);
  }

  private _coverConfig(profile?: Profile, coverId?: string): CoverConfig {
    const covers = this._covers(profile);
    if (coverId) {
      return covers.find((cover) => cover.id === coverId) || covers[0] || normalizeCover(undefined);
    }
    return covers[0] || normalizeCover(undefined);
  }

  private _buttonRole(buttonIndex: number): ButtonRole {
    const button = this._draft?.buttons.find((item) => item.index === buttonIndex);
    return (button?.role || "toggle") as ButtonRole;
  }

  private _isCoverButton(buttonIndex: number): boolean {
    return this._coverDirectionFor(buttonIndex) != null;
  }

  private _coverDirectionFor(buttonIndex: number): "open" | "close" | null {
    if (!this._draft) {
      return null;
    }
    if (this._draft.mode === "mixed") {
      const role = this._buttonRole(buttonIndex);
      if (role === "cover_open") return "open";
      if (role === "cover_close") return "close";
      return null;
    }
    if (this._draft.mode !== "cover") {
      return null;
    }
    for (const cover of this._covers()) {
      if (cover.open_button === buttonIndex) return "open";
      if (cover.close_button === buttonIndex) return "close";
    }
    return null;
  }

  private _coverForButton(buttonIndex: number): CoverConfig | null {
    if (!this._draft) {
      return null;
    }
    if (this._draft.mode === "mixed") {
      const button = this._draft.buttons.find((item) => item.index === buttonIndex);
      const role = (button?.role || "toggle") as ButtonRole;
      if (role !== "cover_open" && role !== "cover_close") {
        return null;
      }
      const coverId =
        String(button?.cover_id || this._covers()[0]?.id || "cover_1").trim() ||
        "cover_1";
      return (
        this._covers().find((cover) => cover.id === coverId) ||
        this._covers().find(
          (cover) =>
            cover.open_button === buttonIndex || cover.close_button === buttonIndex
        ) ||
        null
      );
    }
    return (
      this._covers().find(
        (cover) => cover.open_button === buttonIndex || cover.close_button === buttonIndex
      ) || null
    );
  }

  private _patchCovers(mutate: (covers: CoverConfig[], draft: Profile) => void): void {
    this._patchDraft((draft) => {
      const covers = normalizeCovers(draft);
      mutate(covers, draft);
      draft.covers = normalizeCovers({ ...draft, covers });
      delete draft.cover;
    });
  }

  private _setGangCount(count: number): void {
    this._patchDraft((draft) => {
      draft.gang_count = clampGangCount(count);
      draft.mode = coerceModeForGangCount(draft.mode, draft.gang_count) as Profile["mode"];
      draft.covers = normalizeCovers(draft);
      delete draft.cover;
      if (draft.radio_groups) {
        draft.radio_groups = draft.radio_groups.map((group) => ({
          ...group,
          buttons: group.buttons.filter((index) => index <= draft.gang_count),
        }));
      }
      if (
        draft.selected_button != null &&
        (draft.selected_button < 1 || draft.selected_button > draft.gang_count)
      ) {
        draft.selected_button = null;
      }
    });
  }

  private _setMode(mode: Profile["mode"]): void {
    if (
      !this._draft ||
      !modesForGangCount(
        this._panel?.capabilities.modes || [mode],
        this._gangCount()
      ).includes(mode)
    ) {
      return;
    }
    this._clearFaceplatePreview();
    this._patchDraft((draft) => {
      draft.mode = mode;
      if (draft.mode === "cover") {
        // 4-gang panels need gang_count=4 so two covers (floor(n/2)) are available.
        const gangs = clampGangCount(draft.gang_count ?? 4);
        draft.gang_count = gangs < 4 ? 4 : gangs;
        draft.covers = normalizeCovers(draft);
        delete draft.cover;
      } else if (draft.mode === "radio_split" || draft.mode === "mixed") {
        this._ensureRadioGroups(draft);
        if (draft.mode === "radio_split") {
          this._setRadioGroupsOpen(true);
        }
      } else if (
        draft.mode !== "toggle" &&
        (draft.selected_button == null ||
          !draft.buttons.some(
            (b) =>
              b.index === draft.selected_button && b.radio_member !== false
          ))
      ) {
        const firstMember =
          draft.buttons.find((b) => b.radio_member !== false)?.index ?? 1;
        draft.selected_button = firstMember;
      }
    });
  }

  private _setButtonRole(buttonIndex: number, role: ButtonRole): void {
    this._patchDraft((draft) => {
      const button = draft.buttons.find((item) => item.index === buttonIndex);
      if (!button) {
        return;
      }
      const allowed = rolesForGangCount(draft.gang_count);
      if (!allowed.includes(role)) {
        return;
      }
      button.role = role;
      if (role === "momentary") {
        button.pulse_time_s = clampPulseTime(
          button.pulse_time_s,
          DEFAULT_PULSE_TIME
        );
        button.cover_id = null;
      } else if (role === "cover_open" || role === "cover_close") {
        button.cover_id = String(button.cover_id || "cover_1").trim() || "cover_1";
        // Keep covers timing blocks available for the assigned id.
        draft.covers = normalizeCovers(draft);
        const cover = draft.covers.find((item) => item.id === button.cover_id);
        if (cover) {
          if (role === "cover_open") {
            cover.open_button = buttonIndex;
          } else {
            cover.close_button = buttonIndex;
          }
        }
      } else {
        button.cover_id = null;
      }
      if (role === "radio") {
        this._ensureRadioGroups(draft);
        this._setRadioGroupsOpen(true);
      } else if (draft.radio_groups) {
        draft.radio_groups = draft.radio_groups.map((group) => ({
          ...group,
          buttons: group.buttons.filter((index) => index !== buttonIndex),
        }));
      }
    });
  }

  private _setButtonCoverId(buttonIndex: number, coverId: string): void {
    this._patchDraft((draft) => {
      const button = draft.buttons.find((item) => item.index === buttonIndex);
      if (!button) {
        return;
      }
      const role = button.role || "toggle";
      if (role !== "cover_open" && role !== "cover_close") {
        return;
      }
      draft.covers = normalizeCovers(draft);
      const nextId =
        String(coverId || "").trim() ||
        draft.covers[0]?.id ||
        "cover_1";
      button.cover_id = nextId;
      let cover = draft.covers.find((item) => item.id === nextId);
      if (!cover) {
        draft.covers = normalizeCovers({
          ...draft,
          covers: [
            ...draft.covers,
            {
              id: nextId,
              open_button: role === "cover_open" ? buttonIndex : 1,
              close_button: role === "cover_close" ? buttonIndex : 2,
              open_time_s: 20,
              close_time_s: 20,
              direction_settle_s: 0.5,
              opposite_press: "stop_only",
            },
          ],
        });
        cover = draft.covers.find((item) => item.id === nextId);
      }
      if (!cover) {
        return;
      }
      if (role === "cover_open") {
        cover.open_button = buttonIndex;
      } else {
        cover.close_button = buttonIndex;
      }
    });
  }

  /**
   * Assign a panel button to a direction. Choosing the button already used by
   * the other direction swaps them, so the pair can never collapse onto one
   * button and leave the motor without a stop path. Buttons owned by another
   * cover are refused.
   */
  private _setCoverButton(
    coverId: string,
    direction: "open" | "close",
    buttonIndex: number
  ): void {
    this._patchCovers((covers) => {
      const cover = covers.find((item) => item.id === coverId);
      if (!cover) {
        return;
      }
      const ownedElsewhere = covers.some(
        (item) =>
          item.id !== coverId &&
          (item.open_button === buttonIndex || item.close_button === buttonIndex)
      );
      if (ownedElsewhere) {
        return;
      }
      const previous = direction === "open" ? cover.open_button : cover.close_button;
      if (direction === "open") {
        if (cover.close_button === buttonIndex) {
          cover.close_button = previous;
        }
        cover.open_button = buttonIndex;
      } else {
        if (cover.open_button === buttonIndex) {
          cover.open_button = previous;
        }
        cover.close_button = buttonIndex;
      }
    });
  }

  private _setCoverTime(
    coverId: string,
    direction: "open" | "close",
    value: number
  ): void {
    const seconds = Math.max(
      COVER_TIME_MIN,
      Math.min(COVER_TIME_MAX, Number.isFinite(value) ? value : COVER_TIME_MIN)
    );
    this._patchCovers((covers) => {
      const cover = covers.find((item) => item.id === coverId);
      if (!cover) {
        return;
      }
      if (direction === "open") {
        cover.open_time_s = seconds;
      } else {
        cover.close_time_s = seconds;
      }
    });
  }

  private _setCoverHaEntity(coverId: string, entityId: string): void {
    const cleaned = entityId.trim();
    const next =
      cleaned && cleaned.startsWith("cover.") ? cleaned : null;
    this._patchCovers((covers) => {
      const cover = covers.find((item) => item.id === coverId);
      if (!cover) {
        return;
      }
      cover.ha_entity_id = next;
    });
  }

  private _getCoverEntityFilter(coverId: string): string {
    return this._pickerFilter[`cover:${coverId}`] || "";
  }

  private _setCoverEntityFilter(coverId: string, value: string): void {
    const key = `cover:${coverId}`;
    const next = value.trim().toLowerCase();
    if ((this._pickerFilter[key] || "") === next) {
      return;
    }
    this._pickerFilter = { ...this._pickerFilter, [key]: next };
  }

  private _onCoverHaEntityPickerChanged(coverId: string, e: Event): void {
    e.stopPropagation();
    const detail = (e as CustomEvent<{ value?: string | null }>).detail;
    this._setCoverHaEntity(coverId, detail?.value ?? "");
  }

  private _renderCoverHaEntityPicker(cover: CoverConfig) {
    const entityId = (cover.ha_entity_id || "").trim();
    const useHaEntityPicker = this._haEntityPickerReady && !!this.hass;
    const entityOptions = withCurrentOption(
      listEntityIds(this.hass?.states, "cover"),
      entityId
    );
    const entityFilter = this._getCoverEntityFilter(cover.id);
    const filteredEntities = this._filterOptions(entityOptions, entityFilter);
    return html`
      <label class="field mixed-cover-ha-entity" data-cover-ha-entity=${cover.id}>
        <span>${this.t("card.cover_ha_entity")}</span>
        ${useHaEntityPicker
          ? html`
              <ha-entity-picker
                data-cover-ha-entity-picker
                data-cover-id=${cover.id}
                .hass=${this.hass}
                .value=${entityId || undefined}
                .includeDomains=${["cover"]}
                allow-custom-entity
                ?disabled=${this._busy}
                @value-changed=${(e: Event) =>
                  this._onCoverHaEntityPickerChanged(cover.id, e)}
              ></ha-entity-picker>
            `
          : html`
              <input
                type="search"
                class="picker-filter"
                data-cover-ha-entity-filter
                data-cover-id=${cover.id}
                placeholder=${this.t("card.picker_search")}
                .value=${entityFilter}
                ?disabled=${this._busy}
                @input=${(e: Event) =>
                  this._setCoverEntityFilter(
                    cover.id,
                    (e.target as HTMLInputElement).value
                  )}
              />
              <div class="select-wrap select-wrap-wide">
                <select
                  data-cover-ha-entity-picker
                  data-cover-id=${cover.id}
                  .value=${entityId}
                  ?disabled=${this._busy}
                  @change=${(e: Event) =>
                    this._setCoverHaEntity(
                      cover.id,
                      (e.target as HTMLSelectElement).value
                    )}
                >
                  <option value="">${this.t("card.cover_ha_entity_none")}</option>
                  ${filteredEntities.map(
                    (id) => html`<option value=${id}>${id}</option>`
                  )}
                </select>
              </div>
            `}
      </label>
    `;
  }

  private _addCover(): void {
    this._patchCovers((covers, draft) => {
      const maxCovers = maxCoversForGangs(draft.gang_count);
      if (covers.length >= maxCovers) {
        return;
      }
      const used = new Set(
        covers.flatMap((cover) => [cover.open_button, cover.close_button])
      );
      const free = this._gangIndexes(draft).filter((index) => !used.has(index));
      const openButton = free[0] ?? 1;
      const closeButton = free[1] ?? Math.min(openButton + 1, draft.gang_count);
      covers.push(
        normalizeCover(
          { open_button: openButton, close_button: closeButton },
          {
            gangCount: draft.gang_count,
            defaultId: `cover_${covers.length + 1}`,
            slot: covers.length,
          }
        )
      );
    });
  }

  private _removeCover(coverId: string): void {
    this._patchCovers((covers) => {
      if (covers.length <= 1) {
        return;
      }
      const next = covers.filter((cover) => cover.id !== coverId);
      covers.splice(0, covers.length, ...next);
    });
  }

  private async _coverCommand(
    command: "open" | "close" | "stop",
    coverId?: string
  ): Promise<void> {
    if (!this.hass || !this._config) {
      return;
    }
    this._busy = true;
    this._error = undefined;
    try {
      const state = await coverCommand(
        this.hass,
        this._config.entry_id,
        command,
        coverId
      );
      if (this._panel) {
        this._panel = { ...this._panel, cover_state: state };
      }
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._busy = false;
    }
  }

  private _coverStateLabel(coverId?: string): string {
    const live = this._panel?.cover_state;
    if (coverId && live?.covers?.length) {
      const item = live.covers.find((cover) => cover.id === coverId);
      return this.t(`card.cover_state_${item?.state || "idle"}`);
    }
    return this.t(`card.cover_state_${live?.state || "idle"}`);
  }

  private _renderGangPicker() {
    if (!this._draft) {
      return nothing;
    }
    const selected = this._gangCount();
    return html`
      <label class="field">
        <span>${this.t("card.gang_count")}</span>
        <div class="gang-picker" role="radiogroup" dir="ltr" data-gang-picker>
          ${[1, 2, 3, 4].map(
            (count) => html`
              <button
                type="button"
                class="radio-member ${selected === count ? "on" : ""}"
                role="radio"
                aria-checked=${selected === count ? "true" : "false"}
                ?disabled=${this._busy}
                @click=${() => this._setGangCount(count)}
              >
                <span class="radio-member-label">${count}</span>
              </button>
            `
          )}
        </div>
        <p class="radio-groups-hint">${this.t("card.gang_count_hint")}</p>
      </label>
    `;
  }

  private _renderCoverButtonPicker(
    cover: CoverConfig,
    direction: "open" | "close"
  ) {
    const selected = direction === "open" ? cover.open_button : cover.close_button;
    const ownedByOther = new Set(
      this._covers()
        .filter((item) => item.id !== cover.id)
        .flatMap((item) => [item.open_button, item.close_button])
    );
    return html`
      <div
        class="cover-buttons"
        role="radiogroup"
        dir="ltr"
        style="--conx-gang-count:${this._gangCount()}"
      >
        ${this._gangIndexes().map(
          (buttonIndex) => html`
            <button
              type="button"
              class="radio-member ${selected === buttonIndex ? "on" : ""}"
              role="radio"
              aria-checked=${selected === buttonIndex ? "true" : "false"}
              ?disabled=${this._busy || ownedByOther.has(buttonIndex)}
              @click=${() => this._setCoverButton(cover.id, direction, buttonIndex)}
            >
              <span class="radio-member-label">L${buttonIndex}</span>
            </button>
          `
        )}
      </div>
    `;
  }

  /** First cover-role button index that owns timing for a given motor slot. */
  private _firstCoverRoleIndex(coverId: string): number | null {
    if (!this._draft) {
      return null;
    }
    const id = String(coverId || "cover_1").trim() || "cover_1";
    const match = this._draft.buttons.find(
      (button) =>
        button.index <= this._gangCount() &&
        (button.role === "cover_open" || button.role === "cover_close") &&
        (String(button.cover_id || "cover_1").trim() || "cover_1") === id
    );
    return match?.index ?? null;
  }

  private _renderInlineCoverTimeFields(cover: CoverConfig) {
    const limits = this._panel?.capabilities.cover;
    const minTime = limits?.min_time_s ?? COVER_TIME_MIN;
    const maxTime = limits?.max_time_s ?? COVER_TIME_MAX;
    const unit = this.t("card.cover_seconds");
    return html`
      <label class="field">
        <span>${this.t("card.cover_open_time")} (${unit})</span>
        <input
          type="number"
          data-cover-open-time
          min=${minTime}
          max=${maxTime}
          step="0.5"
          .value=${String(cover.open_time_s)}
          ?disabled=${this._busy}
          @change=${(e: Event) =>
            this._setCoverTime(
              cover.id,
              "open",
              Number((e.target as HTMLInputElement).value)
            )}
        />
      </label>
      <label class="field">
        <span>${this.t("card.cover_close_time")} (${unit})</span>
        <input
          type="number"
          data-cover-close-time
          min=${minTime}
          max=${maxTime}
          step="0.5"
          .value=${String(cover.close_time_s)}
          ?disabled=${this._busy}
          @change=${(e: Event) =>
            this._setCoverTime(
              cover.id,
              "close",
              Number((e.target as HTMLInputElement).value)
            )}
        />
      </label>
      <label class="field">
        <span>${this.t("card.cover_settle")} (${unit})</span>
        <input
          type="number"
          data-cover-settle
          min=${limits?.min_settle_s ?? COVER_SETTLE_MIN}
          max=${limits?.max_settle_s ?? COVER_SETTLE_MAX}
          step="0.1"
          .value=${String(cover.direction_settle_s)}
          ?disabled=${this._busy}
          @change=${(e: Event) => {
            const value = Number((e.target as HTMLInputElement).value);
            this._patchCovers((covers) => {
              const target = covers.find((item) => item.id === cover.id);
              if (!target) return;
              target.direction_settle_s = Math.max(
                COVER_SETTLE_MIN,
                Math.min(
                  COVER_SETTLE_MAX,
                  Number.isFinite(value) ? value : 0
                )
              );
            });
          }}
        />
      </label>
      <label class="field field-compact-select">
        <span>${this.t("card.cover_opposite")}</span>
        <div class="select-wrap">
          <select
            data-cover-opposite
            .value=${cover.opposite_press}
            ?disabled=${this._busy}
            @change=${(e: Event) => {
              const value = (e.target as HTMLSelectElement).value;
              this._patchCovers((covers) => {
                const target = covers.find((item) => item.id === cover.id);
                if (!target) return;
                target.opposite_press =
                  value === "stop_then_reverse"
                    ? "stop_then_reverse"
                    : "stop_only";
              });
            }}
          >
            <option value="stop_only">${this.t("cover.stop_only")}</option>
            <option value="stop_then_reverse">
              ${this.t("cover.stop_then_reverse")}
            </option>
          </select>
        </div>
      </label>
    `;
  }

  private _renderMixedCoverExtras(options: {
    buttonIndex: number;
    cover: CoverConfig;
    coverId: string;
    covers: CoverConfig[];
    multiCover: boolean;
    showTimes: boolean;
    showTimesPointer: boolean;
    timesOwner: number | null;
  }) {
    const {
      buttonIndex,
      cover,
      coverId,
      covers,
      multiCover,
      showTimes,
      showTimesPointer,
      timesOwner,
    } = options;
    return html`
      <div class="mixed-cover-extras" data-mixed-cover-extras>
        <div
          class="mixed-cover-grid"
          data-mixed-cover-grid
          data-inline-cover-times=${showTimes ? cover.id : nothing}
        >
          ${multiCover
            ? html`
                <label class="field mixed-cover-id">
                  <span>${this.t("card.cover_id")}</span>
                  <div class="select-wrap">
                    <select
                      data-cover-id
                      .value=${coverId}
                      ?disabled=${this._busy || covers.length === 0}
                      @change=${(e: Event) =>
                        this._setButtonCoverId(
                          buttonIndex,
                          (e.target as HTMLSelectElement).value
                        )}
                    >
                      ${covers.map(
                        (item) => html`
                          <option value=${item.id}>${item.id}</option>
                        `
                      )}
                    </select>
                  </div>
                </label>
              `
            : html`
                <div class="field mixed-cover-slot-field">
                  <span>${this.t("card.cover_id")}</span>
                  <span
                    class="mixed-cover-slot"
                    data-cover-id
                    data-cover-slot=${coverId}
                    >${coverId}</span
                  >
                </div>
              `}
          ${this._renderCoverHaEntityPicker(cover)}
          ${showTimes ? this._renderInlineCoverTimeFields(cover) : nothing}
        </div>
        ${showTimesPointer && timesOwner != null
          ? html`<p
              class="radio-groups-hint mixed-cover-times-on"
              data-mixed-cover-times-on
            >
              ${this.t("card.mixed_cover_times_on").replace(
                "{n}",
                String(timesOwner)
              )}
            </p>`
          : nothing}
      </div>
    `;
  }

  private _renderOneCoverEditor(cover: CoverConfig, index: number) {
    const limits = this._panel?.capabilities.cover;
    const minTime = limits?.min_time_s ?? COVER_TIME_MIN;
    const maxTime = limits?.max_time_s ?? COVER_TIME_MAX;
    const unit = this.t("card.cover_seconds");
    const canRemove = this._covers().length > 1;
    return html`
      <div class="cover-block" data-cover-id=${cover.id}>
        <div class="cover-head">
          <span class="menu-label"
            >${this.t("card.cover")} ${index + 1}</span
          >
          ${canRemove
            ? html`<button
                type="button"
                class="btn danger"
                ?disabled=${this._busy}
                @click=${() => this._removeCover(cover.id)}
              >
                ${this.t("card.cover_remove")}
              </button>`
            : nothing}
        </div>
        <div class="cover-grid">
          <div class="cover-field">
            <span class="cover-label">${this.t("card.cover_open_button")}</span>
            ${this._renderCoverButtonPicker(cover, "open")}
          </div>
          <div class="cover-field">
            <span class="cover-label">${this.t("card.cover_close_button")}</span>
            ${this._renderCoverButtonPicker(cover, "close")}
          </div>
        </div>
        ${this._renderCoverHaEntityPicker(cover)}
        <div class="cover-times cover-times-compact">
          <label class="field">
            <span>${this.t("card.cover_open_time")} (${unit})</span>
            <input
              type="number"
              data-cover-open-time
              min=${minTime}
              max=${maxTime}
              step="0.5"
              .value=${String(cover.open_time_s)}
              ?disabled=${this._busy}
              @change=${(e: Event) =>
                this._setCoverTime(
                  cover.id,
                  "open",
                  Number((e.target as HTMLInputElement).value)
                )}
            />
          </label>
          <label class="field">
            <span>${this.t("card.cover_close_time")} (${unit})</span>
            <input
              type="number"
              data-cover-close-time
              min=${minTime}
              max=${maxTime}
              step="0.5"
              .value=${String(cover.close_time_s)}
              ?disabled=${this._busy}
              @change=${(e: Event) =>
                this._setCoverTime(
                  cover.id,
                  "close",
                  Number((e.target as HTMLInputElement).value)
                )}
            />
          </label>
          <label class="field">
            <span>${this.t("card.cover_settle")} (${unit})</span>
            <input
              type="number"
              data-cover-settle
              min=${limits?.min_settle_s ?? COVER_SETTLE_MIN}
              max=${limits?.max_settle_s ?? COVER_SETTLE_MAX}
              step="0.1"
              .value=${String(cover.direction_settle_s)}
              ?disabled=${this._busy}
              @change=${(e: Event) => {
                const value = Number((e.target as HTMLInputElement).value);
                this._patchCovers((covers) => {
                  const target = covers.find((item) => item.id === cover.id);
                  if (!target) return;
                  target.direction_settle_s = Math.max(
                    COVER_SETTLE_MIN,
                    Math.min(
                      COVER_SETTLE_MAX,
                      Number.isFinite(value) ? value : 0
                    )
                  );
                });
              }}
            />
          </label>
        </div>
        <p class="radio-groups-hint">${this.t("card.cover_settle_hint")}</p>
        <label class="field field-compact-select">
          <span>${this.t("card.cover_opposite")}</span>
          <div class="select-wrap">
            <select
              data-cover-opposite
              .value=${cover.opposite_press}
              ?disabled=${this._busy}
              @change=${(e: Event) => {
                const value = (e.target as HTMLSelectElement).value;
                this._patchCovers((covers) => {
                  const target = covers.find((item) => item.id === cover.id);
                  if (!target) return;
                  target.opposite_press =
                    value === "stop_then_reverse"
                      ? "stop_then_reverse"
                      : "stop_only";
                });
              }}
            >
              <option value="stop_only">${this.t("cover.stop_only")}</option>
              <option value="stop_then_reverse">
                ${this.t("cover.stop_then_reverse")}
              </option>
            </select>
          </div>
        </label>
        ${cover.open_button === cover.close_button
          ? html`<div class="radio-groups-error">
              ${this.t("card.cover_same_button")}
            </div>`
          : nothing}
      </div>
    `;
  }

  private _renderEmptyCoverSlot(index: number) {
    return html`
      <div class="cover-block cover-block-empty" data-cover-slot=${index}>
        <div class="cover-head">
          <span class="menu-label"
            >${this.t("card.cover")} ${index + 1}</span
          >
          <span class="cover-slot-status">${this.t("card.cover_slot_empty")}</span>
        </div>
        <p class="radio-groups-hint">${this.t("card.cover_slot_hint")}</p>
        <button
          type="button"
          class="btn primary cover-add-slot"
          data-cover-add
          ?disabled=${this._busy}
          @click=${() => this._addCover()}
        >
          ${this.t("card.cover_add")}
        </button>
      </div>
    `;
  }

  private _renderCoverEditor() {
    if (!this._draft || this._draft.mode !== "cover") {
      // Free-mix travel times live inside the cover-role cards — no bottom block.
      return nothing;
    }
    const covers = this._covers();
    const maxCovers = maxCoversForGangs(this._gangCount());
    const slots = Array.from(
      { length: Math.max(maxCovers, covers.length) },
      (_, index) => covers[index] ?? null
    );
    return html`
      <div class="cover-section" data-cover-editor>
        <div class="cover-head">
          <span class="menu-label">${this.t("card.cover")}</span>
        </div>
        <p class="radio-groups-hint">${this.t("card.cover_hint")}</p>
        ${this._renderGangPicker()}
        ${slots.map((cover, index) =>
          cover
            ? this._renderOneCoverEditor(cover, index)
            : this._renderEmptyCoverSlot(index)
        )}
        <p class="cover-safety">${this.t("card.cover_safety")}</p>
      </div>
    `;
  }

  /** Live open/close/stop, routed through the backend engine (never direct relays). */
  private _renderCoverControl() {
    // Operate mode: faceplate only — physical panel / settings still drive covers.
    if (this._operateMode) {
      return nothing;
    }
    const mode = this._saved?.mode;
    if (mode !== "cover" && mode !== "mixed") {
      return nothing;
    }
    if (
      mode === "mixed" &&
      !this._saved?.buttons?.some(
        (button) =>
          button.role === "cover_open" || button.role === "cover_close"
      )
    ) {
      return nothing;
    }
    const covers = this._covers(this._saved);
    return html`
      <div class="cover-control" data-cover-control>
        ${covers.map((cover) => {
          const live = this._panel?.cover_state?.covers?.find(
            (item) => item.id === cover.id
          );
          const state = live?.state || (covers.length === 1
            ? this._panel?.cover_state?.state || "idle"
            : "idle");
          return html`
            <div class="cover-control-block" data-cover-id=${cover.id}>
              <div class="cover-control-head">
                <span class="menu-label"
                  >${this.t("card.cover_live")}${covers.length > 1
                    ? ` · ${cover.id}`
                    : ""}</span
                >
                <span class="cover-state cover-state-${state}"
                  >${this._coverStateLabel(cover.id)}</span
                >
              </div>
              <div class="cover-control-row">
                <button
                  type="button"
                  class="btn"
                  data-cover-open
                  ?disabled=${this._busy}
                  @click=${() => this._coverCommand("open", cover.id)}
                >
                  ${this.t("card.cover_open")}
                </button>
                <button
                  type="button"
                  class="btn danger"
                  data-cover-stop
                  ?disabled=${this._busy}
                  @click=${() => this._coverCommand("stop", cover.id)}
                >
                  ${this.t("card.cover_stop")}
                </button>
                <button
                  type="button"
                  class="btn"
                  data-cover-close
                  ?disabled=${this._busy}
                  @click=${() => this._coverCommand("close", cover.id)}
                >
                  ${this.t("card.cover_close")}
                </button>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private async _guardDirty(): Promise<boolean> {
    if (!this._dirty) {
      return true;
    }
    return window.confirm(this.t("card.unsaved"));
  }

  private async _selectProfile(profileId: string): Promise<void> {
    if (!(await this._guardDirty()) || !this.hass || !this._config) {
      return;
    }
    this._busy = true;
    try {
      const panel = await setActiveProfile(
        this.hass,
        this._config.entry_id,
        profileId,
        false
      );
      this._applyPanel(panel);
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._busy = false;
    }
  }

  private async _saveDraft(): Promise<void> {
    if (!this.hass || !this._config || !this._draft) {
      return;
    }
    this._busy = true;
    this._error = undefined;
    try {
      const saved = await updateProfile(
        this.hass,
        this._config.entry_id,
        this._draft.id,
        this._draft
      );
      const panel = await fetchConfig(this.hass, this._config.entry_id);
      this._applyPanel(panel);
      this._saved = cloneProfile(saved);
      this._draft = cloneProfile(saved);
      this._migrateBrokenWarmLedDraftColors();
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._busy = false;
    }
  }

  private _discard(): void {
    if (this._saved) {
      this._draft = cloneProfile(this._saved);
      this._migrateBrokenWarmLedDraftColors();
      this._clearFaceplatePreview();
    }
  }

  private async _sync(): Promise<void> {
    if (!this.hass || !this._config) {
      return;
    }
    if (this._dirty) {
      await this._saveDraft();
    }
    this._busy = true;
    this._error = undefined;
    this._syncPulse = true;
    try {
      const panel = await syncPanel(this.hass, this._config.entry_id);
      this._applyPanel(panel);
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
      if (this._config) {
        await this._load();
      }
    } finally {
      this._busy = false;
      window.setTimeout(() => {
        this._syncPulse = false;
      }, 700);
    }
  }

  private async _pull(): Promise<void> {
    if (!this.hass || !this._config) {
      return;
    }
    if (!(await this._guardDirty())) {
      return;
    }
    this._busy = true;
    this._error = undefined;
    try {
      const panel = await pullPanel(this.hass, this._config.entry_id);
      this._applyPanel(panel);
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._busy = false;
    }
  }

  private async _createProfile(): Promise<void> {
    if (!this.hass || !this._config || !this._panel) {
      return;
    }
    if (!(await this._guardDirty())) {
      return;
    }
    const id = `profile_${Date.now()}`;
    const profile: Profile = {
      id,
      name: `Profile ${Object.keys(this._panel.profiles).length + 1}`,
      mode: "toggle",
      color_on: "cyan",
      color_off: "blue",
      radar: "30s",
      backlight: true,
      backlight_brightness: 100,
      child_lock: false,
      selected_button: null,
      gang_count: this._gangCount(this._draft || undefined),
      buttons: [1, 2, 3, 4].map((index) => ({
        index,
        name: `Button ${index}`,
        action: null,
        radio_member: true,
      })),
    };
    this._busy = true;
    try {
      await createProfile(this.hass, this._config.entry_id, profile);
      const panel = await setActiveProfile(
        this.hass,
        this._config.entry_id,
        id,
        false
      );
      this._applyPanel(panel);
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._busy = false;
    }
  }

  private async _duplicateProfile(): Promise<void> {
    if (!this.hass || !this._config || !this._draft) {
      return;
    }
    if (!(await this._guardDirty())) {
      return;
    }
    const newId = `${this._draft.id}_copy_${Date.now()}`;
    this._busy = true;
    try {
      await duplicateProfile(
        this.hass,
        this._config.entry_id,
        this._draft.id,
        newId,
        `${this._draft.name} copy`
      );
      const panel = await setActiveProfile(
        this.hass,
        this._config.entry_id,
        newId,
        false
      );
      this._applyPanel(panel);
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._busy = false;
    }
  }

  private _renameProfile(): void {
    if (!this._draft) {
      return;
    }
    const name = window.prompt(this.t("card.rename"), this._draft.name);
    if (!name) {
      return;
    }
    this._draft.name = name;
    this.requestUpdate();
  }

  private async _deleteProfile(): Promise<void> {
    if (!this.hass || !this._config || !this._draft || !this._panel) {
      return;
    }
    if (Object.keys(this._panel.profiles).length <= 1) {
      this._error = "At least one profile must remain";
      return;
    }
    if (!window.confirm(`${this.t("card.delete")} ${this._draft.name}?`)) {
      return;
    }
    this._busy = true;
    try {
      await deleteProfile(this.hass, this._config.entry_id, this._draft.id);
      await this._load();
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._busy = false;
    }
  }

  private async _export(): Promise<void> {
    if (!this.hass || !this._config || !this._panel) {
      return;
    }
    this._busy = true;
    this._error = undefined;
    try {
      const payload = await exportProfiles(this.hass, this._config.entry_id);
      const safeName = this._panel.panel_name.replace(/[^\w.-]+/g, "_");
      downloadJson(`conx-profiles-${safeName}.json`, payload);
      this._refreshServiceYaml(payload);
      this._notice = this.t("card.export_ok");
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._busy = false;
    }
  }

  private _openImport(): void {
    if (!this._importInput) {
      this._importInput = document.createElement("input");
      this._importInput.type = "file";
      this._importInput.accept = "application/json,.json";
      this._importInput.hidden = true;
      this.renderRoot.appendChild(this._importInput);
    }
    this._importInput.onchange = () => {
      const file = this._importInput?.files?.[0];
      this._importInput!.value = "";
      if (file) {
        void this._importFile(file, this._importMode);
      }
    };
    this._importInput.click();
  }

  private async _importFile(
    file: File,
    mode: "merge" | "replace"
  ): Promise<void> {
    if (!this.hass || !this._config) {
      return;
    }
    if (!(await this._guardDirty())) {
      return;
    }
    this._busy = true;
    this._error = undefined;
    try {
      const text = await file.text();
      const parsed = validateProfilesExport(JSON.parse(text));
      if (!parsed.ok) {
        throw new Error(parsed.error || this.t("card.import_invalid"));
      }
      const panel = await importProfiles(
        this.hass,
        this._config.entry_id,
        parsed.payload,
        mode
      );
      this._applyPanel(panel);
      this._refreshServiceYaml(parsed.payload);
      this._notice = this.t("card.import_ok");
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._busy = false;
    }
  }

  /** In-place draft mutation keeps text inputs focused while typing. */
  private _patchDraft(mutate: (draft: Profile) => void): void {
    if (!this._draft) {
      return;
    }
    mutate(this._draft);
    this.requestUpdate();
  }

  private _onProfileNameInput(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this._patchDraft((draft) => {
      draft.name = value;
    });
  }

  private _onButtonNameInput(index: number, e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this._patchDraft((draft) => {
      const button = draft.buttons.find((item) => item.index === index);
      if (button) {
        button.name = value;
      }
    });
  }

  private async _ensureHaEntityPicker(): Promise<void> {
    if (this._haPickerLoadStarted) {
      return;
    }
    this._haPickerLoadStarted = true;
    if (isHaEntityPickerRegistered()) {
      this._haEntityPickerReady = true;
    }
    if (isHaServicePickerRegistered()) {
      this._haServicePickerReady = true;
    }
    if (this._haEntityPickerReady && this._haServicePickerReady) {
      return;
    }
    const ready = await ensureHaPickersLoaded();
    this._haEntityPickerReady = ready.entity;
    this._haServicePickerReady = ready.service;
  }

  private _pickerFilterKey(
    kind: "action" | "entity",
    buttonIndex: number
  ): string {
    return `${kind}:${buttonIndex}`;
  }

  private _getPickerFilter(
    kind: "action" | "entity",
    buttonIndex: number
  ): string {
    return this._pickerFilter[this._pickerFilterKey(kind, buttonIndex)] || "";
  }

  private _setPickerFilter(
    kind: "action" | "entity",
    buttonIndex: number,
    value: string
  ): void {
    const key = this._pickerFilterKey(kind, buttonIndex);
    const next = value.trim().toLowerCase();
    if ((this._pickerFilter[key] || "") === next) {
      return;
    }
    this._pickerFilter = { ...this._pickerFilter, [key]: next };
  }

  private _filterOptions(options: string[], needle: string): string[] {
    if (!needle) {
      return options;
    }
    return options.filter((item) => item.toLowerCase().includes(needle));
  }

  private _onHaServicePickerChanged(index: number, e: Event): void {
    e.stopPropagation();
    const detail = (e as CustomEvent<{ value?: string | null }>).detail;
    const action = (detail?.value ?? "").trim();
    this._setButtonAction(index, action);
  }

  private _setButtonAction(index: number, action: string, entityId?: string | null): void {
    const nextAction = action.trim();
    this._patchDraft((draft) => {
      const button = draft.buttons.find((item) => item.index === index);
      if (!button) {
        return;
      }
      if (!nextAction) {
        button.action = null;
        return;
      }
      const previousEntity = (
        button.action?.target as { entity_id?: string } | undefined
      )?.entity_id;
      const domain = actionDomain(nextAction);
      let nextEntity =
        entityId === undefined
          ? previousEntity?.trim() || ""
          : (entityId ?? "").trim();
      if (domain && nextEntity && !nextEntity.startsWith(`${domain}.`)) {
        nextEntity = "";
      }
      button.action = {
        action: nextAction,
        target: nextEntity ? { entity_id: nextEntity } : {},
        data: button.action?.data || {},
      };
    });
    if (!nextAction) {
      this._clearActionDataEditor(index);
    }
  }

  private _onButtonActionSelect(index: number, e: Event): void {
    const action = (e.target as HTMLSelectElement).value.trim();
    this._setButtonAction(index, action);
  }

  private _onButtonEntitySelect(index: number, e: Event): void {
    const entityId = (e.target as HTMLSelectElement).value.trim();
    this._patchDraft((draft) => {
      const button = draft.buttons.find((item) => item.index === index);
      if (!button) {
        return;
      }
      const actionName = button.action?.action || "";
      if (!actionName) {
        button.action = null;
        return;
      }
      button.action = {
        action: actionName,
        target: entityId ? { entity_id: entityId } : {},
        data: button.action?.data || {},
      };
    });
  }

  private _onHaEntityPickerChanged(index: number, e: Event): void {
    e.stopPropagation();
    const detail = (e as CustomEvent<{ value?: string | null }>).detail;
    const entityId = (detail?.value ?? "").trim();
    this._onButtonEntitySelect(index, {
      target: { value: entityId },
    } as unknown as Event);
  }

  private _actionDataDisplay(index: number): string {
    if (Object.prototype.hasOwnProperty.call(this._actionDataText, index)) {
      return this._actionDataText[index];
    }
    const button = this._draft?.buttons.find((item) => item.index === index);
    return serializeActionData(button?.action?.data || {});
  }

  private _toggleActionDataOpen(index: number): void {
    this._actionDataOpen = {
      ...this._actionDataOpen,
      [index]: !this._actionDataOpen[index],
    };
  }

  private _clearActionDataEditor(index: number): void {
    if (
      !Object.prototype.hasOwnProperty.call(this._actionDataText, index) &&
      !this._actionDataError[index]
    ) {
      return;
    }
    const nextText = { ...this._actionDataText };
    const nextError = { ...this._actionDataError };
    delete nextText[index];
    delete nextError[index];
    this._actionDataText = nextText;
    this._actionDataError = nextError;
  }

  private _onActionDataInput(index: number, e: Event): void {
    const text = (e.target as HTMLTextAreaElement).value;
    this._actionDataText = { ...this._actionDataText, [index]: text };
    const parsed = parseActionData(text);
    if (!parsed.ok) {
      this._actionDataError = {
        ...this._actionDataError,
        [index]: parsed.error,
      };
      return;
    }
    const nextError = { ...this._actionDataError };
    delete nextError[index];
    this._actionDataError = nextError;
    this._patchDraft((draft) => {
      const button = draft.buttons.find((item) => item.index === index);
      if (!button?.action?.action) {
        return;
      }
      button.action = {
        ...button.action,
        data: parsed.data,
      };
    });
  }

  private _renderActionEntityPickers(
    buttonIndex: number,
    action: string,
    entityId: string
  ) {
    const serviceOptions = withCurrentOption(
      listServiceActions(this.hass?.services),
      action
    );
    const domain = actionDomain(action);
    const entityOptions = withCurrentOption(
      listEntityIds(this.hass?.states, domain),
      entityId
    );
    const useHaEntityPicker = this._haEntityPickerReady && !!this.hass;
    const useHaServicePicker = this._haServicePickerReady && !!this.hass;
    const actionFilter = this._getPickerFilter("action", buttonIndex);
    const entityFilter = this._getPickerFilter("entity", buttonIndex);
    const filteredServices = this._filterOptions(serviceOptions, actionFilter);
    const filteredEntities = this._filterOptions(entityOptions, entityFilter);
    const dataOpen = Boolean(this._actionDataOpen[buttonIndex]);
    const dataText = this._actionDataDisplay(buttonIndex);
    const dataError = this._actionDataError[buttonIndex] || "";
    const hasAction = Boolean(action);
    return html`
      <label class="field">
        <span>${this.t("card.action")}</span>
        ${useHaServicePicker
          ? html`
              <ha-service-picker
                data-action-picker
                data-button=${buttonIndex}
                .hass=${this.hass}
                .value=${action || ""}
                ?disabled=${this._busy}
                @value-changed=${(e: Event) =>
                  this._onHaServicePickerChanged(buttonIndex, e)}
              ></ha-service-picker>
            `
          : html`
              <input
                type="search"
                class="picker-filter"
                data-action-filter
                data-button=${buttonIndex}
                placeholder=${this.t("card.picker_search")}
                .value=${actionFilter}
                ?disabled=${this._busy}
                @input=${(e: Event) =>
                  this._setPickerFilter(
                    "action",
                    buttonIndex,
                    (e.target as HTMLInputElement).value
                  )}
              />
              <div class="select-wrap select-wrap-wide">
                <select
                  data-action-picker
                  data-button=${buttonIndex}
                  .value=${action}
                  ?disabled=${this._busy}
                  @change=${(e: Event) =>
                    this._onButtonActionSelect(buttonIndex, e)}
                >
                  <option value="">${this.t("card.action_none")}</option>
                  ${filteredServices.map(
                    (service) =>
                      html`<option value=${service}>${service}</option>`
                  )}
                </select>
              </div>
            `}
        <span class="field-hint">${this.t("card.action_picker_hint")}</span>
      </label>
      <label class="field">
        <span>${this.t("card.entity_id")}</span>
        ${useHaEntityPicker
          ? html`
              <ha-entity-picker
                data-entity-picker
                data-button=${buttonIndex}
                .hass=${this.hass}
                .value=${entityId || undefined}
                .includeDomains=${domain ? [domain] : undefined}
                allow-custom-entity
                ?disabled=${this._busy || !action}
                @value-changed=${(e: Event) =>
                  this._onHaEntityPickerChanged(buttonIndex, e)}
              ></ha-entity-picker>
            `
          : html`
              <input
                type="search"
                class="picker-filter"
                data-entity-filter
                data-button=${buttonIndex}
                placeholder=${this.t("card.picker_search")}
                .value=${entityFilter}
                ?disabled=${this._busy || !action}
                @input=${(e: Event) =>
                  this._setPickerFilter(
                    "entity",
                    buttonIndex,
                    (e.target as HTMLInputElement).value
                  )}
              />
              <div class="select-wrap select-wrap-wide">
                <select
                  data-entity-picker
                  data-button=${buttonIndex}
                  .value=${entityId}
                  ?disabled=${this._busy || !action}
                  @change=${(e: Event) =>
                    this._onButtonEntitySelect(buttonIndex, e)}
                >
                  <option value="">${this.t("card.entity_none")}</option>
                  ${filteredEntities.map(
                    (id) => html`<option value=${id}>${id}</option>`
                  )}
                </select>
              </div>
            `}
        <span class="field-hint">${this.t("card.entity_picker_hint")}</span>
      </label>
      <div class="action-data-field" data-action-data-field data-button=${buttonIndex}>
        <button
          type="button"
          class="action-data-toggle"
          data-action-data-toggle
          aria-expanded=${dataOpen ? "true" : "false"}
          ?disabled=${this._busy || !hasAction}
          @click=${() => this._toggleActionDataOpen(buttonIndex)}
        >
          <span class="action-data-chevron" aria-hidden="true"></span>
          <span>${this.t("card.action_data")}</span>
        </button>
        ${dataOpen
          ? html`
              <label class="field action-data-editor">
                <textarea
                  class="action-data-box"
                  data-action-data
                  data-button=${buttonIndex}
                  rows="5"
                  dir="ltr"
                  lang="en"
                  spellcheck="false"
                  placeholder=${this.t("card.action_data_placeholder")}
                  .value=${dataText}
                  ?disabled=${this._busy || !hasAction}
                  @input=${(e: Event) =>
                    this._onActionDataInput(buttonIndex, e)}
                ></textarea>
                <span class="field-hint">${this.t("card.action_data_hint")}</span>
                ${dataError
                  ? html`<span class="field-error" data-action-data-error
                      >${this.t("card.action_data_invalid")}: ${dataError}</span
                    >`
                  : nothing}
              </label>
            `
          : nothing}
      </div>
    `;
  }

  private _buttonEntityId(buttonIndex: number): string | null {
    const button = this._draft?.buttons.find((item) => item.index === buttonIndex);
    const entityId = (
      button?.action?.target as { entity_id?: string } | undefined
    )?.entity_id;
    return entityId?.trim() || null;
  }

  private _relayEntityId(buttonIndex: number): string | null {
    const relays = this._panel?.relay_entities;
    if (!relays || buttonIndex < 1 || buttonIndex > relays.length) {
      return null;
    }
    const entityId = relays[buttonIndex - 1];
    return entityId?.trim() || null;
  }

  private _entityIsOn(entityId: string): boolean | null {
    const state = this.hass?.states?.[entityId]?.state;
    if (state === undefined || state === null) {
      return null;
    }
    const normalized = String(state).toLowerCase();
    if (["unavailable", "unknown"].includes(normalized)) {
      return null;
    }
    return ["on", "open", "home", "playing", "active"].includes(normalized);
  }

  /** Live mapped relay state for a 1-based button index, or null if unknown. */
  private _liveRelayOn(buttonIndex: number): boolean | null {
    // hass.states first (Lovelace); subscribe relay_states as fallback / lag fill.
    const entityId = this._relayEntityId(buttonIndex);
    if (entityId) {
      const fromHass = this._entityIsOn(entityId);
      if (fromHass !== null) {
        return fromHass;
      }
    }
    const fromRuntime =
      this._runtimeRelayStates[buttonIndex - 1] ??
      this._panel?.relay_states?.[buttonIndex - 1];
    return fromRuntime === undefined ? null : fromRuntime;
  }

  private _hasOptimisticRing(buttonIndex: number): boolean {
    return Object.prototype.hasOwnProperty.call(this._splitPreviewOn, buttonIndex);
  }

  private _toggleLocalRing(buttonIndex: number): void {
    this._splitPreviewOn = {
      ...this._splitPreviewOn,
      [buttonIndex]: !this._splitPreviewOn[buttonIndex],
    };
  }

  private _isRingOn(buttonIndex: number): boolean {
    if (!this._draft) {
      return false;
    }
    const liveRelay = this._liveRelayOn(buttonIndex);
    const hasOptimistic = this._hasOptimisticRing(buttonIndex);
    const optimistic = Boolean(this._splitPreviewOn[buttonIndex]);
    const pulseArmed = this._momentaryPreviewTimers[buttonIndex] != null;

    const direction = this._coverDirectionFor(buttonIndex);
    if (direction) {
      // Prefer live direction relay, then coordinator cover_state, then preview.
      if (liveRelay !== null) {
        return liveRelay;
      }
      const cover = this._coverForButton(buttonIndex);
      const live = this._panel?.cover_state;
      if (live?.active && cover) {
        const item = live.covers?.find((entry) => entry.id === cover.id);
        if (item) {
          return item.direction === direction;
        }
        if (live.cover_id === cover.id || !live.covers?.length) {
          return live.direction === direction;
        }
        return false;
      }
      return hasOptimistic ? optimistic : false;
    }

    // Mixed momentary: ON if live ON, or local/runtime pulse still armed.
    // Never prefer a cleared optimistic while the timer is still armed.
    if (this._isMomentaryButton(buttonIndex)) {
      if (liveRelay === true) {
        return true;
      }
      if (pulseArmed || (hasOptimistic && optimistic)) {
        return true;
      }
      if (liveRelay === false) {
        return false;
      }
      return hasOptimistic ? optimistic : false;
    }

    // Live mapped relay wins for toggle / radio / radio_split (physical presses).
    if (liveRelay !== null && !hasOptimistic) {
      return liveRelay;
    }
    if (hasOptimistic) {
      return optimistic;
    }
    if (liveRelay !== null) {
      return liveRelay;
    }

    // radio_split, or mixed role=radio: action entity then local group preview.
    // Do NOT treat mixed toggle/momentary as classic radio (that poisoned LEDs
    // and previously mutated selected_button → false Save Draft).
    if (
      this._draft.mode === "radio_split" ||
      (this._draft.mode === "mixed" && this._buttonRole(buttonIndex) === "radio")
    ) {
      const entityId = this._buttonEntityId(buttonIndex);
      if (entityId) {
        const on = this._entityIsOn(entityId);
        if (on !== null) {
          return on;
        }
      }
      return false;
    }
    if (
      (this._draft.mode === "radio_mandatory" ||
        this._draft.mode === "radio_optional") &&
      this._isRadioMember(buttonIndex)
    ) {
      const selected =
        this._radioPreviewSelected ?? this._draft.selected_button;
      return selected === buttonIndex;
    }
    const entityId = this._buttonEntityId(buttonIndex);
    if (entityId) {
      const on = this._entityIsOn(entityId);
      if (on !== null) {
        return on;
      }
    }
    // No live entity / local preview: sample both LED colors.
    return buttonIndex % 2 === 1;
  }

  private _onRingPress(buttonIndex: number): void {
    this._pressedRing = buttonIndex;
    window.setTimeout(() => {
      if (this._pressedRing === buttonIndex) {
        this._pressedRing = null;
      }
    }, 180);
    // Optimistic local LED preview for snappy UI — never mutate the draft
    // (mutating selected_button previously flipped _dirty / Save Draft).
    // Hardware + HA actions are driven via execute_button below.
    if (!this._draft) {
      return;
    }
    const direction = this._coverDirectionFor(buttonIndex);
    if (direction) {
      const cover = this._coverForButton(buttonIndex);
      if (!cover) {
        return;
      }
      const opposite =
        direction === "open" ? cover.close_button : cover.open_button;
      // Preview mirrors the engine: pressing again stops, and the two
      // directions are never lit together.
      this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [buttonIndex]: !this._splitPreviewOn[buttonIndex],
        [opposite]: false,
      };
      void this._dispatchButtonPress(buttonIndex);
      return;
    }
    if (this._draft.mode === "radio_split") {
      const group = this._radioGroupFor(buttonIndex);
      const next = { ...this._splitPreviewOn };
      if (!group) {
        next[buttonIndex] = !next[buttonIndex];
      } else if (next[buttonIndex]) {
        // Classic radio within group: re-pressing selected does nothing.
        return;
      } else {
        for (const index of group.buttons) {
          next[index] = index === buttonIndex;
        }
      }
      this._splitPreviewOn = next;
      void this._dispatchButtonPress(buttonIndex);
      return;
    }
    if (this._draft.mode === "mixed") {
      const role = this._buttonRole(buttonIndex);
      if (role === "radio") {
        const group = this._radioGroupFor(buttonIndex);
        const next = { ...this._splitPreviewOn };
        if (!group) {
          // Ungrouped mixed radio matches backend: independent toggle.
          next[buttonIndex] = !next[buttonIndex];
        } else if (next[buttonIndex]) {
          return;
        } else {
          for (const index of group.buttons) {
            next[index] = index === buttonIndex;
          }
        }
        this._splitPreviewOn = next;
        void this._dispatchButtonPress(buttonIndex);
        return;
      }
      if (role === "momentary") {
        // Local pulse preview mirrors backend: ON → auto-OFF after pulse_time_s.
        this._pulseMomentaryPreview(buttonIndex);
        void this._dispatchButtonPress(buttonIndex);
        return;
      }
      // toggle: local LED only — never selected_button / dirty.
      this._toggleLocalRing(buttonIndex);
      void this._dispatchButtonPress(buttonIndex);
      return;
    }
    if (this._draft.mode === "toggle") {
      this._toggleLocalRing(buttonIndex);
      void this._dispatchButtonPress(buttonIndex);
      return;
    }
    // Classic radio_mandatory / radio_optional
    if (!this._isRadioMember(buttonIndex)) {
      this._toggleLocalRing(buttonIndex);
      void this._dispatchButtonPress(buttonIndex);
      return;
    }
    // Classic radio preview: exactly one on; re-pressing selected does nothing.
    const selected =
      this._radioPreviewSelected ?? this._draft.selected_button;
    if (selected === buttonIndex) {
      return;
    }
    this._radioPreviewSelected = buttonIndex;
    void this._dispatchButtonPress(buttonIndex);
  }

  /**
   * Drive physical relays + HA actions through the integration.
   * Uses the saved active profile on the backend; never marks the draft dirty.
   */
  private async _dispatchButtonPress(buttonIndex: number): Promise<void> {
    const entryId = this._config?.entry_id;
    if (!this.hass || !entryId || this._busy) {
      return;
    }
    try {
      const runtime = await executeButton(this.hass, entryId, buttonIndex);
      this._applyRuntime(runtime);
    } catch (err) {
      this._error =
        err instanceof Error ? err.message : this.t("card.error");
      this.requestUpdate();
    }
  }

  private _ringOnColor(): string {
    return resolveLedPreviewColor(this._draft?.color_on, DEFAULT_RING_ON);
  }

  private _ringOffColor(): string {
    return resolveLedPreviewColor(this._draft?.color_off, DEFAULT_RING_OFF);
  }

  private _renderFlag(code: string) {
    if (code === "IL") {
      return html`
        <span class="flag flag-il" aria-hidden="true">
          <span class="flag-il-bar"></span>
          <span class="flag-il-star">✦</span>
          <span class="flag-il-bar"></span>
        </span>
      `;
    }
    if (code === "GB") {
      return html`<span class="flag flag-gb" aria-hidden="true"></span>`;
    }
    return html`<span class="flag flag-ru" aria-hidden="true"></span>`;
  }

  private _renderSection(
    id: SectionId,
    title: string,
    content: unknown
  ) {
    const open = this._sections[id];
    return html`
      <section class="panel-section ${open ? "open" : "closed"}">
        <header class="section-head">
          <div class="section-title">${title}</div>
          <label class="switch" title=${this.t("card.section_toggle")}>
            <input
              type="checkbox"
              .checked=${open}
              @change=${() => this._toggleSection(id)}
            />
            <span class="slider"></span>
          </label>
        </header>
        <div class="section-body">
          <div class="section-body-inner">${open ? content : nothing}</div>
        </div>
      </section>
    `;
  }

  private _renderFaceplate() {
    if (!this._draft) {
      return nothing;
    }
    const ringOn = this._ringOnColor();
    const ringOff = this._ringOffColor();
    return html`
      <!--
        Faceplate matches product photos: black label bar (~28%), white touch
        face with rings centered in the lower body (clear gap under labels),
        N equal columns (L1 leftmost … Ln). Outer bezel keeps the landscape
        4-gang footprint; rings use color_on / color_off.
        Photo skin hook: --conx-faceplate-skin on .faceplate.
      -->
      <div
        class="faceplate"
        dir="ltr"
        style="--ring-on:${ringOn};--ring-off:${ringOff};--conx-gang-count:${this._gangCount()}"
        role="img"
        aria-label=${this.t("card.preview")}
      >
        <div class="faceplate-bezel">
          ${this._operateMode
            ? html`
                <button
                  type="button"
                  class="faceplate-menu-btn"
                  data-operate-menu
                  aria-label=${this.t("card.menu")}
                  aria-expanded=${this._menuOpen ? "true" : "false"}
                  ?disabled=${this._busy}
                  @click=${(e: Event) => {
                    e.stopPropagation();
                    this._menuOpen = !this._menuOpen;
                  }}
                >
                  <span></span><span></span><span></span>
                </button>
              `
            : nothing}
          <div class="faceplate-skin"></div>
          <div class="faceplate-glass">
            <div class="faceplate-labels">
              ${this._draft.buttons
                .filter((button) => button.index <= this._gangCount())
                .map(
                  (button) => html`
                    <div class="faceplate-label">
                      ${button.name || `L${button.index}`}
                    </div>
                  `
                )}
            </div>
            <div class="faceplate-touch">
              <div class="faceplate-rings">
                ${this._draft.buttons
                  .filter((button) => button.index <= this._gangCount())
                  .map((button) => {
                  const on = this._isRingOn(button.index);
                  const pressed = this._pressedRing === button.index;
                  return html`
                    <button
                      type="button"
                      class="ring ${on ? "on" : "off"} ${pressed ? "pressed" : ""}"
                      ?disabled=${this._busy}
                      @click=${() => this._onRingPress(button.index)}
                      aria-label=${`${this.t("card.button")} ${button.index}`}
                    >
                      <span class="ring-glow"></span>
                    </button>
                  `;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _renderWizardNav() {
    const index = this._wizardIndex();
    return html`
      <nav class="wizard-steps" aria-label=${this.t("card.wizard")}>
        ${WIZARD_STEPS.map((step, stepIndex) => {
          const active = step === this._wizardStep;
          const done = stepIndex < index;
          return html`
            <button
              type="button"
              class="wizard-step ${active ? "active" : ""} ${done ? "done" : ""}"
              ?disabled=${this._busy}
              @click=${() => this._goToStep(step)}
            >
              <span class="wizard-index">${stepIndex + 1}</span>
              <span class="wizard-label">${this._stepLabel(step)}</span>
            </button>
          `;
        })}
      </nav>
      <p class="wizard-hint">${this.t(`card.step_${this._wizardStep}_hint`)}</p>
    `;
  }

  private _renderWizardFooter() {
    const index = this._wizardIndex();
    return html`
      <div class="wizard-footer">
        <button
          type="button"
          class="btn"
          ?disabled=${this._busy || index <= 0}
          @click=${this._wizardBack}
        >
          ${this.t("card.wizard_back")}
        </button>
        <button
          type="button"
          class="btn primary"
          ?disabled=${this._busy || index >= WIZARD_STEPS.length - 1}
          @click=${this._wizardNext}
        >
          ${this.t("card.wizard_next")}
        </button>
      </div>
    `;
  }

  private _renderThemePicker() {
    return html`
      <div class="theme-picker" role="group" aria-label=${this.t("card.theme")}>
        <div class="theme-picker-label">${this.t("card.theme")}</div>
        <div class="theme-swatches">
          ${THEME_OPTIONS.map(
            (opt) => html`
              <button
                type="button"
                class="theme-swatch ${this._theme === opt.id ? "active" : ""}"
                style="--swatch:${opt.swatch};--swatch-accent:${opt.accent}"
                title=${this.t(`theme.${opt.id}`)}
                ?disabled=${this._busy}
                @click=${() => this._setTheme(opt.id)}
              >
                <span class="theme-swatch-face" aria-hidden="true"></span>
                <span class="theme-swatch-name">${this.t(`theme.${opt.id}`)}</span>
              </button>
            `
          )}
        </div>
      </div>
    `;
  }

  private _renderStepLanguage() {
    return html`
      <div class="lang-hero" role="group" aria-label=${this.t("card.language")}>
        ${LANGUAGE_OPTIONS.map(
          (opt) => html`
            <button
              type="button"
              class="lang-hero-btn ${this._language === opt.id ? "active" : ""}"
              ?disabled=${this._busy}
              @click=${() => this._setLanguage(opt.id)}
            >
              ${this._renderFlag(opt.flag)}
              <span class="lang-hero-code">${opt.id.toUpperCase()}</span>
              <span class="lang-hero-name">${opt.label}</span>
            </button>
          `
        )}
      </div>
    `;
  }

  private _renderStepProfiles() {
    if (!this._panel || !this._draft) {
      return nothing;
    }
    return html`
      <div class="profile-list">
        ${Object.values(this._panel.profiles).map(
          (profile) => html`
            <button
              type="button"
              class="profile-chip ${profile.id === this._draft?.id ? "active" : ""}"
              ?disabled=${this._busy}
              @click=${() => this._selectProfile(profile.id)}
            >
              <span class="chip-name">${profile.name}</span>
              <span class="chip-id">${profile.id}</span>
            </button>
          `
        )}
      </div>
      <div class="profile-gang" data-profiles-gang>
        ${this._renderGangPicker()}
      </div>
      <div class="profile-name-row">
        <label class="field">
          <span>${this.t("card.panel_name")}</span>
          <input
            type="text"
            .value=${this._panelNameDraft}
            ?disabled=${this._busy}
            @input=${(e: Event) => {
              this._panelNameDraft = (e.target as HTMLInputElement).value;
            }}
            @change=${this._commitPanelName}
          />
        </label>
        <label class="field">
          <span>${this.t("card.profile_name")}</span>
          <input
            type="text"
            .value=${this._draft.name}
            ?disabled=${this._busy}
            @input=${this._onProfileNameInput}
          />
        </label>
      </div>
      <div class="profile-actions">
        <button type="button" class="btn" ?disabled=${this._busy} @click=${this._createProfile}>
          ${this.t("card.create")}
        </button>
        <button type="button" class="btn" ?disabled=${this._busy} @click=${this._duplicateProfile}>
          ${this.t("card.duplicate")}
        </button>
        <button type="button" class="btn danger" ?disabled=${this._busy} @click=${this._deleteProfile}>
          ${this.t("card.delete")}
        </button>
      </div>
    `;
  }

  private async _commitPanelName(): Promise<void> {
    if (!this.hass || !this._config || !this._panel) {
      return;
    }
    const name = this._panelNameDraft.trim();
    if (!name || name === this._panel.panel_name) {
      this._panelNameDraft = this._panel.panel_name;
      return;
    }
    this._busy = true;
    this._error = undefined;
    try {
      const panel = await updatePanelName(
        this.hass,
        this._config.entry_id,
        name
      );
      this._applyPanel(panel);
      this._notice = this.t("card.panel_name_ok");
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
      this._panelNameDraft = this._panel.panel_name;
    } finally {
      this._busy = false;
    }
  }

  private _renderModePicker() {
    if (!this._panel || !this._draft) {
      return nothing;
    }
    const modes = modesForGangCount(
      this._panel.capabilities.modes,
      this._gangCount()
    );
    const selected = coerceModeForGangCount(
      this._draft.mode,
      this._gangCount()
    );
    return html`
      <label class="field">
        <span>${this.t("card.mode")}</span>
        <div class="mode-picker" role="radiogroup" data-mode-picker>
          ${modes.map(
            (mode) => html`
              <button
                type="button"
                class="radio-member ${selected === mode ? "on" : ""}"
                role="radio"
                aria-checked=${selected === mode ? "true" : "false"}
                data-mode=${mode}
                ?disabled=${this._busy}
                @click=${() => this._setMode(mode as Profile["mode"])}
              >
                <span class="radio-member-label">${this.t(`mode.${mode}`)}</span>
              </button>
            `
          )}
        </div>
      </label>
    `;
  }

  private _renderAppearanceFields() {
    if (!this._panel || !this._draft) {
      return nothing;
    }
    const colorOptions = ensureColorSelectOptions(
      this._panel.capabilities.colors,
      this._draft.color_on,
      this._draft.color_off
    );
    const colorOn = isBrokenWarmLedColor(this._draft.color_on)
      ? remapBrokenWarmLedColor(this._draft.color_on)
      : this._draft.color_on;
    const colorOff = isBrokenWarmLedColor(this._draft.color_off)
      ? remapBrokenWarmLedColor(this._draft.color_off)
      : this._draft.color_off;
    const radarOptions = ensureSelectOptions(
      this._panel.capabilities.radar,
      this._draft.radar
    );
    return html`
          <div class="grid-2">
            <label class="field">
              <span>${this.t("card.color_on")}</span>
              <div class="select-wrap color-select">
                <span
                  class="swatch"
                  style="background:${resolveLedPreviewColor(colorOn)}"
                ></span>
                <select
                  .value=${colorOn}
                  ?disabled=${this._busy}
                  @change=${(e: Event) =>
                    this._patchDraft((draft) => {
                      draft.color_on = (e.target as HTMLSelectElement).value;
                    })}
                >
                  ${colorOptions.map(
                    (color) =>
                      html`<option value=${color}>${formatColorOptionLabel(
                        color,
                        this._language
                      )}</option>`
                  )}
                </select>
              </div>
            </label>
            <label class="field">
              <span>${this.t("card.color_off")}</span>
              <div class="select-wrap color-select">
                <span
                  class="swatch"
                  style="background:${resolveLedPreviewColor(colorOff)}"
                ></span>
                <select
                  .value=${colorOff}
                  ?disabled=${this._busy}
                  @change=${(e: Event) =>
                    this._patchDraft((draft) => {
                      draft.color_off = (e.target as HTMLSelectElement).value;
                    })}
                >
                  ${colorOptions.map(
                    (color) =>
                      html`<option value=${color}>${formatColorOptionLabel(
                        color,
                        this._language
                      )}</option>`
                  )}
                </select>
              </div>
            </label>
          </div>
          <label class="field">
            <span>${this.t("card.radar")}</span>
            <div class="select-wrap">
              <select
                .value=${this._draft.radar}
                ?disabled=${this._busy}
                @change=${(e: Event) =>
                  this._patchDraft((draft) => {
                    draft.radar = (e.target as HTMLSelectElement).value;
                  })}
              >
                ${radarOptions.map(
                  (value) =>
                    html`<option value=${value}>${formatRadarOptionLabel(
                      value,
                      this._language
                    )}</option>`
                )}
              </select>
            </div>
          </label>
          <div class="toggle-row">
            <label class="switch-field">
              <span>${this.t("card.backlight")}</span>
              <label class="switch">
                <input
                  type="checkbox"
                  .checked=${this._draft.backlight}
                  ?disabled=${this._busy}
                  @change=${(e: Event) =>
                    this._patchDraft((draft) => {
                      draft.backlight = (e.target as HTMLInputElement).checked;
                    })}
                />
                <span class="slider"></span>
              </label>
            </label>
            <label class="switch-field">
              <span>${this.t("card.child_lock")}</span>
              <label class="switch">
                <input
                  type="checkbox"
                  .checked=${this._draft.child_lock}
                  ?disabled=${this._busy}
                  @change=${(e: Event) =>
                    this._patchDraft((draft) => {
                      draft.child_lock = (e.target as HTMLInputElement).checked;
                    })}
                />
                <span class="slider"></span>
              </label>
            </label>
          </div>
          <label class="field dimmer-field ${this._draft.backlight ? "" : "dimmed"}">
            <span class="dimmer-label-row">
              <span>${this.t("card.backlight_brightness")}</span>
              <strong class="dimmer-pct">${this._draft.backlight_brightness ?? 100}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              .value=${String(this._draft.backlight_brightness ?? 100)}
              style="--brightness-pct: ${this._draft.backlight_brightness ?? 100}%"
              ?disabled=${this._busy || !this._draft.backlight}
              @input=${(e: Event) =>
                this._patchDraft((draft) => {
                  draft.backlight_brightness = Number(
                    (e.target as HTMLInputElement).value
                  );
                })}
            />
          </label>
    `;
  }

  private _renderMixedRolesSection() {
    if (!this._draft || this._draft.mode !== "mixed") {
      return nothing;
    }
    const roles = rolesForGangCount(this._gangCount()) as ButtonRole[];
    const covers = this._covers();
    const multiCover = covers.length > 1;
    const buttons = this._draft.buttons.filter(
      (button) => button.index <= this._gangCount()
    );
    return html`
      <div class="mixed-roles-section" data-mixed-roles>
        <div class="mixed-roles-head">
          <span class="menu-label">${this.t("card.mixed_roles")}</span>
        </div>
        ${buttons.map((button) => {
          const role = (button.role || "toggle") as ButtonRole;
          const pulse = button.pulse_time_s ?? DEFAULT_PULSE_TIME;
          const coverId =
            String(button.cover_id || covers[0]?.id || "cover_1").trim() ||
            "cover_1";
          const label = (button.name || "").trim() || "—";
          const isCoverRole = role === "cover_open" || role === "cover_close";
          const needsActionEntity =
            role === "toggle" || role === "momentary" || role === "radio";
          const extras = needsActionEntity || isCoverRole;
          const cover = covers.find((item) => item.id === coverId) || covers[0];
          const timesOwner = isCoverRole
            ? this._firstCoverRoleIndex(coverId)
            : null;
          const showTimes =
            isCoverRole && cover && timesOwner === button.index;
          const showTimesPointer =
            isCoverRole &&
            cover &&
            timesOwner != null &&
            timesOwner !== button.index;
          const entityId = String(
            (
              button.action?.target as { entity_id?: string } | undefined
            )?.entity_id || ""
          );
          const action = button.action?.action || "";
          return html`
            <div class="mixed-role-card" data-mixed-role=${button.index}>
              <div class="mixed-role-card-main">
                <div class="mixed-role-card-head">
                  <span class="mixed-role-l" dir="ltr">L${button.index}</span>
                  <span class="mixed-role-name">${label}</span>
                </div>
                <div
                  class="mixed-role-picker"
                  role="radiogroup"
                  aria-label=${this.t("card.button_role")}
                >
                  ${roles.map(
                    (item) => html`
                      <button
                        type="button"
                        class="radio-member ${role === item ? "on" : ""}"
                        role="radio"
                        aria-checked=${role === item ? "true" : "false"}
                        data-role=${item}
                        ?disabled=${this._busy}
                        @click=${() => this._setButtonRole(button.index, item)}
                      >
                        <span class="radio-member-label"
                          >${this.t(`role.${item}`)}</span
                        >
                      </button>
                    `
                  )}
                </div>
              </div>
              ${extras
                ? html`
                    <div class="mixed-role-extras">
                      ${role === "momentary"
                        ? html`
                            <label class="field field-inline mixed-pulse">
                              <span
                                >${this.t("card.pulse_time")} (${this.t(
                                  "card.cover_seconds"
                                )})</span
                              >
                              <input
                                type="number"
                                data-pulse-time
                                min=${PULSE_TIME_MIN}
                                max=${PULSE_TIME_MAX}
                                step="0.1"
                                .value=${String(pulse)}
                                ?disabled=${this._busy}
                                @change=${(e: Event) => {
                                  const value = Number(
                                    (e.target as HTMLInputElement).value
                                  );
                                  this._patchDraft((draft) => {
                                    const target = draft.buttons.find(
                                      (item) => item.index === button.index
                                    );
                                    if (!target) return;
                                    target.pulse_time_s = clampPulseTime(
                                      value,
                                      DEFAULT_PULSE_TIME
                                    );
                                  });
                                }}
                              />
                            </label>
                          `
                        : nothing}
                      ${needsActionEntity
                        ? html`
                            <div
                              class="mixed-action-entity"
                              data-mixed-action-entity
                            >
                              ${this._renderActionEntityPickers(
                                button.index,
                                action,
                                entityId
                              )}
                            </div>
                          `
                        : nothing}
                      ${isCoverRole && cover
                        ? this._renderMixedCoverExtras({
                            buttonIndex: button.index,
                            cover,
                            coverId,
                            covers,
                            multiCover,
                            showTimes: Boolean(showTimes),
                            showTimesPointer: Boolean(
                              showTimesPointer && timesOwner != null
                            ),
                            timesOwner,
                          })
                        : nothing}
                    </div>
                  `
                : nothing}
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderButtonsFields() {
    if (!this._panel || !this._draft) {
      return nothing;
    }
    return html`
      ${this._renderModePicker()} ${this._renderMixedRolesSection()}
      ${this._renderRadioGroupsEditor()}
      ${this._renderCoverEditor()}
          <div class="buttons-accordion">
            ${this._draft.buttons
              .filter((button) => button.index <= this._gangCount())
              .map((button) => {
              const open = Boolean(this._expandedButtons[button.index]);
              const entityId = String(
                (
                  button.action?.target as { entity_id?: string } | undefined
                )?.entity_id || ""
              );
              const label = (button.name || "").trim() || "—";
              const action = button.action?.action || "";
              const radioMode =
                this._draft?.mode === "radio_mandatory" ||
                this._draft?.mode === "radio_optional";
              const isMember = button.radio_member !== false;
              const coverDirection = this._coverDirectionFor(button.index);
              const mixedRole =
                this._draft?.mode === "mixed"
                  ? (button.role || "toggle")
                  : null;
              const isCoverMapped =
                mixedRole === "cover_open" || mixedRole === "cover_close";
              const behavior = mixedRole
                ? this.t(`role.${mixedRole}`)
                : coverDirection
                  ? this.t(
                      coverDirection === "open"
                        ? "card.cover_open"
                        : "card.cover_close"
                    )
                  : radioMode
                    ? isMember
                      ? this.t("card.radio_member")
                      : this.t("card.radio_toggle")
                    : "";
              const missingAction = !isCoverMapped && !action;
              const meta =
                [
                  isCoverMapped ? "" : action,
                  isCoverMapped ? "" : entityId,
                  behavior,
                  missingAction ? this.t("card.missing_action") : "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "—";
              return html`
                <div
                  class="button-edit ${open ? "open" : ""}"
                  data-button=${button.index}
                >
                  <button
                    type="button"
                    class="button-edit-toggle"
                    aria-expanded=${open ? "true" : "false"}
                    title=${open
                      ? this.t("card.button_collapse")
                      : this.t("card.button_expand")}
                    ?disabled=${this._busy}
                    @click=${() => this._toggleButtonEditor(button.index)}
                  >
                    <span class="button-edit-chevron" aria-hidden="true"></span>
                    <span class="button-edit-summary">
                      <span class="button-edit-title">
                        ${this.t("card.button")} ${button.index} · ${label}
                      </span>
                      <span class="button-edit-meta">${meta}</span>
                    </span>
                  </button>
                  <div class="button-edit-body">
                    <div class="button-edit-fields">
                      ${open
                        ? html`
                            <label class="field">
                              <span>${this.t("card.label")}</span>
                              <input
                                type="text"
                                .value=${button.name}
                                ?disabled=${this._busy}
                                @input=${(e: Event) =>
                                  this._onButtonNameInput(button.index, e)}
                              />
                            </label>
                            ${isCoverMapped
                              ? nothing
                              : html`
                                  ${missingAction
                                    ? html`<p
                                        class="radio-groups-hint"
                                        data-missing-action
                                      >
                                        ${this.t("card.missing_action")}
                                      </p>`
                                    : nothing}
                                  ${this._renderActionEntityPickers(
                                    button.index,
                                    action,
                                    entityId
                                  )}
                                `}
                            ${radioMode
                              ? html`
                                  <label class="field">
                                    <span>${this.t("card.radio_participation")}</span>
                                    <div class="select-wrap">
                                      <select
                                        .value=${isMember ? "radio" : "toggle"}
                                        ?disabled=${this._busy}
                                        @change=${(e: Event) =>
                                          this._patchDraft((draft) => {
                                            const target = draft.buttons.find(
                                              (item) => item.index === button.index
                                            );
                                            if (target) {
                                              target.radio_member =
                                                (e.target as HTMLSelectElement)
                                                  .value === "radio";
                                            }
                                          })}
                                      >
                                        <option value="radio">
                                          ${this.t("card.radio_member")}
                                        </option>
                                        <option value="toggle">
                                          ${this.t("card.radio_toggle")}
                                        </option>
                                      </select>
                                    </div>
                                  </label>
                                `
                              : nothing}
                          `
                        : nothing}
                    </div>
                  </div>
                </div>
              `;
            })}
          </div>
    `;
  }

  private _renderStepEdit() {
    if (!this._panel || !this._draft) {
      return nothing;
    }
    return html`
      ${this._renderAppearanceFields()}
      ${this._renderButtonsFields()}
    `;
  }

  private _renderStepReview() {
    if (!this._draft || !this._panel) {
      return nothing;
    }
    return html`
      <div class="review-grid">
        <div><strong>${this.t("card.profile_name")}</strong> ${this._draft.name}</div>
        <div><strong>${this.t("card.mode")}</strong> ${this.t(`mode.${this._draft.mode}`)}</div>
        <div><strong>${this.t("card.color_on")}</strong> ${this._draft.color_on}</div>
        <div><strong>${this.t("card.color_off")}</strong> ${this._draft.color_off}</div>
        <div><strong>${this.t("card.radar")}</strong> ${this._draft.radar}</div>
        <div>
          <strong>${this.t("card.buttons")}</strong>
          ${this._draft.buttons.map((b) => b.name).join(" · ")}
        </div>
        ${this._draft.mode === "cover"
          ? html`<div data-cover-review>
              <strong>${this.t("card.cover")}</strong>
              ${this._covers()
                .map(
                  (cover) =>
                    `${cover.id}: L${cover.open_button}/${cover.close_button} (${cover.open_time_s}/${cover.close_time_s}${this.t("card.cover_seconds")})`
                )
                .join(" · ")}
            </div>`
          : nothing}
        <div>
          <strong>${this.t("card.gang_count")}</strong> ${this._gangCount()}
        </div>
      </div>
      ${this._renderFaceplate()} ${this._renderCoverControl()}
      ${this._renderActionButtons("review")}
    `;
  }

  private _renderStepTransfer() {
    if (!this._panel || !this._config) {
      return nothing;
    }
    const yaml = this._serviceYaml || this._buildServiceYaml();
    return html`
      <div class="schema-box">
        <div class="schema-title">${this.t("card.schema_title")}</div>
        <p>${this.t("card.schema_body")}</p>
        <pre class="schema-pre">{
  "schema_version": 1,
  "active_profile_id": "lighting",
  "profiles": {
    "lighting": {
      "id": "lighting",
      "name": "Lighting",
      "mode": "toggle",
      "color_on": "cyan",
      "color_off": "blue",
      "radar": "30s",
      "backlight": true,
      "backlight_brightness": 100,
      "child_lock": false,
      "selected_button": null,
      "buttons": [
        {"index": 1, "name": "L1", "action": null, "radio_member": true}
      ]
    }
  }
}</pre>
      </div>
      <div class="row actions">
        <button type="button" class="btn primary" ?disabled=${this._busy} @click=${this._export}>
          ${this.t("card.download_export")}
        </button>
      </div>
      <label class="field">
        <span>${this.t("card.import_mode")}</span>
        <div class="select-wrap">
          <select
            .value=${this._importMode}
            ?disabled=${this._busy}
            @change=${(e: Event) => {
              this._importMode = (e.target as HTMLSelectElement).value as
                | "merge"
                | "replace";
              this._refreshServiceYaml();
            }}
          >
            <option value="merge">${this.t("card.import_merge")}</option>
            <option value="replace">${this.t("card.import_replace")}</option>
          </select>
        </div>
      </label>
      <div class="row actions">
        <button type="button" class="btn" ?disabled=${this._busy} @click=${this._openImport}>
          ${this.t("card.choose_file")}
        </button>
        <button type="button" class="btn" ?disabled=${this._busy} @click=${this._copyServiceYaml}>
          ${this.t("card.copy_yaml")}
        </button>
      </div>
      <label class="field">
        <span>${this.t("card.service_yaml")}</span>
        <textarea class="yaml-box" readonly rows="12" .value=${yaml}></textarea>
      </label>
    `;
  }

  private _renderWizardBody() {
    switch (this._wizardStep) {
      case "language":
        return this._renderStepLanguage();
      case "profiles":
        return this._renderStepProfiles();
      case "edit":
        return this._renderStepEdit();
      case "preview":
        return this._renderFaceplate();
      case "review":
        return this._renderStepReview();
      case "transfer":
        return this._renderStepTransfer();
      default:
        return nothing;
    }
  }

  protected render() {
    const rtl = isRtl(this._language);
    if (!this._config?.entry_id) {
      return html`<ha-card class="conx-card"><div class="pad">${this.t("card.missing_entry")}</div></ha-card>`;
    }
    if (this._loading && !this._panel) {
      return html`<ha-card class="conx-card"><div class="pad">${this.t("card.loading")}</div></ha-card>`;
    }
    if (!this._panel || !this._draft) {
      return html`<ha-card class="conx-card"><div class="pad error">${this._error || this.t("card.loading")}</div></ha-card>`;
    }

    const compact = Boolean(this._config.compact);
    const operate = this._operateMode;
    const overlayOpen =
      this._menuOpen ||
      this._automationOpen ||
      this._infoOpen ||
      this._view === "export";
    return html`
      <ha-card
        dir=${rtl ? "rtl" : "ltr"}
        data-theme=${this._theme}
        data-operate=${operate ? "true" : "false"}
        class="conx-card theme-${this._theme} ${this._view === "export" ? "export-open" : "editor-open"} ${this._menuOpen ? "menu-open" : ""} ${overlayOpen ? "overlay-open" : ""} ${compact ? "compact" : ""} ${operate ? "operate-mode" : ""} ${this._syncPulse ? "syncing-pulse" : ""}"
      >
        <div class="atmosphere"></div>
        ${operate
          ? nothing
          : html`
              <div class="panel-title" data-panel-title>
                <div class="brand" dir="ltr" lang="en">ConX</div>
                <div class="title">${this._panel.panel_name || this.t("card.title")}</div>
              </div>
              <div class="header" dir="ltr" data-card-header>
                <div class="header-side">
                  <div class="badge status-${this._panel.sync_status}">
                    ${this.t("card.status")}: ${this._panel.sync_status}
                  </div>
                  <button
                    type="button"
                    class="operate-btn"
                    data-operate-toggle
                    aria-pressed="false"
                    aria-label=${this.t("card.operate")}
                    title=${this.t("card.operate_hint")}
                    ?disabled=${this._busy}
                    @click=${this._toggleOperateMode}
                  >
                    ${this.t("card.operate")}
                  </button>
                  <button
                    type="button"
                    class="menu-btn"
                    data-header-menu
                    aria-label=${this.t("card.menu")}
                    aria-expanded=${this._menuOpen ? "true" : "false"}
                    ?disabled=${this._busy}
                    @click=${() => {
                      this._menuOpen = !this._menuOpen;
                    }}
                  >
                    <span></span><span></span><span></span>
                  </button>
                </div>
              </div>

              <div class="status-action-bar" data-status-action-bar>
                ${this._dirty
                  ? html`<div class="warn unsaved-draft" role="status">${this.t("card.unsaved")}</div>`
                  : nothing}
                ${!this._dirty &&
                (this._panel.sync_status === "pending" ||
                  this._panel.sync_status === "out_of_sync")
                  ? html`<div class="notice sync-needed" role="status" data-sync-needed>
                      ${this.t("card.sync_needed")}
                    </div>`
                  : nothing}
                ${this._notice
                  ? html`<div class="notice">${this._notice}</div>`
                  : nothing}
                ${this._error || this._panel.last_error
                  ? html`<div class="error">${this._error || this._panel.last_error}</div>`
                  : nothing}
                ${this._renderActionButtons("top")}
              </div>
            `}

        ${this._renderMainEditor()}
        ${this._menuOpen ? this._renderSettingsMenu() : nothing}
        ${this._automationOpen ? this._renderAutomationExample() : nothing}
        ${this._infoOpen ? this._renderInfoGuide() : nothing}
        ${this._view === "export" ? this._renderExportView() : nothing}
      </ha-card>
    `;
  }

  private _renderSettingsMenu() {
    const operate = this._operateMode;
    return html`
      <div
        class="conx-layer"
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) this._menuOpen = false;
        }}
      >
        <aside class="conx-panel compact" role="dialog" aria-modal="true" data-settings-menu>
          <div class="menu-head">
            <div class="menu-title">${this.t("card.menu")}</div>
            <button
              type="button"
              class="menu-close"
              @click=${() => {
                this._menuOpen = false;
              }}
            >
              ×
            </button>
          </div>
          ${operate
            ? html`
                <div class="menu-section" data-operate-exit-section>
                  <div class="menu-actions">
                    <button
                      type="button"
                      class="btn primary"
                      data-operate-exit
                      ?disabled=${this._busy}
                      @click=${() => this._exitOperateMode()}
                    >
                      ${this.t("card.operate_exit")}
                    </button>
                  </div>
                </div>
              `
            : nothing}
          <div class="menu-section">
            <span class="menu-label">${this.t("card.language")}</span>
            <div class="lang-flags" role="group" aria-label=${this.t("card.language")}>
              ${LANGUAGE_OPTIONS.map(
                (opt) => html`
                  <button
                    type="button"
                    class="lang-btn ${this._language === opt.id ? "active" : ""}"
                    ?disabled=${this._busy}
                    title=${opt.label}
                    @click=${() => this._setLanguage(opt.id)}
                  >
                    ${this._renderFlag(opt.flag)}
                    <span class="lang-code">${opt.id.toUpperCase()}</span>
                  </button>
                `
              )}
            </div>
          </div>
          <div class="menu-section">
            <span class="menu-label">${this.t("card.theme")}</span>
            ${this._renderThemePicker()}
          </div>
          <div class="menu-section">
            <span class="menu-label">${this.t("card.step_transfer")}</span>
            <div class="menu-actions">
              <button
                type="button"
                class="btn success"
                ?disabled=${this._busy}
                @click=${() => {
                  this._menuOpen = false;
                  void this._export();
                }}
              >
                ${this.t("card.export")}
              </button>
              <button
                type="button"
                class="btn primary"
                ?disabled=${this._busy}
                @click=${() => {
                  this._menuOpen = false;
                  this._openExportWizard();
                }}
              >
                ${this.t("card.open_export_wizard")}
              </button>
              <button
                type="button"
                class="btn"
                ?disabled=${this._busy}
                @click=${() => {
                  this._menuOpen = false;
                  this._importMode = "merge";
                  this._openImport();
                }}
              >
                ${this.t("card.import_merge")}
              </button>
              <button
                type="button"
                class="btn danger"
                ?disabled=${this._busy}
                @click=${() => {
                  this._menuOpen = false;
                  this._importMode = "replace";
                  this._openImport();
                }}
              >
                ${this.t("card.import_replace")}
              </button>
            </div>
          </div>
          <div class="menu-section">
            <span class="menu-label">${this.t("card.more")}</span>
            <div class="menu-actions">
              <button
                type="button"
                class="btn info-menu-btn"
                data-info-menu
                @click=${() => {
                  this._menuOpen = false;
                  this._infoOpen = true;
                }}
              >
                ${this.t("card.info")}
              </button>
              <button
                type="button"
                class="btn automation-menu-btn"
                @click=${() => {
                  this._menuOpen = false;
                  this._automationOpen = true;
                }}
              >
                ${this.t("card.automation_example")}
              </button>
            </div>
          </div>
        </aside>
      </div>
    `;
  }

  private _renderInfoGuide() {
    const sections: Array<{ title: string; body: string }> = [
      { title: "info.profiles_title", body: "info.profiles_body" },
      { title: "info.appearance_title", body: "info.appearance_body" },
      { title: "info.buttons_title", body: "info.buttons_body" },
      { title: "info.modes_title", body: "info.modes_body" },
      { title: "info.roles_title", body: "info.roles_body" },
      { title: "info.sync_title", body: "info.sync_body" },
      { title: "info.operate_title", body: "info.operate_body" },
      { title: "info.cover_title", body: "info.cover_body" },
      { title: "info.actions_title", body: "info.actions_body" },
      { title: "info.menu_title", body: "info.menu_body" },
    ];
    return html`
      <div
        class="conx-layer"
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) this._infoOpen = false;
        }}
      >
        <div
          class="conx-panel xwide info-panel"
          role="dialog"
          aria-modal="true"
          data-info-guide
        >
          <div class="menu-head">
            <div class="menu-title">${this.t("info.title")}</div>
            <button
              type="button"
              class="menu-close"
              data-info-close
              @click=${() => {
                this._infoOpen = false;
              }}
            >
              ×
            </button>
          </div>
          <p class="info-intro">${this.t("info.intro")}</p>
          <div class="info-sections">
            ${sections.map(
              (section) => html`
                <section class="info-section">
                  <h3 class="info-section-title">${this.t(section.title)}</h3>
                  <p class="info-section-body">${this.t(section.body)}</p>
                </section>
              `
            )}
          </div>
          <div class="automation-actions">
            <button
              type="button"
              class="btn"
              data-info-close
              @click=${() => {
                this._infoOpen = false;
              }}
            >
              ${this.t("card.close")}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private _renderAutomationExample() {
    const yaml = this._buildAutomationYaml();
    return html`
      <div
        class="conx-layer"
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) this._automationOpen = false;
        }}
      >
        <div class="conx-panel xwide automation-panel" role="dialog" aria-modal="true">
          <div class="menu-head">
            <div class="menu-title">${this.t("card.automation_example")}</div>
            <button
              type="button"
              class="menu-close"
              @click=${() => {
                this._automationOpen = false;
              }}
            >
              ×
            </button>
          </div>
          <p class="automation-hint">${this.t("card.automation_example_hint")}</p>
          <pre class="automation-yaml" dir="ltr" lang="en">${yaml}</pre>
          <div class="automation-actions">
            <button
              type="button"
              class="btn primary"
              @click=${this._copyAutomationYaml}
            >
              ${this.t("card.copy_yaml")}
            </button>
            <button
              type="button"
              class="btn"
              @click=${() => {
                this._automationOpen = false;
              }}
            >
              ${this.t("card.close")}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private _renderMainEditor() {
    if (!this._draft || !this._panel) {
      return nothing;
    }
    const operate = this._operateMode;
    const previewOpen = operate || this._previewOpen;
    const tabs: Array<"profiles" | "appearance" | "buttons"> = [
      "profiles",
      "appearance",
      "buttons",
    ];
    const tabLabels: Record<string, string> = {
      profiles: this.t("card.profiles"),
      appearance: this.t("card.editor"),
      buttons: this.t("card.buttons"),
    };
    return html`
      <div class="layout single-layout ${operate ? "operate-layout" : ""}">
        <section
          class="hero-preview ${previewOpen ? "open" : "closed"} ${operate ? "operate-hero" : ""}"
          data-hero-preview
        >
          ${operate
            ? html`
                <header class="section-head operate-profile-only" data-operate-profile>
                  <div class="hero-profile-name" aria-live="polite">${this._draft.name}</div>
                </header>
              `
            : html`
                <header class="section-head" data-preview-chrome>
                  <div class="section-head-main">
                    <div class="section-title">${this.t("card.preview")}</div>
                  </div>
                  <div class="hero-profile-name" aria-live="polite">${this._draft.name}</div>
                  <label class="switch" title=${this.t("card.section_toggle")}>
                    <input
                      type="checkbox"
                      .checked=${this._previewOpen}
                      @change=${() => {
                        this._previewOpen = !this._previewOpen;
                      }}
                    />
                    <span class="slider"></span>
                  </label>
                </header>
              `}
          ${previewOpen
            ? html`<div class="hero-body">
                ${this._renderFaceplate()} ${this._renderCoverControl()}
              </div>`
            : nothing}
        </section>

        ${operate
          ? nothing
          : html`
              <p class="layout-hint">${this.t("card.tabs_hint")}</p>

              <div class="settings-tabs" data-editor-chrome>
                <div class="tab-bar" role="tablist">
                  ${tabs.map(
                    (tab, index) => html`
                      <button
                        type="button"
                        class="tab-btn ${this._activeTab === tab ? "active" : ""}"
                        role="tab"
                        aria-selected=${this._activeTab === tab ? "true" : "false"}
                        ?disabled=${this._busy}
                        @click=${() => {
                          this._activeTab = tab;
                        }}
                      >
                        <span class="tab-step">${this.t(`card.step_${index + 1}`)}</span>
                        <span class="tab-label">${tabLabels[tab]}</span>
                      </button>
                    `
                  )}
                </div>
                <div class="tab-panels">
                  <section
                    class="tab-panel ${this._activeTab === "profiles" ? "active" : ""}"
                    ?hidden=${this._activeTab !== "profiles"}
                  >
                    ${this._renderStepProfiles()}
                  </section>
                  <section
                    class="tab-panel ${this._activeTab === "appearance" ? "active" : ""}"
                    ?hidden=${this._activeTab !== "appearance"}
                  >
                    ${this._renderAppearanceFields()}
                  </section>
                  <section
                    class="tab-panel ${this._activeTab === "buttons" ? "active" : ""}"
                    ?hidden=${this._activeTab !== "buttons"}
                  >
                    ${this._renderButtonsFields()}
                  </section>
                </div>
              </div>
            `}
      </div>
    `;
  }

  private _renderActionButtons(placement: "top" | "review" = "top") {
    return html`
      <div
        class="actions-dock ${placement === "top" ? "actions-dock-top" : ""}"
        data-actions=${placement}
      >
        <div class="actions-grid">
          <button
            type="button"
            class="btn primary"
            ?disabled=${this._busy || !this._dirty}
            @click=${this._saveDraft}
          >
            ${this.t("card.save")}
          </button>
          <button
            type="button"
            class="btn"
            ?disabled=${this._busy || !this._dirty}
            @click=${this._discard}
          >
            ${this.t("card.discard")}
          </button>
          <button
            type="button"
            class="btn primary sync-btn"
            ?disabled=${this._busy}
            @click=${this._sync}
          >
            ${this.t("card.sync")}
          </button>
          <button type="button" class="btn" ?disabled=${this._busy} @click=${this._pull}>
            ${this.t("card.pull")}
          </button>
        </div>
      </div>
    `;
  }

  private _renderExportView() {
    return html`
      <div
        class="conx-layer"
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) this._backToEditor();
        }}
      >
        <div class="conx-panel wide" role="dialog" aria-modal="true">
          <div class="menu-head">
            <div class="export-title">${this.t("card.step_transfer")}</div>
            <button type="button" class="menu-close" @click=${this._backToEditor}>
              ×
            </button>
          </div>
          <p class="export-hint">${this.t("card.step_transfer_hint")}</p>
          <div class="export-actions">
            <button
              type="button"
              class="btn success"
              ?disabled=${this._busy}
              @click=${this._export}
            >
              ${this.t("card.export")}
            </button>
            <button
              type="button"
              class="btn"
              ?disabled=${this._busy}
              @click=${() => {
                this._importMode = "merge";
                this._openImport();
              }}
            >
              ${this.t("card.import_merge")}
            </button>
            <button
              type="button"
              class="btn danger"
              ?disabled=${this._busy}
              @click=${() => {
                this._importMode = "replace";
                this._openImport();
              }}
            >
              ${this.t("card.import_replace")}
            </button>
          </div>
          <div class="export-details">${this._renderStepTransfer()}</div>
          <div class="export-footer">
            <button
              type="button"
              class="btn"
              ?disabled=${this._busy}
              @click=${this._backToEditor}
            >
              ← ${this.t("card.back_to_editor")}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      --conx-font: "Manrope", "Outfit", ui-sans-serif, sans-serif;
      --conx-display: "Cormorant Garamond", "Sora", Georgia, serif;
      --conx-steel: #8b949e;
      --conx-ink: #1a222c;
      --conx-panel: #eef2f5;
      --conx-glass: color-mix(in srgb, #ffffff 72%, transparent);
      --conx-bevel-light: color-mix(in srgb, #ffffff 55%, transparent);
      --conx-bevel-dark: color-mix(in srgb, #0b1218 22%, transparent);
      --conx-accent: #1f7a8c;
      --conx-accent-soft: color-mix(in srgb, #1f7a8c 18%, transparent);
      --conx-ring: #00e5ff;
      --conx-ring-off: #2979ff;
      --conx-danger: #c62828;
      --conx-radius: 18px;
      --conx-gap: 10px;
    }


    ha-card.conx-card {
      position: relative;
      overflow: hidden;
      width: 100%;
      max-width: none;
      box-sizing: border-box;
      font-family: var(--conx-font);
      color: var(--text);
      background:
        linear-gradient(180deg, rgba(255,255,255,.08) 0%, transparent 36%),
        linear-gradient(165deg, #262b34 0%, #1a1d22 44%, #15181e 100%);
      border: 1px solid var(--border);
      box-shadow: var(--card-shadow);
      padding: 12px 14px 14px;

      /* Noir gold — elevated charcoal/slate with 3D depth */
      --bg: #1a1d22;
      --surface: #1a1d22;
      --surface-2: #242830;
      --border: rgba(255, 255, 255, 0.13);
      --text: #f0f2f5;
      --text-muted: #a8afb8;
      --accent: #d4af61;
      --accent-soft: rgba(212, 175, 97, 0.16);
      --accent-text: #1a1d22;
      --danger: #b42318;
      --unsaved-warn-text: #ff6b6b;
      --btn-bg: #2a2f38;
      --btn-text: #f0f2f5;
      --btn-border: rgba(255, 255, 255, 0.16);
      --btn-primary-bg: #d4af61;
      --btn-primary-text: #1a1d22;
      --btn-success-bg: #1f8a4c;
      --btn-success-text: #fff;
      --input-bg: #15181e;
      --input-text: #f0f2f5;
      --label: #c8ced6;
      --bevel-light: rgba(255, 255, 255, 0.14);
      --bevel-dark: rgba(0, 0, 0, 0.38);
      --atm-1: rgba(212, 175, 97, 0.12);
      --atm-2: rgba(90, 115, 150, 0.11);
      --faceplate-well: radial-gradient(ellipse at 50% 0%, #2e3440 0%, #1e232b 52%, #15191f 100%);
      --card-shadow:
        0 22px 48px rgba(0, 0, 0, 0.42),
        0 1px 0 rgba(255, 255, 255, 0.10) inset,
        inset 0 -1px 0 rgba(0, 0, 0, 0.28);

      --conx-ink: var(--text);
      --conx-steel: #8a837a;
      --conx-accent: var(--accent);
      --conx-accent-soft: var(--accent-soft);
      --conx-bevel-light: var(--bevel-light);
      --conx-bevel-dark: var(--bevel-dark);
      --conx-danger: var(--danger);
      --conx-panel-bg: var(--surface);
      --conx-field-bg: var(--input-bg);
      --conx-text-muted: var(--text-muted);
      --conx-atm-1: var(--atm-1);
      --conx-atm-2: var(--atm-2);
      --conx-card-bg: var(--bg);
      --conx-card-border: var(--border);
      --conx-card-shadow: var(--card-shadow);
    }

    ha-card.conx-card[data-theme="noir"] {
      --bg: #1a1d22;
      --surface: #1a1d22;
      --surface-2: #242830;
      --border: rgba(255, 255, 255, 0.13);
      --text: #f0f2f5;
      --text-muted: #a8afb8;
      --accent: #d4af61;
      --accent-soft: rgba(212, 175, 97, 0.16);
      --accent-text: #1a1d22;
      --danger: #b42318;
      --unsaved-warn-text: #ff6b6b;
      --btn-bg: #2a2f38;
      --btn-text: #f0f2f5;
      --btn-primary-bg: #d4af61;
      --btn-primary-text: #1a1d22;
      --btn-success-bg: #1f8a4c;
      --btn-success-text: #fff;
      --input-bg: #15181e;
      --input-text: #f0f2f5;
      --faceplate-well: radial-gradient(ellipse at 50% 0%, #2e3440 0%, #1e232b 52%, #15191f 100%);
    }

    ha-card.conx-card[data-theme="ivory"] {
      --bg: #f5f7fa;
      --surface: #f5f7fa;
      --surface-2: #ffffff;
      --border: #d0d6df;
      --text: #1a1c1f;
      --text-muted: #5c636e;
      --accent: #8a7348;
      --accent-soft: rgba(138, 115, 72, 0.12);
      --accent-text: #111318;
      --danger: #b42318;
      --unsaved-warn-text: #c62828;
      --btn-bg: #e8ecf1;
      --btn-text: #1a1c1f;
      --btn-border: #c0c6d0;
      --btn-primary-bg: #8a7348;
      --btn-primary-text: #ffffff;
      --btn-success-bg: #1f8a4c;
      --btn-success-text: #fff;
      --input-bg: #ffffff;
      --input-text: #1a1c1f;
      --label: #3d434c;
      --bevel-light: rgba(255, 255, 255, 0.8);
      --bevel-dark: rgba(0, 0, 0, 0.07);
      --atm-1: rgba(138, 115, 72, 0.07);
      --atm-2: rgba(90, 115, 150, 0.08);
      --faceplate-well: linear-gradient(180deg, #e8eaee, #dce1e8);
      --card-shadow: 0 14px 36px rgba(20, 28, 40, 0.10), 0 1px 0 rgba(255, 255, 255, 0.9) inset;
      --conx-steel: #8a9098;
      background: linear-gradient(180deg, #ffffff 0%, #f5f7fa 55%, #eef1f5 100%);
    }

    .atmosphere {
      pointer-events: none;
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 18% 0%, var(--conx-atm-1), transparent 44%),
        radial-gradient(ellipse at 88% 16%, var(--conx-atm-2), transparent 42%);
      opacity: 1;
    }

    .theme-picker {
      display: grid;
      gap: 8px;
      margin-top: 4px;
    }
    .theme-picker-label {
      display: none;
    }
    .theme-swatches {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .theme-swatch {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 14px 10px;
      border-radius: 14px;
      cursor: pointer;
      font: inherit;
      border: 1px solid var(--btn-border, var(--border));
      background: var(--btn-bg);
      color: var(--text-muted);
    }
    .theme-swatch:hover {
      color: var(--text);
    }
    .theme-swatch.active {
      border-color: var(--accent);
      background: var(--accent-soft);
      color: var(--text);
    }
    .theme-swatch-face {
      display: block;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--swatch);
      border: 2px solid var(--border);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }
    .theme-swatch.active .theme-swatch-face {
      border-color: var(--swatch-accent, var(--accent));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--swatch-accent, var(--accent)) 40%, transparent);
    }
    .theme-swatch-name {
      font-size: 0.78rem;
      font-weight: 700;
      line-height: 1.25;
      text-align: center;
    }
    .theme-swatch.active .theme-swatch-name {
      color: var(--text);
    }
    .dimmer-field input[type="range"] {
      width: 100%;
      accent-color: var(--conx-accent);
    }
    .dimmer-field.dimmed {
      opacity: 0.45;
    }
    .dimmer-field span {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .panel-title,
    .header,
    .status-action-bar,
    .warn,
    .error,
    .notice,
    .hero-preview,
    .settings-tabs,
    .actions-dock,
    .layout-hint,
    .layout {
      position: relative;
      z-index: 1;
    }

    .panel-title {
      text-align: center;
      margin: 0 0 14px;
      padding: 0 8px;
    }

    .panel-title .brand {
      font-family: var(--conx-display);
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1;
      color: var(--accent);
    }

    .panel-title .title {
      font-family: var(--conx-display);
      font-size: 1.35rem;
      font-weight: 600;
      margin-top: 6px;
      color: var(--text);
    }


    .single-layout {
      display: grid;
      gap: var(--conx-gap);
      grid-template-columns: 1fr;
    }
    @media (min-width: 860px) {
      .single-layout {
        grid-template-columns: 1fr 1.1fr;
      }
      .single-layout > .panel-section:nth-child(1),
      .single-layout > .panel-section:nth-child(4) {
        grid-column: 1 / -1;
      }
    }
    .export-view {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 12px;
    }
    .export-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--conx-accent) 40%, transparent);
      background: var(--conx-accent-soft);
      box-shadow: inset 0 1px 0 var(--conx-bevel-light);
    }
    .export-title {
      font-family: var(--conx-display);
      font-weight: 700;
    }
    .back-to-editor {
      font-weight: 700;
    }

    .wizard-layout {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .wizard-steps {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .wizard-step {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 40%, transparent);
      background: var(--btn-bg);
      color: var(--btn-text);
      border-radius: 999px;
      padding: 6px 10px;
      font: inherit;
      cursor: pointer;
      transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
    }

    .wizard-step:hover {
      transform: translateY(-1px);
    }

    .wizard-step.active {
      border-color: var(--conx-accent);
      background: var(--conx-accent-soft);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--conx-accent) 35%, transparent);
    }

    .wizard-step.done .wizard-index {
      background: var(--conx-accent);
      color: #fff;
    }

    .wizard-index {
      width: 1.4rem;
      height: 1.4rem;
      border-radius: 50%;
      display: inline-grid;
      place-items: center;
      font-size: 0.75rem;
      font-weight: 700;
      background: color-mix(in srgb, var(--conx-steel) 22%, transparent);
    }

    .wizard-label {
      font-size: 0.78rem;
      font-weight: 600;
    }

    .wizard-hint {
      margin: 0;
      opacity: 0.75;
      font-size: 0.9rem;
    }

    .wizard-body {
      animation: wizard-in 220ms ease;
    }

    @keyframes wizard-in {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .wizard-footer {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-top: 4px;
    }

    .lang-hero {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .lang-hero-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 16px 10px;
      border-radius: 16px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 35%, transparent);
      background: var(--btn-bg);
      color: var(--btn-text);
      cursor: pointer;
      font: inherit;
      transition: transform 160ms ease, border-color 160ms ease;
    }

    .lang-hero-btn:hover {
      transform: translateY(-2px);
    }

    .lang-hero-btn.active {
      border-color: var(--conx-accent);
      box-shadow: 0 8px 18px color-mix(in srgb, var(--conx-accent) 18%, transparent);
    }

    .lang-hero-code {
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .lang-hero-name {
      font-size: 0.85rem;
      opacity: 0.8;
    }

    .review-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px 12px;
      margin-bottom: 12px;
      font-size: 0.92rem;
    }

    .schema-box {
      border: 1px solid color-mix(in srgb, var(--conx-steel) 35%, transparent);
      border-radius: 14px;
      padding: 12px;
      background: color-mix(in srgb, #fff 66%, transparent);
      margin-bottom: 12px;
    }

    .schema-title {
      font-weight: 700;
      margin-bottom: 4px;
    }

    .schema-pre,
    .yaml-box {
      width: 100%;
      box-sizing: border-box;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.72rem;
      line-height: 1.35;
      border-radius: 10px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 35%, transparent);
      background: color-mix(in srgb, #0b1218 4%, #fff);
      padding: 10px;
      overflow: auto;
      white-space: pre;
    }

    .yaml-box {
      resize: vertical;
      min-height: 160px;
    }

    @media (max-width: 640px) {
      .lang-hero {
        grid-template-columns: 1fr;
      }

      .review-grid {
        grid-template-columns: 1fr;
      }

      .wizard-label {
        display: none;
      }
    }

    .header {
      display: flex;
      justify-content: space-between;
      gap: var(--conx-gap);
      align-items: flex-start;
      margin-bottom: 14px;
    }

    .brand {
      font-family: var(--conx-display);
      font-size: 1.55rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1;
      color: var(--conx-accent);
    }

    .title {
      font-family: var(--conx-display);
      font-size: 1.15rem;
      font-weight: 600;
      margin-top: 4px;
    }

    .subtitle {
      opacity: 0.72;
      margin-top: 2px;
      font-size: 0.92rem;
    }

    @media (max-width: 520px) {
      .panel-title .brand {
        font-size: 1.5rem;
      }
      .panel-title .title {
        font-size: 1.2rem;
      }
    }

    .header-side {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .lang-flags {
      display: flex;
      gap: 6px;
    }

    .lang-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 45%, transparent);
      background:
        linear-gradient(180deg, color-mix(in srgb, #fff 70%, transparent), color-mix(in srgb, #c9d3dc 40%, transparent));
      box-shadow: inset 0 1px 0 var(--conx-bevel-light);
      cursor: pointer;
      color: inherit;
      font: inherit;
    }

    .lang-btn.active {
      border-color: color-mix(in srgb, var(--conx-accent) 55%, transparent);
      background: var(--conx-accent-soft);
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        0 0 0 1px color-mix(in srgb, var(--conx-accent) 25%, transparent);
    }

    .lang-code {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .flag {
      width: 18px;
      height: 12px;
      border-radius: 2px;
      border: 1px solid color-mix(in srgb, #000 18%, transparent);
      display: inline-block;
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
    }

    .flag-il {
      background: #fff;
      display: grid;
      grid-template-rows: 2px 1fr 2px;
      place-items: center;
    }

    .flag-il-bar {
      width: 100%;
      height: 2px;
      background: #0038b8;
    }

    .flag-il-star {
      color: #0038b8;
      font-size: 7px;
      line-height: 1;
    }

    .flag-gb {
      background:
        linear-gradient(90deg, transparent 44%, #fff 44%, #fff 56%, transparent 56%),
        linear-gradient(#fff 38%, transparent 38%, transparent 62%, #fff 62%),
        linear-gradient(90deg, transparent 46%, #c8102e 46%, #c8102e 54%, transparent 54%),
        linear-gradient(#c8102e 42%, transparent 42%, transparent 58%, #c8102e 58%),
        #012169;
    }

    .flag-ru {
      background: linear-gradient(
        to bottom,
        #fff 0 33%,
        #0039a6 33% 66%,
        #d52b1e 66% 100%
      );
    }

    .badge {
      border-radius: 999px;
      padding: 5px 11px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 40%, transparent);
      background: color-mix(in srgb, #fff 45%, transparent);
      text-transform: lowercase;
      box-shadow: inset 0 1px 0 var(--conx-bevel-light);
    }

    .status-synced {
      color: var(--success-color, #2e7d32);
    }
    .status-pending,
    .status-out_of_sync {
      color: var(--warning-color, #ed6c02);
    }
    .status-syncing {
      color: var(--conx-accent);
    }
    .status-error {
      color: var(--error-color, var(--conx-danger));
    }

    .warn,
    .error,
    .notice {
      padding: 9px 12px;
      border-radius: 12px;
      margin-bottom: 10px;
      font-size: 0.9rem;
      border: 1px solid transparent;
    }

    /* Unsaved-draft banner only — centered, bold, larger red for clarity */
    .warn.unsaved-draft {
      text-align: center;
      font-weight: 700;
      font-size: 1.2rem;
      line-height: 1.35;
      letter-spacing: 0.01em;
      color: var(--unsaved-warn-text, #ff5252);
      background: color-mix(in srgb, var(--unsaved-warn-text, #ff5252) 16%, transparent);
      border-color: color-mix(in srgb, var(--unsaved-warn-text, #ff5252) 40%, transparent);
    }

    .error {
      background: color-mix(in srgb, var(--error-color, #d32f2f) 14%, transparent);
      color: var(--error-color, #d32f2f);
      border-color: color-mix(in srgb, var(--error-color, #d32f2f) 28%, transparent);
    }

    .notice {
      background: color-mix(in srgb, var(--conx-accent) 12%, transparent);
      border-color: color-mix(in srgb, var(--conx-accent) 28%, transparent);
    }

    .layout {
      display: grid;
      gap: 14px;
    }

    @media (min-width: 920px) {
      .layout {
        grid-template-columns: 1fr 1.15fr;
      }
      .compact .layout {
        grid-template-columns: 1fr;
      }
    }

    .panel-section {
      border-radius: 16px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 32%, transparent);
      background: var(--conx-panel-bg);
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        0 6px 16px color-mix(in srgb, #0b1218 8%, transparent);
      overflow: hidden;
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid color-mix(in srgb, var(--conx-steel) 22%, transparent);
    }

    .section-title {
      font-family: var(--conx-display);
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .section-body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 220ms ease;
    }

    .panel-section.open .section-body {
      grid-template-rows: 1fr;
    }

    .section-body-inner {
      overflow: hidden;
      padding: 0 14px;
    }

    .panel-section.open .section-body-inner {
      padding: 12px 14px 14px;
    }

    /* Shared toggle pattern: physical LTR thumb travel, balanced proportions. */
    .switch {
      --switch-w: 44px;
      --switch-h: 26px;
      --switch-thumb: 22px;
      --switch-pad: 2px;
      position: relative;
      display: inline-block;
      width: var(--switch-w);
      height: var(--switch-h);
      flex-shrink: 0;
      vertical-align: middle;
    }

    .switch input {
      position: absolute;
      opacity: 0;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      cursor: pointer;
      z-index: 1;
    }

    .slider {
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: color-mix(in srgb, var(--conx-steel) 42%, #d5dde5);
      box-shadow: inset 0 1px 2px color-mix(in srgb, #0b1218 22%, transparent);
      transition: background 180ms ease, box-shadow 180ms ease;
      pointer-events: none;
    }

    .slider::before {
      content: "";
      position: absolute;
      width: var(--switch-thumb);
      height: var(--switch-thumb);
      top: 50%;
      left: var(--switch-pad);
      border-radius: 50%;
      background: linear-gradient(180deg, #fff 0%, #e8eef3 100%);
      box-shadow:
        0 1px 3px color-mix(in srgb, #0b1218 28%, transparent),
        inset 0 1px 0 #fff;
      transform: translateY(-50%);
      transition: left 180ms ease, background 180ms ease;
    }

    .switch input:checked + .slider {
      background: color-mix(in srgb, var(--conx-accent) 82%, #6aa8b6);
      box-shadow: inset 0 1px 2px color-mix(in srgb, #0b1218 18%, transparent);
    }

    .switch input:checked + .slider::before {
      left: calc(100% - var(--switch-thumb) - var(--switch-pad));
    }

    .switch input:focus-visible + .slider {
      outline: 2px solid color-mix(in srgb, var(--conx-accent) 55%, transparent);
      outline-offset: 2px;
    }

    .profile-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 10px;
    }

    .profile-chip {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      text-align: start;
      border-radius: 12px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 35%, transparent);
      background: color-mix(in srgb, #fff 50%, transparent);
      padding: 10px 12px;
      cursor: pointer;
      color: inherit;
      font: inherit;
      box-shadow: inset 0 1px 0 var(--conx-bevel-light);
      transition: transform 140ms ease, border-color 140ms ease;
    }

    .profile-chip:hover {
      transform: translateY(-1px);
    }

    .profile-chip.active {
      border-color: color-mix(in srgb, var(--conx-accent) 55%, transparent);
      background: var(--conx-accent-soft);
    }

    .chip-name {
      font-weight: 600;
    }

    .chip-id {
      font-size: 0.75rem;
      opacity: 0.65;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-bottom: 6px;
      font-size: 0.86rem;
    }

    .field > span {
      font-weight: 500;
      opacity: 0.85;
    }

    input[type="text"],
    input[type="number"],
    select,
    textarea.yaml-box {
      font: inherit;
      color: var(--input-text);
      background: var(--input-bg);
      border: 1px solid var(--border);
      border-radius: 11px;
      padding: 9px 11px;
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        inset 0 -1px 0 color-mix(in srgb, #0b1218 6%, transparent);
    }

    input[type="text"],
    select,
    textarea.yaml-box {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    /* Compact numerics: values like 20 / 0.5 should not smear full-width. */
    input[type="number"] {
      width: 7.5ch;
      min-width: 4.75rem;
      max-width: 9rem;
      box-sizing: content-box;
      -moz-appearance: textfield;
      appearance: textfield;
    }
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    input[type="text"]:focus,
    input[type="number"]:focus,
    select:focus {
      outline: none;
      border-color: color-mix(in srgb, var(--conx-accent) 55%, transparent);
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        0 0 0 2px var(--conx-accent-soft);
    }

    .select-wrap {
      position: relative;
      max-width: 22rem;
    }
    .select-wrap-wide {
      max-width: 100%;
    }
    .field-hint {
      font-size: 0.78rem;
      opacity: 0.7;
      line-height: 1.35;
    }
    .field-error {
      font-size: 0.78rem;
      color: var(--error-color, #c62828);
      line-height: 1.35;
    }
    .action-data-field {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .action-data-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      width: fit-content;
      max-width: 100%;
      margin: 0;
      padding: 2px 0;
      border: 0;
      background: transparent;
      color: var(--text);
      font: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      text-align: start;
    }
    .action-data-toggle:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .action-data-chevron {
      display: inline-block;
      width: 0.45em;
      height: 0.45em;
      border-inline-end: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: rotate(-45deg);
      transition: transform 0.15s ease;
      flex: 0 0 auto;
    }
    .action-data-toggle[aria-expanded="true"] .action-data-chevron {
      transform: rotate(45deg);
    }
    .action-data-editor {
      margin: 0;
    }
    textarea.action-data-box {
      width: 100%;
      min-height: 5.5rem;
      resize: vertical;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--line) 80%, transparent);
      background: color-mix(in srgb, var(--surface) 92%, #000 4%);
      color: var(--text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.78rem;
      line-height: 1.4;
      box-sizing: border-box;
    }
    textarea.action-data-box:focus {
      outline: none;
      border-color: color-mix(in srgb, var(--conx-accent) 55%, transparent);
      box-shadow: 0 0 0 2px var(--conx-accent-soft);
    }
    ha-entity-picker,
    ha-service-picker {
      display: block;
      width: 100%;
      --mdc-theme-primary: var(--conx-accent, #d4af61);
    }
    .picker-filter {
      width: 100%;
      min-height: 28px;
      margin-bottom: 4px;
      padding: 4px 8px;
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--line) 80%, transparent);
      background: color-mix(in srgb, var(--surface) 88%, transparent);
      color: var(--text);
      font: inherit;
      font-size: 0.78rem;
    }

    .field-inline {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 12px;
    }
    .field-inline > span {
      min-width: 0;
      flex: 1 1 8rem;
    }
    .field-inline input[type="number"],
    .field-inline .select-wrap {
      flex: 0 0 auto;
    }

    .cover-times {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 16px;
      margin-bottom: 10px;
    }
    .cover-times .field {
      flex: 0 1 auto;
      margin-bottom: 0;
      min-width: 0;
    }
    .cover-times-compact {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
      gap: 6px 10px;
      margin-bottom: 0;
      width: 100%;
      align-items: start;
    }
    .cover-times-compact .field {
      margin-bottom: 0;
      gap: 2px;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .cover-times-compact .field > span {
      font-size: 0.62rem;
      color: var(--text-muted);
      line-height: 1.15;
    }
    .cover-times-compact input[type="number"],
    .cover-times-compact select {
      min-height: 24px;
      padding: 2px 4px;
      font-size: 0.72rem;
      width: 100%;
      max-width: none;
      box-sizing: border-box;
    }
    .cover-times-compact .field-compact-select .select-wrap {
      max-width: none;
      width: 100%;
    }
    .cover-section .cover-times-compact {
      margin-bottom: 4px;
    }
    .cover-section .radio-groups-hint {
      margin: 0 0 6px;
      font-size: 0.68rem;
      line-height: 1.2;
    }
    .cover-section .cover-block {
      margin-top: 6px;
      padding-top: 6px;
    }
    .cover-section .cover-head {
      margin-bottom: 4px;
    }

    .gang-picker {
      direction: ltr;
      display: grid;
      grid-template-columns: repeat(4, minmax(2.6rem, 3.4rem));
      gap: 6px;
      width: max-content;
      max-width: 100%;
    }
    .profile-gang {
      margin: 4px 0 12px;
    }
    .profile-gang .gang-picker {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      width: 100%;
      max-width: none;
    }
    .profile-gang .gang-picker .radio-member {
      min-height: 34px;
      padding: 6px 4px;
    }
    .cover-section .gang-picker {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      width: 100%;
      max-width: none;
      margin-bottom: 2px;
    }
    .cover-section .gang-picker .radio-member {
      min-height: 34px;
      padding: 6px 4px;
    }

    .mixed-roles-section {
      display: grid;
      gap: 3px;
      margin: 0 0 6px;
      padding: 4px;
      border-radius: 8px;
      border: 1px solid var(--border, var(--conx-border, rgba(255, 255, 255, 0.12)));
      background: var(--surface);
      color: var(--text);
      container-type: inline-size;
      container-name: mixed-roles;
    }
    .mixed-roles-section > .radio-groups-hint {
      margin: 0 0 1px;
      font-size: 0.68rem;
      line-height: 1.2;
      color: var(--text-muted);
    }
    .mixed-roles-head .menu-label {
      margin-bottom: 0;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text);
    }
    .mixed-role-card {
      display: grid;
      gap: 2px;
      padding: 3px 5px;
      border-radius: 7px;
      border: 1px solid var(--border, var(--conx-border, rgba(255, 255, 255, 0.1)));
      background: var(--surface-2);
      color: var(--text);
    }
    .mixed-role-card-main {
      display: grid;
      grid-template-columns: minmax(2.2rem, 4.2rem) minmax(0, 1fr);
      align-items: center;
      gap: 3px 6px;
      min-width: 0;
    }
    .mixed-role-card-head {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0;
      min-width: 0;
      min-height: 0;
    }
    .mixed-role-l {
      font-weight: 800;
      letter-spacing: 0.04em;
      font-size: 0.7rem;
      line-height: 1.15;
      color: var(--text);
    }
    .mixed-role-name {
      font-size: 0.65rem;
      font-weight: 600;
      line-height: 1.15;
      color: var(--text);
      opacity: 1;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mixed-role-picker {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 2px;
      width: 100%;
      min-width: 0;
    }
    .mixed-role-picker .radio-member {
      flex: none;
      width: 100%;
      min-width: 0;
      padding: 2px 1px;
      min-height: 22px;
      border-radius: 6px;
    }
    .mixed-role-picker .radio-member-label {
      font-size: 0.58rem;
      font-weight: 650;
      text-align: center;
      line-height: 1.05;
      white-space: normal;
      overflow-wrap: anywhere;
      hyphens: auto;
    }
    .mixed-role-extras {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
      width: 100%;
    }
    .mixed-action-entity {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
      gap: 6px 10px;
      width: 100%;
    }
    .mixed-action-entity .field {
      margin: 0;
      min-width: 0;
    }
    .mixed-action-entity .field-hint {
      font-size: 0.58rem;
      line-height: 1.2;
    }
    .mixed-action-entity .picker-filter {
      min-height: 24px;
      margin-bottom: 3px;
      font-size: 0.7rem;
    }
    .mixed-pulse {
      width: max-content;
      max-width: 100%;
      margin: 0;
      gap: 3px;
    }
    .mixed-pulse span {
      font-size: 0.62rem;
      color: var(--text-muted);
    }
    .mixed-pulse input[type="number"] {
      width: 3.8rem;
      min-height: 24px;
      padding: 2px 4px;
      font-size: 0.72rem;
    }
    .mixed-cover-extras {
      width: 100%;
      display: grid;
      gap: 4px;
    }
    .mixed-cover-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
      gap: 6px 10px;
      width: 100%;
      align-items: start;
    }
    .mixed-cover-grid > .field,
    .mixed-cover-grid > .mixed-cover-slot-field {
      margin: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .mixed-cover-grid > .field > span,
    .mixed-cover-grid > .mixed-cover-slot-field > span:first-child {
      font-size: 0.62rem;
      color: var(--text-muted);
      line-height: 1.15;
    }
    .mixed-cover-grid input[type="number"],
    .mixed-cover-grid select,
    .mixed-cover-grid .select-wrap,
    .mixed-cover-grid ha-entity-picker {
      width: 100%;
      max-width: none;
      box-sizing: border-box;
    }
    .mixed-cover-grid input[type="number"],
    .mixed-cover-grid select {
      min-height: 24px;
      padding: 2px 4px;
      font-size: 0.72rem;
    }
    .mixed-cover-id .select-wrap {
      min-width: 0;
    }
    .mixed-cover-slot-field .mixed-cover-slot,
    .mixed-cover-slot {
      font-size: 0.72rem;
      font-weight: 650;
      color: var(--text);
      line-height: 1.3;
      min-height: 24px;
      display: flex;
      align-items: center;
    }
    .mixed-cover-ha-entity {
      grid-column: 1 / -1;
      width: 100%;
    }
    .mixed-cover-times-on {
      margin: 0;
      font-size: 0.62rem;
      line-height: 1.15;
    }
    @container mixed-roles (max-width: 360px) {
      .mixed-role-card-main {
        grid-template-columns: 1fr;
        gap: 2px;
      }
      .mixed-role-card-head {
        flex-direction: row;
        align-items: baseline;
        gap: 5px;
      }
      .mixed-role-picker {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .mixed-cover-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .mode-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      width: 100%;
    }
    .mode-picker .radio-member {
      flex: 1 1 calc(25% - 3px);
      min-width: 3.6rem;
      padding: 4px 3px;
      min-height: 28px;
      border-radius: 8px;
    }
    .mode-picker .radio-member-label {
      font-size: 0.68rem;
      font-weight: 800;
      white-space: normal;
      text-align: center;
      line-height: 1.1;
    }

    .color-select {
      display: grid;
      grid-template-columns: 18px 1fr;
      align-items: center;
      gap: 8px;
    }

    .swatch {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1px solid color-mix(in srgb, #000 20%, transparent);
      box-shadow: inset 0 1px 2px color-mix(in srgb, #fff 40%, transparent);
    }

    .toggle-row {
      display: grid;
      gap: 10px;
    }

    .switch-field {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 10px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 8px 0;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .radio-groups-section {
      margin: 2px 0 8px;
      padding: 8px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface-2, var(--surface)) 88%, transparent);
    }
    .radio-groups-section .menu-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0;
    }
    .radio-groups-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 34px;
    }
    .radio-groups-head-main {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }
    .radio-groups-summary {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .radio-groups-section:not(.open) {
      padding-top: 8px;
      padding-bottom: 8px;
    }
    .radio-groups-hint {
      margin: 4px 0 6px;
      font-size: 0.78rem;
      color: var(--text-muted);
      line-height: 1.35;
    }
    .radio-group-card {
      padding: 6px 8px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--input-bg, var(--surface));
      margin-bottom: 6px;
    }
    .radio-group-card:last-child {
      margin-bottom: 0;
    }
    .radio-group-card.is-summary {
      border-style: dashed;
      background: color-mix(in srgb, var(--surface-2, var(--surface)) 70%, transparent);
    }
    .radio-group-title {
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--label, var(--text-muted));
      margin-bottom: 8px;
    }
    .radio-group-members {
      /* Physical panel order: L1 leftmost regardless of UI language RTL. */
      direction: ltr;
      display: grid;
      grid-template-columns: repeat(var(--conx-gang-count, 4), minmax(0, 1fr));
      gap: 6px;
    }
    .radio-member {
      appearance: none;
      -webkit-appearance: none;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 9px 4px;
      border-radius: 10px;
      border: 1px solid var(--btn-border, var(--border));
      background: var(--btn-bg);
      color: var(--btn-text);
      cursor: pointer;
      font: inherit;
      user-select: none;
      transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
    }
    .radio-member:hover:not(:disabled) {
      border-color: var(--accent);
    }
    .radio-member:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .radio-member.on {
      border-color: var(--accent);
      background: var(--accent);
      color: var(--accent-text);
      box-shadow: none;
    }
    .radio-member:disabled {
      cursor: default;
    }
    .radio-member.is-independent.on:disabled {
      opacity: 1;
    }
    .radio-member-label {
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      line-height: 1;
    }
    .radio-groups-error {
      margin-top: 10px;
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid var(--warn-border, var(--border));
      background: var(--warn-bg, var(--accent-soft));
      color: var(--warn-text, var(--text));
      font-size: 0.85rem;
      font-weight: 600;
    }

    .cover-section {
      margin: 2px 0 8px;
      padding: 8px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface-2, var(--surface)) 88%, transparent);
    }
    .cover-block {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    }
    .cover-block:first-of-type {
      margin-top: 6px;
      padding-top: 8px;
    }
    .cover-block-empty {
      padding: 8px;
      border: 1px dashed var(--border);
      border-radius: 10px;
      border-top: 1px dashed var(--border);
      background: color-mix(in srgb, var(--surface) 70%, transparent);
    }
    .cover-slot-status {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .cover-add-slot {
      width: 100%;
      min-height: 44px;
      font-weight: 800;
    }
    .cover-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
    }
    .cover-section .menu-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .cover-control-block + .cover-control-block {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    }
    .cover-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 10px;
    }
    .cover-field {
      padding: 10px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--input-bg, var(--surface));
    }
    .cover-label {
      display: block;
      margin-bottom: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .cover-buttons {
      /* Physical panel order: L1 leftmost regardless of UI language RTL. */
      direction: ltr;
      display: grid;
      grid-template-columns: repeat(var(--conx-gang-count, 4), minmax(0, 1fr));
      gap: 8px;
      width: 100%;
    }
    .cover-buttons .radio-member {
      min-height: 42px;
      padding: 10px 4px;
    }
    .cover-buttons .radio-member-label {
      font-size: 0.85rem;
    }
    .cover-safety {
      margin: 10px 0 0;
      font-size: 0.8rem;
      line-height: 1.45;
      color: var(--text-muted);
    }
    .cover-control {
      margin-top: 12px;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface-2, var(--surface)) 88%, transparent);
    }
    .cover-control-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }
    .cover-state {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .cover-state-open,
    .cover-state-close {
      color: var(--accent);
    }
    .cover-control-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    @media (max-width: 520px) {
      .cover-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 520px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
      .header {
        flex-direction: column;
      }
      .header-side {
        align-items: flex-start;
      }
    }

    .btn {
      font: inherit;
      color: var(--btn-text);
      cursor: pointer;
      border-radius: 999px;
      border: 1px solid var(--btn-border, var(--border));
      background: var(--btn-bg);
      padding: 6px 10px;
      font-weight: 700;
      font-size: 0.88rem;
      min-height: 34px;
      box-shadow:
        inset 0 1px 0 var(--bevel-light),
        0 2px 6px rgba(0, 0, 0, 0.18);
      transition: filter 120ms ease;
    }

    .btn:hover:not(:disabled) {
      filter: brightness(1.06);
    }

    .btn:active:not(:disabled) {
      filter: brightness(0.98);
    }

    .btn.primary {
      background: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      border-color: var(--btn-primary-bg);
      font-weight: 700;
    }

    .btn.danger {
      color: #ffffff;
      background: var(--danger);
      border-color: var(--danger);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: none;
    }

    .buttons-accordion {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .button-edit {
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      overflow: hidden;
    }

    .button-edit-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      border: 0;
      background: transparent;
      color: var(--text);
      font: inherit;
      cursor: pointer;
      text-align: start;
    }

    .button-edit-toggle:hover:not(:disabled) {
      background: color-mix(in srgb, var(--conx-accent) 6%, transparent);
    }

    .button-edit-toggle:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .button-edit-chevron {
      width: 8px;
      height: 8px;
      border-inline-end: 2px solid color-mix(in srgb, var(--conx-ink) 45%, transparent);
      border-bottom: 2px solid color-mix(in srgb, var(--conx-ink) 45%, transparent);
      transform: rotate(-45deg);
      transition: transform 180ms ease;
      flex-shrink: 0;
      margin-inline-start: 2px;
    }

    :host([dir="rtl"]) .button-edit-chevron,
    ha-card[dir="rtl"] .button-edit-chevron {
      transform: rotate(45deg);
    }

    .button-edit.open .button-edit-chevron {
      transform: rotate(45deg);
    }

    :host([dir="rtl"]) .button-edit.open .button-edit-chevron,
    ha-card[dir="rtl"] .button-edit.open .button-edit-chevron {
      transform: rotate(-45deg);
    }

    .button-edit-summary {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }

    .button-edit-title {
      font-weight: 600;
      line-height: 1.2;
    }

    .button-edit-meta {
      font-size: 0.78rem;
      opacity: 0.62;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .button-edit-body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 200ms ease;
    }

    .button-edit.open .button-edit-body {
      grid-template-rows: 1fr;
    }

    .button-edit-fields {
      overflow: hidden;
      padding: 0 12px;
    }

    .button-edit.open .button-edit-fields {
      padding: 0 12px 12px;
      border-top: 1px solid color-mix(in srgb, var(--conx-steel) 22%, transparent);
    }

    .button-edit.open .button-edit-fields .field:first-child {
      margin-top: 10px;
    }

    .button-edit .field:last-child {
      margin-bottom: 0;
    }

    /* Product-photo faceplate: fill ha-card width; keep 4-gang landscape proportions. */
    .faceplate {
      width: 100%;
      max-width: 100%;
      container-type: inline-size;
      container-name: faceplate;
    }

    .faceplate-bezel {
      position: relative;
      width: 100%;
      max-width: none;
      min-width: 0;
      margin: 0;
      aspect-ratio: calc(0.66 * 4) / 1;
      border-radius: 22px;
      padding: 7px;
      box-sizing: border-box;
      background: linear-gradient(145deg, #f2f0ea 0%, #b8b0a4 36%, #ebe6dc 62%, #8a8378 100%);
      box-shadow:
        inset 0 1px 1px #fff,
        inset 0 -1px 2px rgba(0, 0, 0, 0.35),
        0 16px 36px rgba(0, 0, 0, 0.35);
    }

    .faceplate-menu-btn {
      position: absolute;
      top: 6px;
      z-index: 5;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.28);
      background: rgba(26, 29, 34, 0.78);
      color: #f0f2f5;
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.18) inset, 0 2px 6px rgba(0, 0, 0, 0.28);
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      cursor: pointer;
      padding: 0;
      backdrop-filter: blur(4px);
      /* Faceplate itself is dir=ltr for ring columns; pin to card reading-start. */
      left: 6px;
      right: auto;
    }
    ha-card.conx-card[dir="rtl"] .faceplate-menu-btn {
      left: auto;
      right: 6px;
    }
    .faceplate-menu-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    .faceplate-menu-btn span {
      display: block;
      width: 12px;
      height: 1.5px;
      border-radius: 1px;
      background: currentColor;
    }

    .faceplate-skin {
      position: absolute;
      inset: 7px;
      border-radius: 16px;
      background-image: var(--conx-faceplate-skin, none);
      background-size: cover;
      background-position: center;
      opacity: 0;
      pointer-events: none;
      z-index: 2;
    }

    .faceplate-glass {
      position: relative;
      z-index: 1;
      height: 100%;
      border-radius: 16px;
      overflow: hidden;
      display: grid;
      /* Label bar ~28%: room for HE names; rings stay in the light body only. */
      grid-template-rows: 28% 72%;
      background: #fff;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
    }

    .faceplate-labels {
      display: grid;
      grid-template-columns: repeat(var(--conx-gang-count, 4), 1fr);
      align-items: center;
      background: linear-gradient(180deg, #2a3038 0%, #1a1d22 100%);
      color: #f0f2f5;
      padding: 0 6px;
      min-height: 0;
      z-index: 2;
    }

    .faceplate-label {
      text-align: center;
      font-size: clamp(0.7rem, 4.2cqw, 1.05rem);
      font-weight: 600;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 4px;
      font-family: var(--conx-font);
    }

    .faceplate-touch {
      display: flex;
      align-items: center;
      justify-content: stretch;
      background: linear-gradient(180deg, #ffffff 0%, #f7f5f1 70%, #efebe4 100%);
      /* Top pad clears the label bar; bottom bias keeps rings in the lower body. */
      padding: 10% 3% 14%;
      min-height: 0;
      overflow: hidden;
      box-sizing: border-box;
    }

    .faceplate-rings {
      display: grid;
      grid-template-columns: repeat(var(--conx-gang-count, 4), 1fr);
      width: 100%;
      place-items: center;
      align-content: center;
    }

    .ring {
      width: clamp(26px, 12.5cqw, 56px);
      height: clamp(26px, 12.5cqw, 56px);
      border-radius: 50%;
      border: 3px solid
        color-mix(in srgb, var(--ring-off, var(--conx-ring-off)) 70%, #9aa7b5);
      background: transparent;
      padding: 0;
      cursor: pointer;
      position: relative;
      box-shadow:
        0 0 8px color-mix(in srgb, var(--ring-off, var(--conx-ring-off)) 40%, transparent);
      transition:
        border-color 160ms ease,
        box-shadow 160ms ease,
        transform 120ms ease;
    }

    .ring.on {
      border-color: var(--ring-on, var(--conx-ring));
      box-shadow:
        0 0 18px color-mix(in srgb, var(--ring-on, var(--conx-ring)) 75%, transparent),
        0 0 6px color-mix(in srgb, var(--ring-on, var(--conx-ring)) 90%, transparent);
    }

    .ring.pressed {
      transform: scale(0.92);
    }

    .ring-glow {
      position: absolute;
      inset: 6px;
      border-radius: 50%;
      background: color-mix(
        in srgb,
        var(--ring-off, var(--conx-ring-off)) 14%,
        transparent
      );
      pointer-events: none;
    }

    .ring.on .ring-glow {
      background: color-mix(in srgb, var(--ring-on, var(--conx-ring)) 28%, transparent);
    }

    .syncing-pulse .sync-btn,
    .syncing-pulse .badge.status-syncing {
      animation: conx-pulse 700ms ease;
    }

    @keyframes conx-pulse {
      0% {
        filter: brightness(1);
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--conx-accent) 0%, transparent);
      }
      40% {
        filter: brightness(1.12);
        box-shadow: 0 0 0 6px color-mix(in srgb, var(--conx-accent) 22%, transparent);
      }
      100% {
        filter: brightness(1);
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--conx-accent) 0%, transparent);
      }
    }

    .pad {
      padding: 16px;
      position: relative;
      z-index: 1;
    }

    .header {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      align-items: center;
      margin-bottom: 14px;
      direction: ltr;
    }
    .header-side {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      flex-direction: row;
      direction: ltr;
    }
    .operate-btn {
      min-height: 46px;
      padding: 0 14px;
      border-radius: 14px;
      border: 1px solid var(--btn-border, var(--border));
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 55%),
        var(--btn-bg);
      color: var(--text);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset, 0 2px 6px rgba(0, 0, 0, 0.2);
      font-family: var(--body, inherit);
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      white-space: nowrap;
    }
    .operate-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    ha-card.conx-card[data-theme="ivory"] .operate-btn {
      background: linear-gradient(180deg, #ffffff, var(--btn-bg));
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 2px 6px rgba(20, 28, 40, 0.08);
    }
    ha-card.conx-card.operate-mode {
      padding: 8px;
      background:
        linear-gradient(180deg, rgba(255,255,255,.04) 0%, transparent 40%),
        linear-gradient(165deg, #262b34 0%, #1a1d22 44%, #15181e 100%);
    }
    ha-card.conx-card.operate-mode[data-theme="ivory"] {
      background:
        linear-gradient(180deg, rgba(255,255,255,.55) 0%, transparent 42%),
        linear-gradient(165deg, #f7f4ee 0%, #ebe6dc 48%, #e4dfd4 100%);
    }
    ha-card.conx-card.operate-mode .atmosphere {
      opacity: 0.35;
    }
    ha-card.conx-card.operate-mode .operate-layout {
      gap: 0;
      margin: 0;
    }
    ha-card.conx-card.operate-mode .hero-preview.operate-hero {
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
    }
    ha-card.conx-card.operate-mode .section-head.operate-profile-only {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding: 4px 8px 10px;
      border-bottom: 0;
      background: transparent;
    }
    ha-card.conx-card.operate-mode .section-head.operate-profile-only .hero-profile-name {
      position: static;
      left: auto;
      transform: none;
      max-width: min(90%, 320px);
      pointer-events: auto;
    }
    ha-card.conx-card.operate-mode .hero-body {
      padding: 0;
      background: transparent;
      gap: 10px;
    }
    ha-card.conx-card.operate-mode .cover-control {
      margin-top: 0;
      padding: 10px;
    }
    /*
      Operate mode shrinks the card to the faceplate. Absolute .conx-layer
      overlays are clipped to that short box and force awkward inner scroll.
      When any modal is open, inflate the card so menus/modals open full-size.
    */
    ha-card.conx-card.operate-mode.overlay-open {
      min-height: min(92dvh, 720px);
    }
    ha-card.conx-card.operate-mode.overlay-open .conx-layer {
      align-items: center;
      justify-content: center;
      padding: clamp(12px, 2.5vw, 20px);
      overflow: auto;
    }
    ha-card.conx-card.operate-mode.overlay-open .conx-panel.compact {
      width: min(440px, 100%);
      max-height: none;
      overflow: visible;
      margin: auto;
    }
    ha-card.conx-card.operate-mode.overlay-open .conx-panel.wide,
    ha-card.conx-card.operate-mode.overlay-open .conx-panel.xwide {
      width: min(100%, 680px);
      max-height: calc(100% - 24px);
      overflow: hidden;
      margin: auto;
    }
    ha-card.conx-card.operate-mode.overlay-open .info-panel {
      display: flex;
      flex-direction: column;
    }
    ha-card.conx-card.operate-mode.overlay-open .info-panel .info-sections {
      max-height: none;
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
    }
    ha-card.conx-card.operate-mode.overlay-open .automation-panel {
      display: flex;
      flex-direction: column;
    }
    ha-card.conx-card.operate-mode.overlay-open .automation-panel .automation-yaml {
      max-height: none;
      flex: 1 1 auto;
      min-height: 0;
    }
    .menu-btn {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      border: 1px solid var(--btn-border, var(--border));
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 55%),
        var(--btn-bg);
      color: var(--text);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset, 0 2px 6px rgba(0, 0, 0, 0.2);
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      cursor: pointer;
      padding: 0;
    }
    ha-card.conx-card[data-theme="ivory"] .menu-btn {
      background: linear-gradient(180deg, #ffffff, var(--btn-bg));
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 2px 6px rgba(20, 28, 40, 0.08);
    }
    .menu-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    .menu-btn span {
      display: block;
      width: 18px;
      height: 2px;
      border-radius: 2px;
      background: currentColor;
    }
    .conx-layer {
      /* Absolute inside ha-card (overflow clip); preview uses viewport-fixed siblings. */
      position: absolute;
      inset: 0;
      z-index: 80;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(8, 10, 14, 0.55);
      opacity: 1;
      backdrop-filter: blur(2px);
    }
    ha-card.conx-card[data-theme="ivory"] .conx-layer {
      background: rgba(20, 28, 40, 0.42);
    }
    .conx-panel {
      width: min(400px, 100%);
      max-height: calc(100% - 32px);
      overflow: auto;
      display: flex;
      flex-direction: column;
      padding: 14px 14px 16px;
      border-radius: 18px;
      border: 1px solid var(--border);
      background: var(--surface-2, var(--surface));
      color: var(--text);
      box-shadow:
        0 22px 56px rgba(8, 10, 14, 0.48),
        inset 0 1px 0 var(--conx-bevel-light);
      animation: conx-panel-in 180ms ease;
    }
    /* Short settings menu: size to content — no inner scrollbar when it fits. */
    .conx-panel.compact {
      width: min(420px, 100%);
      max-height: none;
      overflow: visible;
    }
    @keyframes conx-panel-in {
      from {
        transform: scale(0.96) translateY(8px);
        opacity: 0.85;
      }
      to {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }
    .conx-panel.wide { width: min(100%, 560px); }
    .conx-panel.xwide { width: min(100%, 760px); max-height: min(90%, 860px); }
    .automation-hint {
      margin: 0 0 12px;
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }
    .info-intro {
      margin: 0 0 12px;
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.45;
    }
    .info-sections {
      display: grid;
      gap: 12px;
      max-height: min(58vh, 520px);
      overflow: auto;
      padding-inline-end: 4px;
    }
    .info-section {
      margin: 0;
      padding: 0;
    }
    .info-section-title {
      margin: 0 0 4px;
      font-size: 0.95rem;
      font-weight: 750;
      color: var(--text);
      line-height: 1.25;
    }
    .info-section-body {
      margin: 0;
      font-size: 0.82rem;
      line-height: 1.45;
      color: var(--text-muted);
    }
    .automation-yaml {
      margin: 0;
      max-height: 52vh;
      overflow: auto;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--input-bg);
      color: var(--input-text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.78rem;
      line-height: 1.5;
      white-space: pre;
      text-align: left;
      -webkit-user-select: text;
      user-select: text;
    }
    .automation-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 12px;
    }
    .automation-actions .btn { min-width: 112px; justify-content: center; }
    .menu-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }
    .menu-title, .export-title {
      font-family: var(--conx-display);
      font-size: 1.25rem;
      font-weight: 700;
    }
    .menu-close {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--btn-bg);
      color: var(--text);
      cursor: pointer;
      font-size: 1.2rem;
      line-height: 1;
    }
    .menu-section { margin-bottom: 14px; }
    .menu-section .menu-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .menu-actions {
      display: grid;
      gap: 8px;
    }
    .lang-flags {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    .hero-preview {
      border-radius: 16px;
      border: 1px solid var(--border);
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 40%),
        var(--surface-2);
      overflow: hidden;
      margin-bottom: 10px;
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06) inset;
    }
    ha-card.conx-card[data-theme="ivory"] .hero-preview {
      background: linear-gradient(180deg, #ffffff, var(--surface-2));
      box-shadow: none;
    }
    .hero-preview .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      position: relative;
    }
    .hero-preview .section-head-main,
    .hero-preview .section-head > .switch {
      position: relative;
      z-index: 1;
      flex: 0 1 auto;
      min-width: 0;
    }
    .hero-preview .section-title {
      font-family: var(--conx-display);
      font-size: 1.35rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .hero-profile-name {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      z-index: 0;
      text-align: center;
      font-family: var(--conx-display);
      font-weight: 600;
      font-size: clamp(1.05rem, 2.8vw, 1.45rem);
      letter-spacing: 0.01em;
      line-height: 1.15;
      color: var(--accent);
      max-width: min(46%, 280px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
    }
    .hero-body {
      padding: 12px 10px 14px;
      background: var(--faceplate-well);
    }
    .hero-preview.closed .hero-body {
      display: none;
    }
    .hero-preview.closed .section-head {
      border-bottom: 0;
    }
    .layout-hint {
      margin: 0 0 10px;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .settings-tabs {
      border-radius: 16px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      overflow: hidden;
    }
    .tab-bar {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 70%, var(--surface-2));
      margin-bottom: 0;
    }
    .tab-btn {
      appearance: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1px;
      border: 0;
      border-radius: 0;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--text-muted);
      font: inherit;
      font-weight: 700;
      min-height: 42px;
      padding: 6px 6px;
      cursor: pointer;
      transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
    }
    .tab-btn:hover {
      color: var(--text);
      background: var(--accent-soft);
    }
    .tab-btn.active {
      color: var(--text);
      border-bottom-color: var(--accent);
      background: color-mix(in srgb, var(--accent-soft) 55%, transparent);
    }
    .tab-step {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .tab-btn:not(.active) .tab-step {
      color: var(--text-muted);
      opacity: 0.8;
    }
    .tab-label {
      font-family: var(--conx-display);
      font-size: 1.05rem;
      font-weight: 600;
    }
    .tab-panels {
      padding: 0;
    }
    .tab-panel {
      display: none;
      padding: 16px;
    }
    .tab-panel.active {
      display: block;
    }
    .profile-list {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 10px;
    }
    .profile-name-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .profile-name-row .field { margin-bottom: 0; }
    .profile-actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .profile-actions .btn {
      width: 100%;
      min-height: 50px;
      justify-content: center;
    }
    .status-action-bar {
      position: sticky;
      top: 0;
      z-index: 5;
      display: grid;
      gap: 6px;
      margin: 0 0 8px;
      padding: 0 0 2px;
      background: linear-gradient(
        to bottom,
        var(--card-background-color, var(--ha-card-background, var(--surface, #12141a))) 70%,
        transparent
      );
    }
    .actions-dock { margin-top: 0; }
    .actions-dock-top {
      border-radius: 12px;
      border: 1px solid var(--border, var(--divider-color, #333));
      background: var(--surface-2, color-mix(in srgb, var(--card-background-color, #1a1d24) 92%, #000));
      padding: 6px;
    }
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
      margin: 0;
    }
    .actions-grid .btn {
      width: 100%;
      justify-content: center;
      min-height: 32px;
      padding: 5px 8px;
      font-size: 0.82rem;
    }
    @media (max-width: 720px) {
      .actions-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    .btn.success {
      background: var(--btn-success-bg, #1f8a4c);
      color: var(--btn-success-text, #fff);
      border-color: var(--btn-success-bg, #1f8a4c);
    }
    .export-hint {
      margin: 0 0 12px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .export-actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }
    .export-footer { margin-top: 12px; }
    .dimmer-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 28px;
    }
    .dimmer-pct {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 3.4em;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.92rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      color: var(--accent-text);
      background: var(--accent);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.18) inset, 0 2px 8px rgba(0, 0, 0, 0.22);
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }
    .dimmer-field input[type="range"] {
      width: 100%;
      height: 44px;
      accent-color: var(--accent);
    }
    .single-layout {
      display: grid !important;
      gap: var(--conx-gap);
      grid-template-columns: 1fr !important;
    }
    @media (max-width: 520px) {
      .profile-list { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .profile-name-row, .export-actions, .actions-grid { grid-template-columns: 1fr; }
      .tab-label { font-size: 0.95rem; }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "conx-dynamic-panel-card": ConXDynamicPanelCard;
  }
}
