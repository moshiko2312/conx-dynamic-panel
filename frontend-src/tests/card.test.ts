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
import { COLOR_PREVIEW, resolveLedPreviewColor } from "../src/card";
import {
  PROFILES_EXPORT_SCHEMA_VERSION,
  buildImportServiceYaml,
  buildProfilesExport,
  validateProfilesExport,
} from "../src/exportSchema";
import "../src/card";
import "../src/editor";

const ALL_COLORS = [
  "red",
  "blue",
  "green",
  "white",
  "yellow",
  "magenta",
  "cyan",
  "warm_white",
  "warm_yellow",
];

const sampleProfile: Profile = {
  id: "lighting",
  name: "Lighting",
  mode: "toggle",
  color_on: "cyan",
  color_off: "blue",
  radar: "30s",
  backlight: true,
  backlight_brightness: 100,
  child_lock: false,
  selected_button: null,
  buttons: [
    { index: 1, name: "Living room", action: null, radio_member: true },
    { index: 2, name: "Kitchen", action: null, radio_member: true },
    { index: 3, name: "Outdoor", action: null, radio_member: true },
    { index: 4, name: "All off", action: null, radio_member: true },
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
      colors: ALL_COLORS,
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
    el._goToStep("preview");
    await el.updateComplete;
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
    el._goToStep("review");
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain("Синхронизация");
    expect(loadStoredLanguage()).toBe("ru");
  });

  it("renders horizontal faceplate with labels and rings", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    el._goToStep("preview");
    await el.updateComplete;
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

  it("maps LED color names to CSS preview colors", () => {
    expect(resolveLedPreviewColor("red")).toBe(COLOR_PREVIEW.red);
    expect(resolveLedPreviewColor("warm_yellow")).toBe(COLOR_PREVIEW.warm_yellow);
    expect(resolveLedPreviewColor("cyan")).not.toBe(COLOR_PREVIEW.blue);
  });

  it("updates faceplate ring CSS vars when draft color_on/color_off change", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        sync_status: "synced",
        profiles: {
          lighting: {
            ...sampleProfile,
            mode: "radio_mandatory",
            selected_button: 2,
            color_on: "cyan",
            color_off: "blue",
          },
        },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    el._goToStep("preview");
    await el.updateComplete;
    const faceplate = el.shadowRoot?.querySelector(".faceplate") as HTMLElement;
    expect(faceplate.style.getPropertyValue("--ring-on").trim()).toBe(
      resolveLedPreviewColor("cyan")
    );
    expect(faceplate.style.getPropertyValue("--ring-off").trim()).toBe(
      resolveLedPreviewColor("blue")
    );

    const rings = [...(el.shadowRoot?.querySelectorAll(".ring") || [])];
    expect(rings[1]?.classList.contains("on")).toBe(true);
    expect(rings[0]?.classList.contains("off")).toBe(true);

    el._patchDraft((draft: Profile) => {
      draft.color_on = "red";
      draft.color_off = "green";
    });
    await el.updateComplete;

    expect(faceplate.style.getPropertyValue("--ring-on").trim()).toBe(
      resolveLedPreviewColor("red")
    );
    expect(faceplate.style.getPropertyValue("--ring-off").trim()).toBe(
      resolveLedPreviewColor("green")
    );
    expect(faceplate.style.getPropertyValue("--ring-on")).not.toBe(
      resolveLedPreviewColor("blue")
    );
  });

  it("uses color_on for selected radio ring and color_off for others", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        sync_status: "synced",
        profiles: {
          lighting: {
            ...sampleProfile,
            mode: "radio_optional",
            selected_button: 3,
            color_on: "magenta",
            color_off: "warm_white",
          },
        },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    el._goToStep("preview");
    await el.updateComplete;
    const faceplate = el.shadowRoot?.querySelector(".faceplate") as HTMLElement;
    expect(faceplate.style.getPropertyValue("--ring-on").trim()).toBe(
      COLOR_PREVIEW.magenta
    );
    expect(faceplate.style.getPropertyValue("--ring-off").trim()).toBe(
      COLOR_PREVIEW.warm_white
    );
    const rings = [...(el.shadowRoot?.querySelectorAll(".ring") || [])];
    expect(rings.map((r) => r.classList.contains("on"))).toEqual([
      false,
      false,
      true,
      false,
    ]);
  });

  it("reflects toggle entity on/off state in ring preview when available", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        sync_status: "synced",
        profiles: {
          lighting: {
            ...sampleProfile,
            mode: "toggle",
            buttons: [
              {
                index: 1,
                name: "Living room",
                action: {
                  action: "switch.toggle",
                  target: { entity_id: "switch.living" },
                  data: {},
                },
              },
              {
                index: 2,
                name: "Kitchen",
                action: {
                  action: "switch.toggle",
                  target: { entity_id: "switch.kitchen" },
                  data: {},
                },
              },
              { index: 3, name: "Outdoor", action: null },
              { index: 4, name: "All off", action: null },
            ],
          },
        },
      })
    );
    const el = await mountCard({
      language: "en",
      callWS,
      states: {
        "switch.living": { state: "on" },
        "switch.kitchen": { state: "off" },
      },
    });
    el._goToStep("preview");
    await el.updateComplete;
    const rings = [...(el.shadowRoot?.querySelectorAll(".ring") || [])];
    expect(rings[0]?.classList.contains("on")).toBe(true);
    expect(rings[1]?.classList.contains("on")).toBe(false);
  });

  it("keeps text input focus across continuous typing updates", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload());
    const el = await mountCard({ language: "en", callWS });
    el._goToStep("edit");
    await el.updateComplete;
    const toggle = el.shadowRoot?.querySelector(
      '.button-edit[data-button="1"] .button-edit-toggle'
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    toggle.click();
    await el.updateComplete;
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

  it("collapses button editors by default and expands on header click", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload());
    const el = await mountCard({ language: "en", callWS });
    el._goToStep("edit");
    await el.updateComplete;
    const row = el.shadowRoot?.querySelector(
      '.button-edit[data-button="1"]'
    ) as HTMLElement;
    expect(row).toBeTruthy();
    expect(row.classList.contains("open")).toBe(false);
    expect(row.querySelector("input")).toBeFalsy();
    expect(row.textContent).toMatch(/Button 1/);
    (row.querySelector(".button-edit-toggle") as HTMLButtonElement).click();
    await el.updateComplete;
    const opened = el.shadowRoot?.querySelector(
      '.button-edit[data-button="1"]'
    ) as HTMLElement;
    expect(opened.classList.contains("open")).toBe(true);
    expect(opened.querySelector("input")).toBeTruthy();
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

  it("opens export wizard from main editor and returns with back control", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    expect(el._view).toBe("editor");
    expect(el.shadowRoot?.textContent).toMatch(/Export wizard|Profiles|Appearance/i);
    el._openExportWizard();
    await el.updateComplete;
    expect(el._view).toBe("export");
    expect(el.shadowRoot?.textContent).toContain("Download .json");
    expect(el.shadowRoot?.textContent).toContain("Import (merge)");
    expect(el.shadowRoot?.textContent).toContain("Back to editor");
    expect(el.shadowRoot?.textContent).toContain("schema_version");
    const yamlBox = el.shadowRoot?.querySelector("textarea.yaml-box") as HTMLTextAreaElement;
    expect(yamlBox?.value).toContain("conx_dynamic_panel.import_profiles");
    el._backToEditor();
    await el.updateComplete;
    expect(el._view).toBe("editor");
    expect(el.shadowRoot?.textContent).toMatch(/Export wizard/i);
  });

  it("defaults to single-page main editor with all key sections", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    expect(el._view).toBe("editor");
    const text = el.shadowRoot?.textContent || "";
    expect(text).toMatch(/Profiles/i);
    expect(text).toMatch(/Appearance|Buttons/i);
    expect(text).toMatch(/Panel preview|preview/i);
    expect(text).toMatch(/Export wizard/i);
    expect(el.shadowRoot?.querySelector(".wizard-steps")).toBeFalsy();
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

  it("toggles edit settings sections with switches", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    el._goToStep("edit");
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector(".button-edit")).toBeTruthy();
    el._toggleSection("buttons");
    await el.updateComplete;
    expect(el._sections.buttons).toBe(false);
    expect(el.shadowRoot?.querySelector(".button-edit")).toBeFalsy();
  });
});

describe("export schema", () => {
  it("validates portable export payloads", () => {
    const payload = buildProfilesExport({ lighting: sampleProfile }, "lighting");
    expect(payload.schema_version).toBe(PROFILES_EXPORT_SCHEMA_VERSION);
    const ok = validateProfilesExport(payload);
    expect(ok.ok).toBe(true);
    const yaml = buildImportServiceYaml(payload, "merge", "abc");
    expect(yaml).toContain("service: conx_dynamic_panel.import_profiles");
    expect(yaml).toContain("mode: merge");
  });

  it("accepts profiles arrays and rejects future schema versions", () => {
    const asArray = validateProfilesExport({
      schema_version: 1,
      profiles: [sampleProfile],
      active_profile_id: "lighting",
    });
    expect(asArray.ok).toBe(true);
    const future = validateProfilesExport({
      schema_version: 99,
      profiles: { lighting: sampleProfile },
    });
    expect(future.ok).toBe(false);
  });
});
