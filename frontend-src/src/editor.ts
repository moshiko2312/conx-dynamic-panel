import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { LANGUAGE_OPTIONS, isRtl, localize, normalizeLanguage } from "./localize";
import { THEME_OPTIONS, normalizeTheme } from "./themes";
import type { CardConfig, HomeAssistant } from "./types";

@customElement("conx-dynamic-panel-card-editor")
export class ConXDynamicPanelCardEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config?: CardConfig;

  public setConfig(config: CardConfig): void {
    this._config = config;
  }

  private get _language(): string {
    return (
      this._config?.language ||
      this.hass?.locale?.language ||
      this.hass?.language ||
      "en"
    );
  }

  private _valueChanged(patch: Partial<CardConfig>): void {
    if (!this._config) {
      return;
    }
    const detail = { ...this._config, ...patch };
    this._config = detail;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: detail },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render() {
    if (!this._config) {
      return html``;
    }
    const rtl = isRtl(this._language);
    return html`
      <div class="editor" dir=${rtl ? "rtl" : "ltr"}>
        <label>
          ${localize(this._language, "editor.entry_id")}
          <input
            .value=${this._config.entry_id || ""}
            @input=${(e: Event) =>
              this._valueChanged({
                entry_id: (e.target as HTMLInputElement).value.trim(),
              })}
          />
        </label>
        <label>
          ${localize(this._language, "card.language")}
          <select
            .value=${normalizeLanguage(this._config.language || this._language)}
            @change=${(e: Event) =>
              this._valueChanged({
                language: (e.target as HTMLSelectElement).value,
              })}
          >
            ${LANGUAGE_OPTIONS.map(
              (opt) => html`<option value=${opt.id}>${opt.label}</option>`
            )}
          </select>
        </label>
        <label>
          ${localize(this._language, "card.theme")}
          <select
            .value=${normalizeTheme(this._config.theme)}
            @change=${(e: Event) =>
              this._valueChanged({
                theme: (e.target as HTMLSelectElement).value,
              })}
          >
            ${THEME_OPTIONS.map(
              (opt) => html`<option value=${opt.id}>
                ${localize(this._language, `theme.${opt.id}`)}
              </option>`
            )}
          </select>
        </label>
        <label class="check">
          <input
            type="checkbox"
            .checked=${Boolean(this._config.compact)}
            @change=${(e: Event) =>
              this._valueChanged({
                compact: (e.target as HTMLInputElement).checked,
              })}
          />
          ${localize(this._language, "card.compact")}
        </label>
      </div>
    `;
  }

  static styles = css`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .check {
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }
    input[type="text"],
    input:not([type]),
    select {
      font: inherit;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #ccc);
      background: var(--secondary-background-color, transparent);
      color: inherit;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "conx-dynamic-panel-card-editor": ConXDynamicPanelCardEditor;
  }
}
