import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  cloneProfile,
  createProfile,
  deleteProfile,
  duplicateProfile,
  fetchConfig,
  profilesEqual,
  pullPanel,
  setActiveProfile,
  syncPanel,
  updateProfile,
} from "./api";
import { isRtl, localize } from "./localize";
import type { CardConfig, HomeAssistant, PanelConfig, Profile } from "./types";

const COLOR_PREVIEW: Record<string, string> = {
  red: "#e53935",
  blue: "#1e88e5",
  green: "#43a047",
  white: "#f5f5f5",
  yellow: "#fdd835",
  magenta: "#d81b60",
  cyan: "#00acc1",
  warm_white: "#fff3e0",
  warm_yellow: "#ffb300",
};

@customElement("conx-dynamic-panel-card")
export class ConXDynamicPanelCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config?: CardConfig;
  @state() private _panel?: PanelConfig;
  @state() private _draft?: Profile;
  @state() private _saved?: Profile;
  @state() private _error?: string;
  @state() private _loading = false;
  @state() private _busy = false;

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

  private get _language(): string {
    return this.hass?.locale?.language || this.hass?.language || "en";
  }

  private t(key: string): string {
    return localize(this._language, key);
  }

  private get _dirty(): boolean {
    return !profilesEqual(this._draft || null, this._saved || null);
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

  private async _renameProfile(): Promise<void> {
    if (!this._draft) {
      return;
    }
    const name = window.prompt(this.t("card.rename"), this._draft.name);
    if (!name) {
      return;
    }
    this._draft = { ...this._draft, name };
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

  private _updateDraft(patch: Partial<Profile>): void {
    if (!this._draft) {
      return;
    }
    this._draft = { ...this._draft, ...patch };
  }

  private _updateButton(index: number, patch: Partial<Profile["buttons"][number]>): void {
    if (!this._draft) {
      return;
    }
    const buttons = this._draft.buttons.map((button) =>
      button.index === index ? { ...button, ...patch } : button
    );
    this._draft = { ...this._draft, buttons };
  }

  protected render() {
    const rtl = isRtl(this._language);
    if (!this._config?.entry_id) {
      return html`<ha-card><div class="pad">${this.t("card.missing_entry")}</div></ha-card>`;
    }
    if (this._loading && !this._panel) {
      return html`<ha-card><div class="pad">${this.t("card.loading")}</div></ha-card>`;
    }
    if (!this._panel || !this._draft) {
      return html`<ha-card><div class="pad error">${this._error || this.t("card.loading")}</div></ha-card>`;
    }

    const compact = Boolean(this._config.compact);
    return html`
      <ha-card dir=${rtl ? "rtl" : "ltr"} class=${compact ? "compact" : ""}>
        <div class="header">
          <div>
            <div class="title">${this._panel.panel_name}</div>
            <div class="subtitle">${this._draft.name}</div>
          </div>
          <div class="badge status-${this._panel.sync_status}">
            ${this.t("card.status")}: ${this._panel.sync_status}
          </div>
        </div>

        ${this._dirty
          ? html`<div class="warn">${this.t("card.unsaved")}</div>`
          : nothing}
        ${this._error || this._panel.last_error
          ? html`<div class="error">${this._error || this._panel.last_error}</div>`
          : nothing}

        <div class="layout">
          <section>
            <div class="section-title">${this.t("card.profiles")}</div>
            <div class="profile-list">
              ${Object.values(this._panel.profiles).map(
                (profile) => html`
                  <button
                    class=${profile.id === this._draft?.id ? "active" : ""}
                    ?disabled=${this._busy}
                    @click=${() => this._selectProfile(profile.id)}
                  >
                    ${profile.name}
                  </button>
                `
              )}
            </div>
            <div class="row actions">
              <button ?disabled=${this._busy} @click=${this._createProfile}>
                ${this.t("card.create")}
              </button>
              <button ?disabled=${this._busy} @click=${this._duplicateProfile}>
                ${this.t("card.duplicate")}
              </button>
              <button ?disabled=${this._busy} @click=${this._renameProfile}>
                ${this.t("card.rename")}
              </button>
              <button ?disabled=${this._busy} @click=${this._deleteProfile}>
                ${this.t("card.delete")}
              </button>
            </div>
          </section>

          <section>
            <div class="section-title">${this.t("card.editor")}</div>
            <label>
              ${this.t("card.mode")}
              <select
                .value=${this._draft.mode}
                @change=${(e: Event) =>
                  this._updateDraft({
                    mode: (e.target as HTMLSelectElement).value as Profile["mode"],
                  })}
              >
                ${this._panel.capabilities.modes.map(
                  (mode) =>
                    html`<option value=${mode}>${this.t(`mode.${mode}`)}</option>`
                )}
              </select>
            </label>
            <div class="grid-2">
              <label>
                ${this.t("card.color_on")}
                <select
                  .value=${this._draft.color_on}
                  @change=${(e: Event) =>
                    this._updateDraft({
                      color_on: (e.target as HTMLSelectElement).value,
                    })}
                >
                  ${this._panel.capabilities.colors.map(
                    (color) => html`<option value=${color}>${color}</option>`
                  )}
                </select>
              </label>
              <label>
                ${this.t("card.color_off")}
                <select
                  .value=${this._draft.color_off}
                  @change=${(e: Event) =>
                    this._updateDraft({
                      color_off: (e.target as HTMLSelectElement).value,
                    })}
                >
                  ${this._panel.capabilities.colors.map(
                    (color) => html`<option value=${color}>${color}</option>`
                  )}
                </select>
              </label>
            </div>
            <label>
              ${this.t("card.radar")}
              <select
                .value=${this._draft.radar}
                @change=${(e: Event) =>
                  this._updateDraft({
                    radar: (e.target as HTMLSelectElement).value,
                  })}
              >
                ${this._panel.capabilities.radar.map(
                  (value) => html`<option value=${value}>${value}</option>`
                )}
              </select>
            </label>
            <div class="row">
              <label class="check">
                <input
                  type="checkbox"
                  .checked=${this._draft.backlight}
                  @change=${(e: Event) =>
                    this._updateDraft({
                      backlight: (e.target as HTMLInputElement).checked,
                    })}
                />
                ${this.t("card.backlight")}
              </label>
              <label class="check">
                <input
                  type="checkbox"
                  .checked=${this._draft.child_lock}
                  @change=${(e: Event) =>
                    this._updateDraft({
                      child_lock: (e.target as HTMLInputElement).checked,
                    })}
                />
                ${this.t("card.child_lock")}
              </label>
            </div>

            ${this._draft.buttons.map(
              (button) => html`
                <div class="button-edit">
                  <div class="section-title">
                    ${this.t("card.button")} ${button.index}
                  </div>
                  <label>
                    ${this.t("card.label")}
                    <input
                      .value=${button.name}
                      @input=${(e: Event) =>
                        this._updateButton(button.index, {
                          name: (e.target as HTMLInputElement).value,
                        })}
                    />
                  </label>
                  <label>
                    ${this.t("card.action")}
                    <input
                      .value=${button.action?.action || ""}
                      placeholder="light.toggle"
                      @input=${(e: Event) => {
                        const action = (e.target as HTMLInputElement).value.trim();
                        this._updateButton(button.index, {
                          action: action
                            ? {
                                action,
                                target: button.action?.target || {},
                                data: button.action?.data || {},
                              }
                            : null,
                        });
                      }}
                    />
                  </label>
                  <label>
                    entity_id
                    <input
                      .value=${String(
                        (button.action?.target as { entity_id?: string } | undefined)
                          ?.entity_id || ""
                      )}
                      placeholder="light.living_room"
                      @input=${(e: Event) => {
                        const entityId = (e.target as HTMLInputElement).value.trim();
                        const actionName = button.action?.action || "";
                        this._updateButton(button.index, {
                          action: actionName
                            ? {
                                action: actionName,
                                target: entityId ? { entity_id: entityId } : {},
                                data: button.action?.data || {},
                              }
                            : null,
                        });
                      }}
                    />
                  </label>
                </div>
              `
            )}
          </section>

          <section>
            <div class="section-title">${this.t("card.preview")}</div>
            <div class="preview">
              ${this._draft.buttons.map((button) => {
                const onColor =
                  COLOR_PREVIEW[this._draft!.color_on] || this._draft!.color_on;
                const offColor =
                  COLOR_PREVIEW[this._draft!.color_off] || this._draft!.color_off;
                const selected =
                  this._draft!.mode !== "toggle" &&
                  this._draft!.selected_button === button.index;
                return html`
                  <div
                    class="preview-btn"
                    style="--on:${onColor}; --off:${offColor}; background:${selected
                      ? "var(--on)"
                      : "var(--off)"}"
                  >
                    ${button.name || `L${button.index}`}
                  </div>
                `;
              })}
            </div>
            <div class="row actions">
              <button class="primary" ?disabled=${this._busy || !this._dirty} @click=${this._saveDraft}>
                ${this.t("card.save")}
              </button>
              <button ?disabled=${this._busy || !this._dirty} @click=${this._discard}>
                ${this.t("card.discard")}
              </button>
              <button class="primary" ?disabled=${this._busy} @click=${this._sync}>
                ${this.t("card.sync")}
              </button>
              <button ?disabled=${this._busy} @click=${this._pull}>
                ${this.t("card.pull")}
              </button>
            </div>
          </section>
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      --conx-gap: 12px;
      padding: 16px;
      background: var(--ha-card-background, var(--card-background-color, #fff));
      color: var(--primary-text-color, inherit);
    }
    .header {
      display: flex;
      justify-content: space-between;
      gap: var(--conx-gap);
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .title {
      font-size: 1.25rem;
      font-weight: 700;
    }
    .subtitle {
      opacity: 0.75;
      margin-top: 2px;
    }
    .badge {
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 0.85rem;
      border: 1px solid var(--divider-color, #ccc);
      text-transform: lowercase;
    }
    .status-synced {
      color: var(--success-color, #2e7d32);
    }
    .status-pending,
    .status-out_of_sync {
      color: var(--warning-color, #ed6c02);
    }
    .status-syncing {
      color: var(--primary-color, #03a9f4);
    }
    .status-error {
      color: var(--error-color, #d32f2f);
    }
    .warn,
    .error {
      padding: 8px 10px;
      border-radius: 8px;
      margin-bottom: 10px;
      font-size: 0.9rem;
    }
    .warn {
      background: color-mix(in srgb, var(--warning-color, #ed6c02) 16%, transparent);
    }
    .error {
      background: color-mix(in srgb, var(--error-color, #d32f2f) 16%, transparent);
      color: var(--error-color, #d32f2f);
    }
    .layout {
      display: grid;
      gap: 16px;
    }
    @media (min-width: 860px) {
      .layout {
        grid-template-columns: 0.9fr 1.3fr 0.9fr;
      }
    }
    .compact .layout {
      grid-template-columns: 1fr;
    }
    .section-title {
      font-weight: 600;
      margin-bottom: 8px;
    }
    .profile-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    button,
    select,
    input {
      font: inherit;
      color: inherit;
      background: var(--secondary-background-color, transparent);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 8px;
      padding: 8px 10px;
    }
    button {
      cursor: pointer;
    }
    button.active,
    button.primary {
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
      border-color: transparent;
    }
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }
    .check {
      flex-direction: row;
      align-items: center;
      gap: 8px;
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
    .button-edit {
      border-top: 1px solid var(--divider-color, #ccc);
      padding-top: 10px;
      margin-top: 10px;
    }
    .preview {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .preview-btn {
      min-height: 72px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 8px;
      color: #111;
      font-weight: 600;
      border: 1px solid color-mix(in srgb, #000 20%, transparent);
    }
    .pad {
      padding: 16px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "conx-dynamic-panel-card": ConXDynamicPanelCard;
  }
}
