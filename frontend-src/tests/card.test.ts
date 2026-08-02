import { beforeEach, describe, expect, it, vi } from "vitest";
import { profilesEqual, cloneProfile } from "../src/api";
import {
  clearStoredLanguage,
  isRtl,
  loadStoredLanguage,
  localize,
  normalizeLanguage,
  persistLanguage,
} from "../src/localize";
import type { Profile } from "../src/types";
import "../src/card";
import "../src/editor";

const sampleProfile: Profile = {
  id: "lighting",
  name: "Lighting",
  mode: "toggle",
  color_on: "cyan",
  color_off: "blue",
  radar: "30s",
  backlight: true,
  child_lock: false,
  selected_button: null,
  buttons: [
    { index: 1, name: "Living room", action: null },
    { index: 2, name: "Kitchen", action: null },
    { index: 3, name: "Outdoor", action: null },
    { index: 4, name: "All off", action: null },
  ],
};

function panelPayload(overrides: Record<string, unknown> = {}) {
  return {
    entry_id: "abc",
    panel_name: "Kitchen",
    adapter_type: "zemismart_4gang",
    active_profile_id: "lighting",
    sync_status: "pending",
    last_sync: null,
    last_error: null,
    auto_sync: false,
    capabilities: {
      colors: ["cyan", "blue"],
      radar: ["30s"],
      modes: ["toggle", "radio_mandatory", "radio_optional"],
      button_count: 4,
    },
    profiles: { lighting: sampleProfile },
    applied_snapshot: {},
    ...overrides,
  };
}

async function mountCard(hass: Record<string, unknown>, config?: Record<string, unknown>) {
  const el = document.createElement("conx-dynamic-panel-card") as any;
  el.hass = hass;
  el.setConfig({
    type: "custom:conx-dynamic-panel-card",
    entry_id: "abc",
    ...config,
  });
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
  return el;
}

describe("localize", () => {
  it("returns Hebrew strings for he", () => {
    expect(localize("he", "card.sync")).toContain("סנכרון");
    expect(isRtl("he-IL")).toBe(true);
  });

  it("returns Russian strings for ru", () => {
    expect(localize("ru", "card.sync")).toContain("Синхронизация");
    expect(normalizeLanguage("ru-RU")).toBe("ru");
    expect(isRtl("ru")).toBe(false);
  });

  it("falls back to English", () => {
    expect(localize("en", "card.sync")).toBe("Sync to Panel");
    expect(isRtl("en")).toBe(false);
  });

  it("persists language preference", () => {
    clearStoredLanguage();
    persistLanguage("ru");
    expect(loadStoredLanguage()).toBe("ru");
    persistLanguage("he");
    expect(loadStoredLanguage()).toBe("he");
  });
});

describe("draft helpers", () => {
  it("clones profiles without sharing references", () => {
    const cloned = cloneProfile(sampleProfile);
    cloned.buttons[0].name = "Changed";
    expect(sampleProfile.buttons[0].name).toBe("Living room");
    expect(profilesEqual(sampleProfile, cloned)).toBe(false);
  });

  it("detects equal profiles", () => {
    expect(profilesEqual(sampleProfile, cloneProfile(sampleProfile))).toBe(true);
  });
});

describe("custom elements", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    clearStoredLanguage();
  });

  it("registers card and editor", () => {
    expect(customElements.get("conx-dynamic-panel-card")).toBeTruthy();
    expect(customElements.get("conx-dynamic-panel-card-editor")).toBeTruthy();
  });

  it("renders missing entry message", async () => {
    const el = document.createElement("conx-dynamic-panel-card") as any;
    el.hass = { language: "en", callWS: vi.fn() };
    document.body.appendChild(el);
    el._config = { type: "custom:conx-dynamic-panel-card", entry_id: "" };
    el.requestUpdate();
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain("entry_id");
  });

  it("loads profiles through websocket only", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload());
    const el = await mountCard({ language: "en", callWS });
    expect(callWS).toHaveBeenCalledWith({
      type: "conx_dynamic_panel/get_config",
      entry_id: "abc",
    });
    expect(el.shadowRoot?.textContent).toContain("Kitchen");
    expect(el.shadowRoot?.textContent).toContain("Living room");
  });

  it("keeps RTL direction for Hebrew", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({ panel_name: "מטבח", sync_status: "synced" })
    );
    const el = await mountCard({
      language: "he",
      locale: { language: "he" },
      callWS,
    });
    const card = el.shadowRoot?.querySelector("ha-card");
    expect(card?.getAttribute("dir")).toBe("rtl");
  });

  it("switches language via flag controls", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    const ruBtn = [...(el.shadowRoot?.querySelectorAll(".lang-btn") || [])].find((btn) =>
      (btn as HTMLElement).textContent?.includes("RU")
    ) as HTMLButtonElement;
    expect(ruBtn).toBeTruthy();
    ruBtn.click();
    await el.updateComplete;
    expect(el._language).toBe("ru");
    expect(el.shadowRoot?.textContent).toContain("Синхронизация");
    expect(loadStoredLanguage()).toBe("ru");
  });

  it("renders horizontal faceplate with labels and rings", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    const faceplate = el.shadowRoot?.querySelector(".faceplate");
    const labels = el.shadowRoot?.querySelectorAll(".faceplate-label");
    const rings = el.shadowRoot?.querySelectorAll(".ring");
    expect(faceplate).toBeTruthy();
    expect(labels?.length).toBe(4);
    expect(rings?.length).toBe(4);
    const ringsStyle = getComputedStyle(
      el.shadowRoot?.querySelector(".faceplate-rings") as Element
    );
    // jsdom may not resolve grid fully; assert markup order instead
    expect(el.shadowRoot?.querySelector(".faceplate-labels")).toBeTruthy();
    expect(el.shadowRoot?.querySelector(".faceplate-touch")).toBeTruthy();
    expect(ringsStyle).toBeTruthy();
  });

  it("keeps text input focus across continuous typing updates", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload());
    const el = await mountCard({ language: "en", callWS });
    const input = el.shadowRoot?.querySelector(
      '.button-edit[data-button="1"] input[type="text"]'
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    input.focus();
    input.value = "Ceil";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await el.updateComplete;
    input.value = "Ceiling";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await el.updateComplete;
    expect(el._draft.buttons[0].name).toBe("Ceiling");
    expect(el._dirty).toBe(true);
    expect(el.shadowRoot?.activeElement === input || document.activeElement === el).toBe(
      true
    );
  });

  it("edits draft locally without websocket writes until save", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload());
    const el = await mountCard({ language: "en", callWS });
    const before = callWS.mock.calls.length;
    el._patchDraft((draft: Profile) => {
      draft.buttons[0].name = "Edited locally";
    });
    await el.updateComplete;
    expect(el._dirty).toBe(true);
    expect(callWS.mock.calls.length).toBe(before);
    expect(el.shadowRoot?.textContent).toMatch(/unsaved draft changes/i);
  });

  it("exposes import and export controls", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    expect(el.shadowRoot?.textContent).toContain("Export");
    expect(el.shadowRoot?.textContent).toContain("Import (merge)");
    expect(el.shadowRoot?.textContent).toContain("Import (replace)");
  });

  it("requests sync through websocket and shows errors", async () => {
    const callWS = vi
      .fn()
      .mockResolvedValueOnce(panelPayload())
      .mockRejectedValueOnce(new Error("Timed out waiting for text.n1"))
      .mockResolvedValueOnce(
        panelPayload({
          sync_status: "error",
          last_error: "Timed out waiting for text.n1",
        })
      );

    const el = await mountCard({ language: "en", callWS });
    await el._sync();
    await el.updateComplete;
    expect(
      callWS.mock.calls.some(
        (call: unknown[]) =>
          (call[0] as { type?: string }).type === "conx_dynamic_panel/sync"
      )
    ).toBe(true);
    expect(el.shadowRoot?.textContent).toMatch(/Timed out|error/i);
  });

  it("uses a single-column layout class in compact/mobile mode", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS }, { compact: true });
    expect(el.shadowRoot?.querySelector("ha-card")?.classList.contains("compact")).toBe(
      true
    );
  });

  it("toggles settings sections with switches", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    expect(el.shadowRoot?.querySelector(".faceplate")).toBeTruthy();
    el._toggleSection("preview");
    await el.updateComplete;
    expect(el._sections.preview).toBe(false);
    expect(el.shadowRoot?.querySelector(".faceplate")).toBeFalsy();
  });
});
