import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  COVER_SETTLE_MAX,
  COVER_SETTLE_MIN,
  COVER_TIME_MAX,
  COVER_TIME_MIN,
  clampGangCount,
  cloneProfile,
  coverCommand,
  createProfile,
  deleteProfile,
  downloadJson,
  duplicateProfile,
  exportProfiles,
  fetchConfig,
  importProfiles,
  maxCoversForGangs,
  normalizeCover,
  normalizeCovers,
  profilesEqual,
  pullPanel,
  setActiveProfile,
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
  LANGUAGE_OPTIONS,
  type CardLanguage,
  isRtl,
  loadStoredLanguage,
  localize,
  normalizeLanguage,
  persistLanguage,
} from "./localize";
import {
  THEME_OPTIONS,
  type CardThemeId,
  loadStoredTheme,
  normalizeTheme,
  persistTheme,
  resolveTheme,
} from "./themes";
import type {
  CardConfig,
  CoverConfig,
  HomeAssistant,
  PanelConfig,
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

/** CSS colors for Zemismart LED name options (adapter select values). */
export const COLOR_PREVIEW: Record<string, string> = {
  red: "#ff1744",
  blue: "#2979ff",
  green: "#00e676",
  white: "#f5f7fa",
  yellow: "#ffea00",
  magenta: "#f50057",
  cyan: "#00e5ff",
  warm_white: "#ffe0b2",
  warm_yellow: "#ffc400",
};

const DEFAULT_RING_ON = "#00e5ff";
const DEFAULT_RING_OFF = "#2979ff";

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

/** Map a profile LED color name to a CSS color for the faceplate rings. */
export function resolveLedPreviewColor(
  name: string | undefined,
  fallback = DEFAULT_RING_ON
): string {
  if (!name) {
    return fallback;
  }
  return COLOR_PREVIEW[name] || name || fallback;
}

@customElement("conx-dynamic-panel-card")
export class ConXDynamicPanelCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

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
  @state() private _uiLang?: CardLanguage;
  @state() private _theme: CardThemeId = "noir";
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
  @state() private _previewOpen = true;
  @state() private _panelNameDraft = "";
  /** Single open/collapsed state for the whole radio_split groups block. */
  @state() private _radioGroupsOpen = true;

  private _importInput?: HTMLInputElement;

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
    this._ensureFonts();
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
    link.href =
      "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap";
    document.head.appendChild(link);
  }

  protected updated(changed: Map<string, unknown>): void {
    if (
      (changed.has("hass") || changed.has("_config")) &&
      this.hass &&
      this._config?.entry_id &&
      !this._panel &&
      !this._loading
    ) {
      void this._load();
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
    const normalized = groups.map((group, index) => ({
      id: String(group?.id || `g${index + 1}`),
      buttons: Array.isArray(group?.buttons)
        ? group.buttons
            .map((n) => Number(n))
            .filter((n, i, arr) => n >= 1 && n <= 4 && arr.indexOf(n) === i)
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
    if (!this._draft || this._draft.mode !== "radio_split") {
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
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._loading = false;
    }
  }

  private _applyPanel(panel: PanelConfig): void {
    this._panel = panel;
    this._panelNameDraft = panel.panel_name;
    const activeId = panel.active_profile_id;
    const profile = activeId ? panel.profiles[activeId] : undefined;
    this._saved = profile ? cloneProfile(profile) : undefined;
    this._draft = profile ? cloneProfile(profile) : undefined;
    if (this._draft?.mode === "radio_split") {
      this._radioGroupsOpen = loadStoredRadioGroupsOpen() ?? true;
    }
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

  private _isCoverButton(buttonIndex: number): boolean {
    if (this._draft?.mode !== "cover") {
      return false;
    }
    return this._covers().some(
      (cover) => cover.open_button === buttonIndex || cover.close_button === buttonIndex
    );
  }

  private _coverDirectionFor(buttonIndex: number): "open" | "close" | null {
    if (this._draft?.mode !== "cover") {
      return null;
    }
    for (const cover of this._covers()) {
      if (cover.open_button === buttonIndex) return "open";
      if (cover.close_button === buttonIndex) return "close";
    }
    return null;
  }

  private _coverForButton(buttonIndex: number): CoverConfig | null {
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
    this._patchDraft((draft) => {
      draft.mode = mode;
      if (draft.mode === "cover") {
        // 4-gang panels need gang_count=4 so two covers (floor(n/2)) are available.
        const gangs = clampGangCount(draft.gang_count ?? 4);
        draft.gang_count = gangs < 4 ? 4 : gangs;
        draft.covers = normalizeCovers(draft);
        delete draft.cover;
      } else if (draft.mode === "radio_split") {
        this._ensureRadioGroups(draft);
        this._setRadioGroupsOpen(true);
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
        <div class="cover-times">
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
        <label class="field">
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
    if (this._saved?.mode !== "cover") {
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
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._busy = false;
    }
  }

  private _discard(): void {
    if (this._saved) {
      this._draft = cloneProfile(this._saved);
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

  private _onButtonActionInput(index: number, e: Event): void {
    const action = (e.target as HTMLInputElement).value.trim();
    this._patchDraft((draft) => {
      const button = draft.buttons.find((item) => item.index === index);
      if (!button) {
        return;
      }
      if (!action) {
        button.action = null;
        return;
      }
      button.action = {
        action,
        target: button.action?.target || {},
        data: button.action?.data || {},
      };
    });
  }

  private _onButtonEntityInput(index: number, e: Event): void {
    const entityId = (e.target as HTMLInputElement).value.trim();
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

  private _buttonEntityId(buttonIndex: number): string | null {
    const button = this._draft?.buttons.find((item) => item.index === buttonIndex);
    const entityId = (
      button?.action?.target as { entity_id?: string } | undefined
    )?.entity_id;
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

  private _isRingOn(buttonIndex: number): boolean {
    if (!this._draft) {
      return false;
    }
    if (this._draft.mode === "cover") {
      const direction = this._coverDirectionFor(buttonIndex);
      if (direction) {
        // A direction ring is lit only while the engine reports that travel.
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
        return Boolean(this._splitPreviewOn[buttonIndex]);
      }
    }
    if (this._draft.mode === "radio_split") {
      const entityId = this._buttonEntityId(buttonIndex);
      if (entityId) {
        const on = this._entityIsOn(entityId);
        if (on !== null) {
          return on;
        }
      }
      return Boolean(this._splitPreviewOn[buttonIndex]);
    }
    const radioMode = this._draft.mode !== "toggle";
    if (radioMode && this._isRadioMember(buttonIndex)) {
      return this._draft.selected_button === buttonIndex;
    }
    const entityId = this._buttonEntityId(buttonIndex);
    if (entityId) {
      const on = this._entityIsOn(entityId);
      if (on !== null) {
        return on;
      }
    }
    // No live entity state: show a mixed sample so both LED colors are visible.
    return buttonIndex % 2 === 1;
  }

  private _onRingPress(buttonIndex: number): void {
    this._pressedRing = buttonIndex;
    window.setTimeout(() => {
      if (this._pressedRing === buttonIndex) {
        this._pressedRing = null;
      }
    }, 180);
    if (!this._draft || this._draft.mode === "toggle") {
      return;
    }
    if (this._draft.mode === "cover") {
      const direction = this._coverDirectionFor(buttonIndex);
      if (!direction) {
        return;
      }
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
      return;
    }
    if (!this._isRadioMember(buttonIndex)) {
      return;
    }
    // Classic radio: exactly one on; re-pressing selected does not turn it off.
    if (this._draft.selected_button === buttonIndex) {
      return;
    }
    this._patchDraft((draft) => {
      draft.selected_button = buttonIndex;
    });
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
        Faceplate topography matches Zemismart 4-gang: black label bar,
        white glass touch face, fixed 4-slot grid L→R. Only L1…Ln render;
        unused slots stay empty so outer size never shrinks with gang_count.
        Rings use profile color_on / color_off. Extension point for a future
        photo skin: set --conx-faceplate-skin on .faceplate.
      -->
      <div
        class="faceplate"
        dir="ltr"
        style="--ring-on:${ringOn};--ring-off:${ringOff};--conx-gang-count:${this._gangCount()}"
        role="img"
        aria-label=${this.t("card.preview")}
      >
        <div class="faceplate-bezel">
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
    const selected = this._draft.mode;
    return html`
      <label class="field">
        <span>${this.t("card.mode")}</span>
        <div class="mode-picker" role="radiogroup" data-mode-picker>
          ${this._panel.capabilities.modes.map(
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
    return html`
          <div class="grid-2">
            <label class="field">
              <span>${this.t("card.color_on")}</span>
              <div class="select-wrap color-select">
                <span
                  class="swatch"
                  style="background:${resolveLedPreviewColor(this._draft.color_on)}"
                ></span>
                <select
                  .value=${this._draft.color_on}
                  ?disabled=${this._busy}
                  @change=${(e: Event) =>
                    this._patchDraft((draft) => {
                      draft.color_on = (e.target as HTMLSelectElement).value;
                    })}
                >
                  ${this._panel.capabilities.colors.map(
                    (color) => html`<option value=${color}>${color}</option>`
                  )}
                </select>
              </div>
            </label>
            <label class="field">
              <span>${this.t("card.color_off")}</span>
              <div class="select-wrap color-select">
                <span
                  class="swatch"
                  style="background:${resolveLedPreviewColor(this._draft.color_off)}"
                ></span>
                <select
                  .value=${this._draft.color_off}
                  ?disabled=${this._busy}
                  @change=${(e: Event) =>
                    this._patchDraft((draft) => {
                      draft.color_off = (e.target as HTMLSelectElement).value;
                    })}
                >
                  ${this._panel.capabilities.colors.map(
                    (color) => html`<option value=${color}>${color}</option>`
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
                ${this._panel.capabilities.radar.map(
                  (value) => html`<option value=${value}>${value}</option>`
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

  private _renderButtonsFields() {
    if (!this._panel || !this._draft) {
      return nothing;
    }
    return html`
      ${this._renderModePicker()} ${this._renderRadioGroupsEditor()}
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
              const behavior = coverDirection
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
              const meta =
                [action, entityId, behavior].filter(Boolean).join(" · ") || "—";
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
                            <label class="field">
                              <span>${this.t("card.action")}</span>
                              <input
                                type="text"
                                .value=${action}
                                placeholder="light.toggle"
                                ?disabled=${this._busy}
                                @input=${(e: Event) =>
                                  this._onButtonActionInput(button.index, e)}
                              />
                            </label>
                            <label class="field">
                              <span>${this.t("card.entity_id")}</span>
                              <input
                                type="text"
                                .value=${entityId}
                                placeholder="light.living_room"
                                ?disabled=${this._busy}
                                @input=${(e: Event) =>
                                  this._onButtonEntityInput(button.index, e)}
                              />
                            </label>
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
      <div class="row actions">
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
    return html`
      <ha-card
        dir=${rtl ? "rtl" : "ltr"}
        data-theme=${this._theme}
        class="conx-card theme-${this._theme} ${this._view === "export" ? "export-open" : "editor-open"} ${this._menuOpen ? "menu-open" : ""} ${compact ? "compact" : ""} ${this._syncPulse ? "syncing-pulse" : ""}"
      >
        <div class="atmosphere"></div>
        <div class="header" dir="ltr">
          <div class="header-side">
            <div class="badge status-${this._panel.sync_status}">
              ${this.t("card.status")}: ${this._panel.sync_status}
            </div>
            <button
              type="button"
              class="menu-btn"
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

        ${this._dirty
          ? html`<div class="warn">${this.t("card.unsaved")}</div>`
          : nothing}
        ${this._notice
          ? html`<div class="notice">${this._notice}</div>`
          : nothing}
        ${this._error || this._panel.last_error
          ? html`<div class="error">${this._error || this._panel.last_error}</div>`
          : nothing}

        ${this._renderMainEditor()}
        ${this._menuOpen ? this._renderSettingsMenu() : nothing}
        ${this._automationOpen ? this._renderAutomationExample() : nothing}
        ${this._view === "export" ? this._renderExportView() : nothing}
      </ha-card>
    `;
  }

  private _renderSettingsMenu() {
    return html`
      <div
        class="conx-layer"
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) this._menuOpen = false;
        }}
      >
        <aside class="conx-panel compact" role="dialog" aria-modal="true">
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
      <div class="layout single-layout">
        <section class="hero-preview ${this._previewOpen ? "open" : "closed"}">
          <header class="section-head">
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
          ${this._previewOpen
            ? html`<div class="hero-body">
                ${this._renderFaceplate()} ${this._renderCoverControl()}
              </div>`
            : nothing}
        </section>

        <p class="layout-hint">${this.t("card.tabs_hint")}</p>

        <div class="settings-tabs">
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

        <div class="actions-dock">
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
      --conx-gap: 12px;
    }


    ha-card.conx-card {
      position: relative;
      overflow: hidden;
      font-family: var(--conx-font);
      color: var(--text);
      background:
        linear-gradient(180deg, rgba(255,255,255,.08) 0%, transparent 36%),
        linear-gradient(165deg, #262b34 0%, #1a1d22 44%, #15181e 100%);
      border: 1px solid var(--border);
      box-shadow: var(--card-shadow);
      padding: 18px;

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
      --accent-text: #ffffff;
      --danger: #b42318;
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
        radial-gradient(circle at 12% 0%, var(--conx-atm-1), transparent 42%),
        radial-gradient(circle at 88% 100%, var(--conx-atm-2), transparent 40%),
        repeating-linear-gradient(
          -18deg,
          transparent,
          transparent 10px,
          color-mix(in srgb, #0b1218 2.5%, transparent) 10px,
          color-mix(in srgb, #0b1218 2.5%, transparent) 11px
        );
      opacity: 0.55;
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
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    .theme-swatch {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      min-width: 72px;
      font: inherit;
    }
    .theme-swatch:hover {
      color: var(--text);
    }
    .theme-swatch.active {
      color: var(--text);
    }
    .theme-swatch-face {
      display: block;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--swatch);
      border: 2px solid var(--border);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }
    .theme-swatch.active .theme-swatch-face {
      border-color: var(--swatch-accent, var(--conx-accent));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--swatch-accent, var(--conx-accent)) 40%, transparent);
    }
    .theme-swatch-name {
      font-size: 0.72rem;
      font-weight: 600;
      line-height: 1.25;
      text-align: start;
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

    .header,
    .warn,
    .error,
    .notice,
    .layout {
      position: relative;
      z-index: 1;
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
      text-shadow: 0 1px 0 var(--conx-bevel-light);
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

    .warn {
      background: color-mix(in srgb, var(--warning-color, #ed6c02) 14%, transparent);
      border-color: color-mix(in srgb, var(--warning-color, #ed6c02) 28%, transparent);
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
      gap: 5px;
      margin-bottom: 10px;
      font-size: 0.9rem;
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
      min-height: 42px;
    }
    .cover-section .gang-picker {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      width: 100%;
      max-width: none;
      margin-bottom: 4px;
    }
    .cover-section .gang-picker .radio-member {
      min-height: 42px;
    }

    .mode-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      width: 100%;
    }
    .mode-picker .radio-member {
      flex: 1 1 0;
      min-width: min(100%, 5.25rem);
      padding: 12px 8px;
      min-height: 44px;
    }
    .mode-picker .radio-member-label {
      font-size: 0.82rem;
      font-weight: 800;
      white-space: normal;
      text-align: center;
      line-height: 1.2;
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
      margin: 4px 0 10px;
      padding: 12px;
      border-radius: 14px;
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
      margin: 8px 0 10px;
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.45;
    }
    .radio-group-card {
      padding: 10px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--input-bg, var(--surface));
      margin-bottom: 8px;
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
      background: var(--accent-soft);
      color: var(--text);
      box-shadow: inset 0 0 0 1px var(--accent);
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
      margin: 4px 0 10px;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface-2, var(--surface)) 88%, transparent);
    }
    .cover-block {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    }
    .cover-block:first-of-type {
      margin-top: 8px;
      padding-top: 10px;
    }
    .cover-block-empty {
      padding: 12px;
      border: 1px dashed var(--border);
      border-radius: 12px;
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
      border-radius: 11px;
      border: 1px solid var(--border);
      background: var(--btn-bg);
      padding: 8px 12px;
      box-shadow:
        inset 0 1px 0 var(--bevel-light),
        0 2px 6px rgba(0, 0, 0, 0.18);
      transition: transform 120ms ease, filter 120ms ease;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
      filter: brightness(1.04);
    }

    .btn:active:not(:disabled) {
      transform: translateY(1px);
    }

    .btn.primary {
      background: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      border-color: color-mix(in srgb, var(--accent) 55%, #000);
      font-weight: 700;
    }

    .btn.danger {
      color: #ffffff;
      background: var(--danger);
      border-color: var(--danger);
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
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

    /* Zemismart 4-gang faceplate recreation (labels top / rings bottom, 1×4). */
    .faceplate {
      padding: 14px;
      border-radius: 16px;
      background: var(--faceplate-well);
      box-shadow:
        inset 0 2px 8px rgba(0, 0, 0, 0.28),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
      --conx-faceplate-skin: none; /* future: url(...) photo overlay */
      width: 100%;
      overflow-x: auto;
      padding: 4px 2px 8px;
    }

    .faceplate-bezel {
      position: relative;
      /* Always the 4-gang footprint; unused gangs leave empty slots. */
      min-width: calc(80px * 4);
      width: min(100%, calc(140px * 4));
      margin: 0 auto;
      aspect-ratio: calc(0.64 * 4) / 1;
      border-radius: 18px;
      padding: 5px;
      background:
        linear-gradient(145deg, #f4f6f8 0%, #b7c0c8 38%, #eceff2 62%, #8e99a3 100%);
      box-shadow:
        inset 0 1px 1px #fff,
        inset 0 -1px 2px color-mix(in srgb, #000 35%, transparent),
        0 8px 18px color-mix(in srgb, #0b1218 18%, transparent);
    }

    .faceplate-skin {
      position: absolute;
      inset: 5px;
      border-radius: 14px;
      background-image: var(--conx-faceplate-skin);
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
      border-radius: 14px;
      overflow: hidden;
      display: grid;
      grid-template-rows: 26% 74%;
      background: #fff;
      box-shadow: inset 0 0 0 1px color-mix(in srgb, #000 8%, transparent);
    }

    .faceplate-labels {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      align-items: center;
      background: #0a0a0a;
      color: #f5f5f5;
      padding: 0 4px;
    }

    .faceplate-label {
      text-align: center;
      font-size: clamp(0.62rem, 2.1vw, 0.9rem);
      font-weight: 500;
      letter-spacing: 0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 4px;
    }

    .faceplate-touch {
      display: flex;
      align-items: flex-end;
      justify-content: stretch;
      background:
        linear-gradient(180deg, #ffffff 0%, #f7f8fa 70%, #eef1f4 100%);
      padding: 0 2% 10%;
    }

    .faceplate-rings {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      width: 100%;
      place-items: center;
    }

    .ring {
      width: clamp(18px, 5.2vw, 28px);
      height: clamp(18px, 5.2vw, 28px);
      border-radius: 50%;
      border: 2.5px solid
        color-mix(in srgb, var(--ring-off, var(--conx-ring-off)) 70%, #9aa7b5);
      background: transparent;
      padding: 0;
      cursor: pointer;
      position: relative;
      box-shadow:
        0 0 5px color-mix(in srgb, var(--ring-off, var(--conx-ring-off)) 40%, transparent),
        inset 0 0 0 1px color-mix(in srgb, #fff 40%, transparent);
      transition:
        border-color 160ms ease,
        box-shadow 160ms ease,
        transform 120ms ease;
    }

    .ring.on {
      border-color: var(--ring-on, var(--conx-ring));
      box-shadow:
        0 0 12px color-mix(in srgb, var(--ring-on, var(--conx-ring)) 75%, transparent),
        0 0 4px color-mix(in srgb, var(--ring-on, var(--conx-ring)) 90%, transparent),
        inset 0 0 5px color-mix(in srgb, var(--ring-on, var(--conx-ring)) 45%, transparent);
    }

    .ring.pressed {
      transform: scale(0.9);
    }

    .ring-glow {
      position: absolute;
      inset: 4px;
      border-radius: 50%;
      background: color-mix(
        in srgb,
        var(--ring-off, var(--conx-ring-off)) 14%,
        transparent
      );
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
      margin-bottom: 10px;
    }
    .header-side {
      display: flex;
      align-items: center;
      gap: 10px;
      direction: ltr;
    }
    .menu-btn {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      border: 1px solid var(--btn-border, var(--border));
      background: var(--btn-bg);
      display: inline-grid;
      place-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 10px 9px;
    }
    .menu-btn span {
      display: block;
      width: 18px;
      height: 2px;
      border-radius: 2px;
      background: var(--text);
    }
    .conx-layer {
      position: absolute;
      inset: 0;
      z-index: 20;
      display: grid;
      place-items: center;
      padding: 16px;
      background: rgba(8, 12, 18, 0.55);
      backdrop-filter: blur(2px);
    }
    .conx-panel {
      width: min(100%, 420px);
      max-height: min(86vh, 720px);
      overflow: auto;
      border-radius: 18px;
      border: 1px solid var(--border);
      background: var(--surface-2, var(--surface));
      box-shadow: var(--card-shadow);
      padding: 14px;
    }
    .conx-panel.wide { width: min(100%, 560px); }
    .conx-panel.xwide { width: min(100%, 760px); max-height: min(90vh, 860px); }
    .automation-hint {
      margin: 0 0 12px;
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.5;
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
      background: var(--surface-2);
      overflow: hidden;
      margin-bottom: 10px;
    }
    .hero-preview .section-head {
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
    }
    .hero-profile-name {
      font-family: var(--conx-display);
      font-weight: 700;
      font-size: 1.05rem;
      text-align: center;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .hero-body {
      padding: 16px;
      background: var(--faceplate-well);
    }
    .layout-hint {
      margin: 0 0 10px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .tab-bar {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
      margin-bottom: 10px;
    }
    .tab-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      border-radius: 14px;
      border: 1px solid var(--btn-border, var(--border));
      background: var(--btn-bg);
      color: var(--text-muted);
      padding: 10px 8px;
      cursor: pointer;
      font: inherit;
    }
    .tab-btn.active {
      border-color: var(--accent);
      background: var(--accent-soft);
      color: var(--text);
    }
    .tab-step {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .tab-label {
      font-family: var(--conx-display);
      font-size: 1.02rem;
      font-weight: 600;
    }
    .tab-panel { display: none; padding: 4px 0 8px; }
    .tab-panel.active { display: block; }
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
    .actions-dock { margin-top: 12px; }
    .actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
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
      min-width: 3.4em;
      text-align: end;
      font-variant-numeric: tabular-nums;
    }
    .dimmer-field input[type="range"] {
      width: 100%;
      height: 28px;
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
