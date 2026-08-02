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
  AUTOMATION_EXAMPLE_ENTRY_PLACEHOLDER,
  buildAutomationExampleYaml,
} from "../src/automationExample";
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
  radio_groups: [
    { id: "g1", buttons: [] },
    { id: "g2", buttons: [] },
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
      modes: ["toggle", "radio_mandatory", "radio_optional", "radio_split"],
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
    (el.shadowRoot?.querySelector(".menu-btn") as HTMLButtonElement).click();
    await el.updateComplete;
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

  it("keeps classic radio selection when re-pressing the selected ring", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        sync_status: "synced",
        profiles: {
          lighting: {
            ...sampleProfile,
            mode: "radio_optional",
            selected_button: 2,
          },
        },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    el._onRingPress(2);
    await el.updateComplete;
    expect(el._draft?.selected_button).toBe(2);
    el._onRingPress(4);
    await el.updateComplete;
    expect(el._draft?.selected_button).toBe(4);
  });

  it("shows radio groups editor only in buttons section for radio_split", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        sync_status: "synced",
        profiles: {
          lighting: {
            ...sampleProfile,
            mode: "radio_split",
            radio_groups: [
              { id: "g1", buttons: [1, 4] },
              { id: "g2", buttons: [2, 3] },
            ],
          },
        },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    const groups = el.shadowRoot?.querySelectorAll(".radio-groups-section");
    expect(groups?.length).toBe(1);
    const buttonsHost = el.shadowRoot?.querySelector(
      '.tab-panel[class*="active"]'
    ) || el.shadowRoot?.querySelector(".tab-panel.active");
    // tabs use active class; query section directly
    const section = el.shadowRoot?.querySelector(".radio-groups-section") as HTMLElement;
    expect(section).toBeTruthy();
    // Membership is chip-based: no per-button switches and no per-row collapse switches.
    expect(section.querySelectorAll(".radio-member .switch").length).toBe(0);
    expect(section.querySelectorAll(".radio-group-card .switch").length).toBe(0);
    expect(section.querySelectorAll("button.radio-member").length).toBe(12);
    expect(section.querySelector(".radio-group-card.is-summary")).toBeTruthy();
    expect(section.querySelectorAll(".radio-member.is-independent").length).toBe(4);
    // Exactly one master collapse switch for the whole radio groups block.
    const masterToggles = section.querySelectorAll(
      "input[data-radio-groups-open]"
    );
    expect(masterToggles.length).toBe(1);
    expect(
      section.querySelectorAll(".radio-groups-head input[type=checkbox]").length
    ).toBe(1);

    // Collapsing hides every group row and shows the assignment recap instead.
    const master = masterToggles[0] as HTMLInputElement;
    master.checked = false;
    master.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(el._radioGroupsOpen).toBe(false);
    expect(section.classList.contains("open")).toBe(false);
    expect(section.querySelectorAll(".radio-group-card").length).toBe(0);
    expect(section.querySelectorAll("button.radio-member").length).toBe(0);
    const summary = section.querySelector(".radio-groups-summary");
    expect(summary?.textContent).toContain("Group 1: L1, L4");
    expect(summary?.textContent).toContain("Group 2: L2, L3");

    // Re-expanding restores all three rows of chips.
    master.checked = true;
    master.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(el._radioGroupsOpen).toBe(true);
    expect(section.querySelectorAll(".radio-group-card").length).toBe(3);
    expect(section.querySelectorAll("button.radio-member").length).toBe(12);
  });

  it("assigns and removes buttons by tapping radio group chips", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        profiles: {
          lighting: {
            ...sampleProfile,
            mode: "radio_split",
            radio_groups: [
              { id: "g1", buttons: [1] },
              { id: "g2", buttons: [2] },
            ],
          },
        },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    const chipsIn = (cardIndex: number) =>
      Array.from(
        (el.shadowRoot?.querySelectorAll(".radio-group-card")[
          cardIndex
        ] as HTMLElement).querySelectorAll("button.radio-member")
      ) as HTMLButtonElement[];

    // Tap L3 in group 1 to add it.
    chipsIn(0)[2].click();
    await el.updateComplete;
    expect(el._draft?.radio_groups?.[0].buttons).toEqual([1, 3]);
    expect(chipsIn(0)[2].classList.contains("on")).toBe(true);

    // Tap L2 in group 1: moves it out of group 2, never in both.
    chipsIn(0)[1].click();
    await el.updateComplete;
    expect(el._draft?.radio_groups?.[0].buttons).toEqual([1, 3, 2]);
    expect(el._draft?.radio_groups?.[1].buttons).toEqual([]);

    // Tap L1 again in group 1 to remove it.
    chipsIn(0)[0].click();
    await el.updateComplete;
    expect(el._draft?.radio_groups?.[0].buttons).toEqual([3, 2]);
  });

  it("detaches a button from every group when tapped in the independent section", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        profiles: {
          lighting: {
            ...sampleProfile,
            mode: "radio_split",
            radio_groups: [
              { id: "g1", buttons: [1, 2] },
              { id: "g2", buttons: [3] },
            ],
          },
        },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    const independentChips = () =>
      Array.from(
        (el.shadowRoot?.querySelector(
          ".radio-group-card.is-summary"
        ) as HTMLElement).querySelectorAll("button.radio-member")
      ) as HTMLButtonElement[];

    // L4 is already independent, so its chip is on and inert.
    expect(independentChips()[3].classList.contains("on")).toBe(true);
    expect(independentChips()[3].disabled).toBe(true);

    independentChips()[1].click();
    await el.updateComplete;
    expect(el._draft?.radio_groups?.[0].buttons).toEqual([1]);
    expect(el._draft?.radio_groups?.[1].buttons).toEqual([3]);
    expect(independentChips()[1].classList.contains("on")).toBe(true);
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
    const rings = [...(el.shadowRoot?.querySelectorAll(".ring") || [])];
    expect(rings[0]?.classList.contains("on")).toBe(true);
    expect(rings[1]?.classList.contains("on")).toBe(false);
  });

  it("keeps text input focus across continuous typing updates", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload());
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
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
    el._activeTab = "buttons";
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
    expect(el.shadowRoot?.textContent).toMatch(/Profiles|Appearance/i);
    el._openExportWizard();
    await el.updateComplete;
    expect(el._view).toBe("export");
    expect(el.shadowRoot?.querySelector(".conx-layer")).toBeTruthy();
    expect(el.shadowRoot?.textContent).toContain("Import (merge)");
    expect(el.shadowRoot?.textContent).toContain("Back to editor");
    expect(el.shadowRoot?.textContent).toContain("schema_version");
    const yamlBox = el.shadowRoot?.querySelector("textarea.yaml-box") as HTMLTextAreaElement;
    expect(yamlBox?.value).toContain("conx_dynamic_panel.import_profiles");
    el._backToEditor();
    await el.updateComplete;
    expect(el._view).toBe("editor");
    expect(el.shadowRoot?.querySelector(".tab-bar")).toBeTruthy();
  });

  it("defaults to single-page main editor with all key sections", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    expect(el._view).toBe("editor");
    const text = el.shadowRoot?.textContent || "";
    expect(text).toMatch(/Profiles/i);
    expect(text).toMatch(/Appearance|Buttons/i);
    expect(text).toMatch(/Panel preview|preview/i);
    expect(el.shadowRoot?.querySelector(".tab-bar")).toBeTruthy();
    expect(el.shadowRoot?.querySelector(".menu-btn")).toBeTruthy();
    expect(el.shadowRoot?.querySelector(".hero-preview")).toBeTruthy();
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

  it("switches editor tabs between profiles appearance and buttons", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    expect(el._activeTab).toBe("profiles");
    expect(el.shadowRoot?.querySelector(".profile-list")).toBeTruthy();
    el._activeTab = "appearance";
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector(".dimmer-field")).toBeTruthy();
    el._activeTab = "buttons";
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector(".button-edit")).toBeTruthy();
  });

  it("opens a copyable automation example from the settings menu", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const el = await mountCard({ language: "he", callWS });
    (el.shadowRoot?.querySelector(".menu-btn") as HTMLButtonElement).click();
    await el.updateComplete;
    const menuItem = el.shadowRoot?.querySelector(
      ".automation-menu-btn"
    ) as HTMLButtonElement;
    expect(menuItem.textContent?.trim()).toBe("דוגמה לאוטומציה");

    menuItem.click();
    await el.updateComplete;
    expect(el._menuOpen).toBe(false);
    expect(el._automationOpen).toBe(true);

    const panel = el.shadowRoot?.querySelector(".automation-panel") as HTMLElement;
    expect(panel).toBeTruthy();
    const yaml = (panel.querySelector(".automation-yaml") as HTMLElement).textContent || "";
    expect(yaml).toContain("action: conx_dynamic_panel.activate_profile");
    // Every branch syncs; the Hebrew comment mentions sync: true as well.
    expect(yaml.match(/^ +sync: true$/gm)?.length).toBe(3);
    expect(yaml).toContain("entry_id: abc");
    expect(yaml).toContain("profile_id: lighting");
    expect(yaml).toContain('at: "06:30:00"');
    expect(yaml).toContain('at: "18:00:00"');
    expect(yaml).toContain('at: "23:00:00"');

    const copyBtn = [
      ...(panel.querySelectorAll(".automation-actions .btn") || []),
    ][0] as HTMLButtonElement;
    copyBtn.click();
    await el.updateComplete;
    expect(writeText).toHaveBeenCalledWith(yaml);

    const closeBtn = panel.querySelector(".menu-close") as HTMLButtonElement;
    closeBtn.click();
    await el.updateComplete;
    expect(el._automationOpen).toBe(false);
    expect(el.shadowRoot?.querySelector(".automation-panel")).toBeFalsy();
  });
});

describe("automation example yaml", () => {
  const comments = {
    alias: "ConX Dynamic Panel - profile by time of day",
    header: "header note",
    sync: "sync note",
    ids: "ids note",
    morning: "Morning",
    evening: "Evening",
    night: "Night",
  };

  it("uses placeholders when no entry or profiles are known", () => {
    const yaml = buildAutomationExampleYaml({ comments });
    expect(yaml).toContain(`entry_id: ${AUTOMATION_EXAMPLE_ENTRY_PLACEHOLDER}`);
    expect(yaml).toContain("profile_id: morning");
    expect(yaml).toContain("profile_id: evening");
    expect(yaml).toContain("profile_id: night");
    expect(yaml.startsWith("# header note")).toBe(true);
    expect(yaml).toContain("# sync note");
    expect(yaml).toContain("# ids note");
  });

  it("prefers real ids and always syncs each branch", () => {
    const yaml = buildAutomationExampleYaml({
      comments,
      entryId: "entry123",
      profileIds: ["day", "evening_scene"],
    });
    expect(yaml).toContain("entry_id: entry123");
    expect(yaml).toContain("profile_id: day");
    expect(yaml).toContain("profile_id: evening_scene");
    // Third slot falls back to its placeholder.
    expect(yaml).toContain("profile_id: night");
    expect(yaml.match(/sync: true/g)?.length).toBe(3);
    expect(yaml.match(/- trigger: time/g)?.length).toBe(3);
    expect(yaml).not.toContain("service:");
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
