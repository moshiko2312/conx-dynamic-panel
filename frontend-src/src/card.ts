import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  cloneProfile,
  createProfile,
  deleteProfile,
  downloadJson,
  duplicateProfile,
  exportProfiles,
  fetchConfig,
  importProfiles,
  profilesEqual,
  pullPanel,
  setActiveProfile,
  syncPanel,
  updateProfile,
} from "./api";
import {
  LANGUAGE_OPTIONS,
  type CardLanguage,
  isRtl,
  loadStoredLanguage,
  localize,
  normalizeLanguage,
  persistLanguage,
} from "./localize";
import type { CardConfig, HomeAssistant, PanelConfig, Profile } from "./types";

type SectionId = "profiles" | "appearance" | "buttons" | "preview" | "actions";

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
  @state() private _uiLang?: CardLanguage;
  @state() private _sections: Record<SectionId, boolean> = {
    profiles: true,
    appearance: true,
    buttons: true,
    preview: true,
    actions: true,
  };

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
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (!this._uiLang) {
      this._uiLang = loadStoredLanguage() || undefined;
    }
    this._ensureFonts();
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

  private _toggleSection(id: SectionId): void {
    this._sections = { ...this._sections, [id]: !this._sections[id] };
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
    const activeId = panel.active_profile_id;
    const profile = activeId ? panel.profiles[activeId] : undefined;
    this._saved = profile ? cloneProfile(profile) : undefined;
    this._draft = profile ? cloneProfile(profile) : undefined;
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
      child_lock: false,
      selected_button: null,
      buttons: [1, 2, 3, 4].map((index) => ({
        index,
        name: `Button ${index}`,
        action: null,
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
      this._notice = this.t("card.export_ok");
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._busy = false;
    }
  }

  private _openImport(mode: "merge" | "replace"): void {
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
        void this._importFile(file, mode);
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
      const payload = JSON.parse(text) as {
        profiles?: Record<string, Profile>;
        active_profile_id?: string | null;
        schema_version?: number;
      };
      if (!payload?.profiles || typeof payload.profiles !== "object") {
        throw new Error(this.t("card.import_invalid"));
      }
      const panel = await importProfiles(
        this.hass,
        this._config.entry_id,
        {
          schema_version: payload.schema_version || 1,
          active_profile_id: payload.active_profile_id ?? null,
          profiles: payload.profiles,
        },
        mode
      );
      this._applyPanel(panel);
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
    if (this._draft.mode !== "toggle") {
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
    this._patchDraft((draft) => {
      if (draft.mode === "radio_optional" && draft.selected_button === buttonIndex) {
        draft.selected_button = null;
      } else {
        draft.selected_button = buttonIndex;
      }
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
        white glass touch face, 4 LED rings L→R. Rings use profile
        color_on / color_off. Extension point for a future photo skin:
        set --conx-faceplate-skin on .faceplate.
      -->
      <div
        class="faceplate"
        style="--ring-on:${ringOn};--ring-off:${ringOff}"
        role="img"
        aria-label=${this.t("card.preview")}
      >
        <div class="faceplate-bezel">
          <div class="faceplate-skin"></div>
          <div class="faceplate-glass">
            <div class="faceplate-labels">
              ${this._draft.buttons.map(
                (button) => html`
                  <div class="faceplate-label">
                    ${button.name || `L${button.index}`}
                  </div>
                `
              )}
            </div>
            <div class="faceplate-touch">
              <div class="faceplate-rings">
                ${this._draft.buttons.map((button) => {
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
        class="conx-card ${compact ? "compact" : ""} ${this._syncPulse ? "syncing-pulse" : ""}"
      >
        <div class="atmosphere"></div>
        <div class="header">
          <div class="brand-block">
            <div class="brand">ConX</div>
            <div class="title">${this._panel.panel_name}</div>
            <div class="subtitle">${this._draft.name}</div>
          </div>
          <div class="header-side">
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
            <div class="badge status-${this._panel.sync_status}">
              ${this.t("card.status")}: ${this._panel.sync_status}
            </div>
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

        <div class="layout">
          ${this._renderSection(
            "profiles",
            this.t("card.profiles"),
            html`
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
              <label class="field">
                <span>${this.t("card.profile_name")}</span>
                <input
                  type="text"
                  .value=${this._draft.name}
                  ?disabled=${this._busy}
                  @input=${this._onProfileNameInput}
                />
              </label>
              <div class="row actions">
                <button type="button" class="btn" ?disabled=${this._busy} @click=${this._createProfile}>
                  ${this.t("card.create")}
                </button>
                <button type="button" class="btn" ?disabled=${this._busy} @click=${this._duplicateProfile}>
                  ${this.t("card.duplicate")}
                </button>
                <button type="button" class="btn" ?disabled=${this._busy} @click=${this._renameProfile}>
                  ${this.t("card.rename")}
                </button>
                <button type="button" class="btn danger" ?disabled=${this._busy} @click=${this._deleteProfile}>
                  ${this.t("card.delete")}
                </button>
              </div>
              <div class="row actions">
                <button type="button" class="btn" ?disabled=${this._busy} @click=${this._export}>
                  ${this.t("card.export")}
                </button>
                <button
                  type="button"
                  class="btn"
                  ?disabled=${this._busy}
                  @click=${() => this._openImport("merge")}
                >
                  ${this.t("card.import_merge")}
                </button>
                <button
                  type="button"
                  class="btn danger"
                  ?disabled=${this._busy}
                  @click=${() => this._openImport("replace")}
                >
                  ${this.t("card.import_replace")}
                </button>
              </div>
            `
          )}

          ${this._renderSection(
            "appearance",
            this.t("card.editor"),
            html`
              <label class="field">
                <span>${this.t("card.mode")}</span>
                <div class="select-wrap">
                  <select
                    .value=${this._draft.mode}
                    ?disabled=${this._busy}
                    @change=${(e: Event) =>
                      this._patchDraft((draft) => {
                        draft.mode = (e.target as HTMLSelectElement)
                          .value as Profile["mode"];
                      })}
                  >
                    ${this._panel.capabilities.modes.map(
                      (mode) =>
                        html`<option value=${mode}>${this.t(`mode.${mode}`)}</option>`
                    )}
                  </select>
                </div>
              </label>
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
            `
          )}

          ${this._renderSection(
            "buttons",
            this.t("card.buttons"),
            html`
              ${this._draft.buttons.map(
                (button) => html`
                  <div class="button-edit" data-button=${button.index}>
                    <div class="button-edit-title">
                      ${this.t("card.button")} ${button.index}
                    </div>
                    <label class="field">
                      <span>${this.t("card.label")}</span>
                      <input
                        type="text"
                        .value=${button.name}
                        ?disabled=${this._busy}
                        @input=${(e: Event) => this._onButtonNameInput(button.index, e)}
                      />
                    </label>
                    <label class="field">
                      <span>${this.t("card.action")}</span>
                      <input
                        type="text"
                        .value=${button.action?.action || ""}
                        placeholder="light.toggle"
                        ?disabled=${this._busy}
                        @input=${(e: Event) => this._onButtonActionInput(button.index, e)}
                      />
                    </label>
                    <label class="field">
                      <span>${this.t("card.entity_id")}</span>
                      <input
                        type="text"
                        .value=${String(
                          (
                            button.action?.target as
                              | { entity_id?: string }
                              | undefined
                          )?.entity_id || ""
                        )}
                        placeholder="light.living_room"
                        ?disabled=${this._busy}
                        @input=${(e: Event) => this._onButtonEntityInput(button.index, e)}
                      />
                    </label>
                  </div>
                `
              )}
            `
          )}

          ${this._renderSection(
            "preview",
            this.t("card.preview"),
            html`${this._renderFaceplate()}`
          )}

          ${this._renderSection(
            "actions",
            this.t("card.actions"),
            html`
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
            `
          )}
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
      --conx-font: "Outfit", "Sora", ui-sans-serif, sans-serif;
      --conx-display: "Sora", "Outfit", ui-sans-serif, sans-serif;
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
      color: var(--primary-text-color, var(--conx-ink));
      background:
        linear-gradient(
          155deg,
          color-mix(in srgb, var(--ha-card-background, #fff) 88%, #d7dee6) 0%,
          var(--ha-card-background, var(--card-background-color, #f7f9fb)) 48%,
          color-mix(in srgb, var(--ha-card-background, #fff) 90%, #c5d0da) 100%
        );
      border: 1px solid color-mix(in srgb, var(--conx-steel) 35%, transparent);
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        inset 0 -1px 0 var(--conx-bevel-dark),
        0 10px 28px color-mix(in srgb, #0b1218 14%, transparent);
      padding: 18px;
    }

    .atmosphere {
      pointer-events: none;
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 12% 0%, color-mix(in srgb, #9eb6c8 28%, transparent), transparent 42%),
        radial-gradient(circle at 88% 100%, color-mix(in srgb, #1f7a8c 12%, transparent), transparent 40%),
        repeating-linear-gradient(
          -18deg,
          transparent,
          transparent 10px,
          color-mix(in srgb, #0b1218 2.5%, transparent) 10px,
          color-mix(in srgb, #0b1218 2.5%, transparent) 11px
        );
      opacity: 0.55;
    }

    .header,
    .warn,
    .error,
    .notice,
    .layout {
      position: relative;
      z-index: 1;
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
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, #fff 55%, transparent),
          color-mix(in srgb, var(--secondary-background-color, #e8eef3) 55%, transparent)
        );
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

    .switch {
      position: relative;
      display: inline-block;
      width: 42px;
      height: 24px;
      flex-shrink: 0;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      inset: 0;
      cursor: pointer;
      border-radius: 999px;
      background: color-mix(in srgb, var(--conx-steel) 45%, #d5dde5);
      box-shadow: inset 0 1px 2px color-mix(in srgb, #0b1218 25%, transparent);
      transition: background 180ms ease;
    }

    .slider::before {
      content: "";
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      top: 3px;
      border-radius: 50%;
      background: linear-gradient(180deg, #fff, #dce3ea);
      box-shadow: 0 1px 3px color-mix(in srgb, #0b1218 30%, transparent);
      transition: transform 180ms ease;
    }

    .switch input:checked + .slider {
      background: color-mix(in srgb, var(--conx-accent) 75%, #89b4c0);
    }

    .switch input:checked + .slider::before {
      transform: translateX(18px);
    }

    :host([dir="rtl"]) .switch input:checked + .slider::before,
    ha-card[dir="rtl"] .switch input:checked + .slider::before {
      transform: translateX(-18px);
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
    select {
      font: inherit;
      color: inherit;
      background:
        linear-gradient(180deg, color-mix(in srgb, #fff 80%, transparent), color-mix(in srgb, #e4ebf1 55%, transparent));
      border: 1px solid color-mix(in srgb, var(--conx-steel) 40%, transparent);
      border-radius: 11px;
      padding: 9px 11px;
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        inset 0 -1px 0 color-mix(in srgb, #0b1218 6%, transparent);
    }

    input[type="text"]:focus,
    select:focus {
      outline: none;
      border-color: color-mix(in srgb, var(--conx-accent) 55%, transparent);
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        0 0 0 2px var(--conx-accent-soft);
    }

    .select-wrap {
      position: relative;
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
      border: 1px solid color-mix(in srgb, var(--conx-steel) 28%, transparent);
      background: color-mix(in srgb, #fff 40%, transparent);
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
      color: inherit;
      cursor: pointer;
      border-radius: 11px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 40%, transparent);
      background:
        linear-gradient(180deg, color-mix(in srgb, #fff 75%, transparent), color-mix(in srgb, #cfd8e1 50%, transparent));
      padding: 8px 12px;
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        0 2px 6px color-mix(in srgb, #0b1218 10%, transparent);
      transition: transform 120ms ease, filter 120ms ease;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .btn:active:not(:disabled) {
      transform: translateY(1px);
    }

    .btn.primary {
      background: linear-gradient(180deg, #2a93a8, var(--conx-accent));
      color: #fff;
      border-color: color-mix(in srgb, var(--conx-accent) 70%, #0b1218);
    }

    .btn.danger {
      color: var(--conx-danger);
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
    }

    .button-edit {
      border-top: 1px solid color-mix(in srgb, var(--conx-steel) 26%, transparent);
      padding-top: 10px;
      margin-top: 10px;
    }

    .button-edit:first-child {
      border-top: 0;
      padding-top: 0;
      margin-top: 0;
    }

    .button-edit-title {
      font-weight: 600;
      margin-bottom: 8px;
    }

    /* Zemismart 4-gang faceplate recreation (labels top / rings bottom, 1×4). */
    .faceplate {
      --conx-faceplate-skin: none; /* future: url(...) photo overlay */
      width: 100%;
      overflow-x: auto;
      padding: 4px 2px 8px;
    }

    .faceplate-bezel {
      position: relative;
      min-width: 320px;
      width: min(100%, 560px);
      margin: 0 auto;
      aspect-ratio: 2.55 / 1;
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "conx-dynamic-panel-card": ConXDynamicPanelCard;
  }
}
