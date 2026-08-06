import { beforeEach, describe, expect, it, vi } from "vitest";
import { profilesEqual, cloneProfile, normalizeCover } from "../src/api";
import {
  clearStoredLanguage,
  isRtl,
  loadStoredLanguage,
  localize,
  normalizeLanguage,
  persistLanguage,
} from "../src/localize";
import {
  clearStoredOperateMode,
  loadStoredOperateMode,
  persistOperateMode,
} from "../src/operateMode";
import type { Profile } from "../src/types";
import { COLOR_PREVIEW, ensureColorSelectOptions, ensureSelectOptions, filterUiColorOptions, formatColorOptionLabel, formatRadarOptionLabel, isBrokenWarmLedColor, remapBrokenWarmLedColor, resolveLedPreviewColor } from "../src/card";
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
import {
  actionDomain,
  listEntityIds,
  listServiceActions,
  withCurrentOption,
} from "../src/haPickers";
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
    {
      index: 1,
      name: "Living room",
      action: null,
      radio_member: true,
      role: "toggle",
      pulse_time_s: 2,
      cover_id: null,
    },
    {
      index: 2,
      name: "Kitchen",
      action: null,
      radio_member: true,
      role: "toggle",
      pulse_time_s: 2,
      cover_id: null,
    },
    {
      index: 3,
      name: "Outdoor",
      action: null,
      radio_member: true,
      role: "toggle",
      pulse_time_s: 2,
      cover_id: null,
    },
    {
      index: 4,
      name: "All off",
      action: null,
      radio_member: true,
      role: "toggle",
      pulse_time_s: 2,
      cover_id: null,
    },
  ],
  radio_groups: [
    { id: "g1", buttons: [] },
    { id: "g2", buttons: [] },
  ],
  gang_count: 4,
  covers: [
    {
      id: "cover_1",
      open_button: 1,
      close_button: 2,
      open_time_s: 20,
      close_time_s: 20,
      direction_settle_s: 0.5,
      opposite_press: "stop_only",
    },
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
      modes: [
        "toggle",
        "radio_mandatory",
        "radio_optional",
        "radio_split",
        "mixed",
        "cover",
      ],
      button_count: 4,
      cover: {
        min_time_s: 1,
        max_time_s: 600,
        min_settle_s: 0,
        max_settle_s: 5,
        opposite_press: ["stop_only", "stop_then_reverse"],
      },
      mixed: {
        roles: ["toggle", "momentary", "radio", "cover_open", "cover_close"],
        min_pulse_s: 0.1,
        max_pulse_s: 600,
        default_pulse_s: 2,
      },
    },
    profiles: { lighting: sampleProfile },
    applied_snapshot: {},
    relay_entities: ["switch.l1", "switch.l2", "switch.l3", "switch.l4"],
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

  it("localizes operate mode labels in EN HE RU", () => {
    expect(localize("en", "card.operate")).toBe("Operate");
    expect(localize("en", "card.operate_exit")).toBe("Settings");
    expect(localize("he", "card.operate")).toBe("תפעול");
    expect(localize("he", "card.operate_exit")).toBe("הגדרות");
    expect(localize("ru", "card.operate")).toBe("Управление");
    expect(localize("ru", "card.operate_exit")).toBe("Настройки");
  });

  it("persists operate mode preference", () => {
    clearStoredOperateMode();
    expect(loadStoredOperateMode()).toBe(false);
    persistOperateMode(true);
    expect(loadStoredOperateMode()).toBe(true);
    persistOperateMode(false);
    expect(loadStoredOperateMode()).toBe(false);
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
    clearStoredOperateMode();
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

  it("matches HTML preview chrome: brand title, fonts, settings tabs, bezel metrics", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({ panel_name: "Living Room Panel", sync_status: "synced" })
    );
    const el = await mountCard({ language: "en", callWS });
    const brand = el.shadowRoot?.querySelector(".panel-title .brand");
    const title = el.shadowRoot?.querySelector(".panel-title .title");
    expect(brand?.textContent?.trim()).toBe("ConX");
    expect(title?.textContent?.trim()).toBe("Living Room Panel");
    expect(el.shadowRoot?.querySelector(".settings-tabs")).toBeTruthy();
    expect(el.shadowRoot?.querySelector(".tab-bar")?.parentElement?.classList.contains("settings-tabs")).toBe(
      true
    );
    expect(el.shadowRoot?.querySelector(".hero-profile-name")).toBeTruthy();

    const Card = customElements.get("conx-dynamic-panel-card") as unknown as {
      styles: { cssText: string } | Array<{ cssText: string }>;
    };
    const cssText = Array.isArray(Card.styles)
      ? Card.styles.map((part) => part.cssText).join("\n")
      : Card.styles.cssText;
    expect(cssText).toContain('font-family: var(--conx-font)');
    expect(cssText).toContain("linear-gradient(145deg, #f2f0ea 0%, #b8b0a4 36%");
    expect(cssText).toContain("border-radius: 999px");

    const fontLink = document.getElementById("conx-dynamic-panel-fonts") as HTMLLinkElement | null;
    expect(fontLink?.href).toContain("Manrope");
    expect(fontLink?.href).toContain("Cormorant");
    expect(fontLink?.href).not.toContain("Outfit");
  });

  it("shows the gang picker on the Profiles tab with profile chips", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "he", callWS });
    expect(el._activeTab).toBe("profiles");
    const profilesPanel = el.shadowRoot?.querySelector(
      ".tab-panel.active"
    ) as HTMLElement;
    expect(profilesPanel?.querySelector(".profile-chip")).toBeTruthy();
    const gangHost = profilesPanel?.querySelector(
      "[data-profiles-gang]"
    ) as HTMLElement;
    expect(gangHost).toBeTruthy();
    expect(gangHost.querySelector("[data-gang-picker]")).toBeTruthy();
    expect(profilesPanel?.textContent).toContain("מספר גאנגים");
    // Appearance must not own the primary gang picker.
    el._activeTab = "appearance";
    await el.updateComplete;
    const appearancePanel = el.shadowRoot?.querySelector(
      ".tab-panel.active"
    ) as HTMLElement;
    expect(appearancePanel?.querySelector("[data-gang-picker]")).toBeFalsy();
  });

  it("adapts faceplate labels and rings to gang_count", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        sync_status: "synced",
        profiles: {
          lighting: { ...sampleProfile, gang_count: 2 },
        },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    const faceplate = el.shadowRoot?.querySelector(".faceplate") as HTMLElement;
    expect(faceplate.style.getPropertyValue("--conx-gang-count").trim()).toBe("2");
    expect(el.shadowRoot?.querySelectorAll(".faceplate-label").length).toBe(2);
    expect(el.shadowRoot?.querySelectorAll(".ring").length).toBe(2);
    expect(
      [...(el.shadowRoot?.querySelectorAll(".faceplate-label") || [])].map(
        (node) => node.textContent?.trim()
      )
    ).toEqual(["Living room", "Kitchen"]);
    // Faceplate fills card width with 4-gang landscape proportions; columns follow --conx-gang-count.
    const Card = customElements.get("conx-dynamic-panel-card") as unknown as {
      styles: { cssText: string } | Array<{ cssText: string }>;
    };
    const cssText = Array.isArray(Card.styles)
      ? Card.styles.map((part) => part.cssText).join("\n")
      : Card.styles.cssText;
    expect(cssText).toContain("aspect-ratio: calc(0.66 * 4) / 1");
    expect(cssText).toContain("width: clamp(26px, 12.5cqw, 56px)");
    expect(cssText).toContain("container-type: inline-size");
    expect(cssText).toContain(
      "grid-template-columns: repeat(var(--conx-gang-count, 4), 1fr);"
    );
    // Rings sit in the light body with a clear gap under the label bar (no overlap).
    expect(cssText).toMatch(
      /\.faceplate-glass\s*\{[^}]*grid-template-rows:\s*28%\s+72%/s
    );
    expect(cssText).toMatch(
      /\.faceplate-touch\s*\{[^}]*align-items:\s*center[^}]*padding:\s*10%\s+3%\s+14%/s
    );
    expect(cssText).toMatch(/\.faceplate-touch\s*\{[^}]*overflow:\s*hidden/s);
    expect(cssText).toContain(".settings-tabs");
    expect(cssText).toContain("border-bottom: 2px solid transparent");
    expect(cssText).not.toContain("min-width: calc(100px * 4)");
    expect(cssText).not.toContain("width: min(100%, calc(230px * 4))");
    expect(cssText).not.toContain(
      "min-width: calc(100px * var(--conx-gang-count"
    );
    expect(cssText).not.toContain(
      ".faceplate-labels {\n      display: grid;\n      grid-template-columns: repeat(4, 1fr);"
    );

    const profilesPanel = el.shadowRoot?.querySelector(
      "[data-profiles-gang]"
    ) as HTMLElement;
    const pick3 = profilesPanel.querySelector(
      '[data-gang-picker] button.radio-member:nth-child(3)'
    ) as HTMLButtonElement;
    pick3.click();
    await el.updateComplete;
    expect(el._draft?.gang_count).toBe(3);
    expect(el.shadowRoot?.querySelectorAll(".faceplate-label").length).toBe(3);
    expect(el.shadowRoot?.querySelectorAll(".ring").length).toBe(3);
    expect(
      [...(el.shadowRoot?.querySelectorAll(".faceplate-label") || [])].map(
        (node) => node.textContent?.trim()
      )
    ).toEqual(["Living room", "Kitchen", "Outdoor"]);
  });

  it("maps LED color names to CSS preview colors", () => {
    expect(resolveLedPreviewColor("red")).toBe(COLOR_PREVIEW.red);
    expect(resolveLedPreviewColor("warm_yellow")).toBe(COLOR_PREVIEW.yellow);
    // Hardware: Z2M "blue" is cyan-looking; still distinct from the cyan option.
    expect(resolveLedPreviewColor("blue")).toBe("#00c8de");
    expect(resolveLedPreviewColor("cyan")).toBe("#00e5ff");
    expect(resolveLedPreviewColor("cyan")).not.toBe(COLOR_PREVIEW.blue);
  });

  it("labels blue as cyan-looking for display without changing wire value", () => {
    expect(formatColorOptionLabel("blue", "en")).toContain("cyan");
    expect(formatColorOptionLabel("blue", "he")).toContain("סיאן");
    expect(formatColorOptionLabel("cyan", "he")).toBe("סיאן");
    expect(formatRadarOptionLabel("none", "he")).toContain("ללא");
  });

  it("filters broken warm LED colors from picker options", () => {
    expect(
      filterUiColorOptions([
        "red",
        "warm_white",
        "white",
        "warm_yellow",
        "yellow",
      ])
    ).toEqual(["red", "white", "yellow"]);
    expect(remapBrokenWarmLedColor("warm_white")).toBe("white");
    expect(remapBrokenWarmLedColor("warm_yellow")).toBe("yellow");
    expect(isBrokenWarmLedColor("warmwhite")).toBe(true);
    expect(ensureColorSelectOptions(["blue", "cyan", "warm_white"], "warm_yellow")).toEqual([
      "blue",
      "cyan",
      "yellow",
    ]);
    expect(ensureColorSelectOptions(["blue", "cyan"], "warm_white", "blue")).toEqual([
      "blue",
      "cyan",
      "white",
    ]);
  });

  it("keeps draft select values when live options omit them", () => {
    expect(ensureSelectOptions(["blue", "cyan"], "warm_white", "blue")).toEqual([
      "blue",
      "cyan",
      "warm_white",
    ]);
    expect(ensureSelectOptions(["10s", "30s"], "none")).toEqual([
      "10s",
      "30s",
      "none",
    ]);
  });

  it("renders live color and radar options including none", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        capabilities: {
          colors: [
            "red",
            "blue",
            "green",
            "white",
            "yellow",
            "magenta",
            "cyan",
            "warm_white",
            "warm_yellow",
          ],
          radar: ["none", "10s", "20s", "30s", "45s", "60s"],
          modes: [
            "toggle",
            "radio_mandatory",
            "radio_optional",
            "radio_split",
            "mixed",
            "cover",
          ],
          button_count: 4,
          gang_count_min: 1,
          gang_count_max: 4,
          cover: {
            min_time_s: 1,
            max_time_s: 600,
            min_settle_s: 0,
            max_settle_s: 5,
            opposite_press: ["stop_only", "stop_then_reverse"],
            max_covers: 2,
          },
          mixed: {
            roles: ["toggle", "momentary", "radio", "cover_open", "cover_close"],
            min_pulse_s: 0.1,
            max_pulse_s: 600,
            default_pulse_s: 2,
          },
        },
        profiles: {
          lighting: {
            ...sampleProfile,
            color_on: "cyan",
            color_off: "blue",
            radar: "none",
          },
        },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    (el as any)._activeTab = "appearance";
    await el.updateComplete;
    const appearancePanel = el.shadowRoot?.querySelector(
      ".tab-panel.active"
    ) as HTMLElement;
    const selects = [...(appearancePanel?.querySelectorAll("select") || [])];
    const colorSelect = selects.find((sel) =>
      [...sel.options].some((opt) => opt.value === "cyan")
    );
    const radarSelect = selects.find((sel) =>
      [...sel.options].some((opt) => opt.value === "none")
    );
    expect(colorSelect).toBeTruthy();
    expect([...colorSelect!.options].map((o) => o.value)).not.toContain("warm_white");
    expect([...colorSelect!.options].map((o) => o.value)).not.toContain("warm_yellow");
    expect(radarSelect).toBeTruthy();
    expect(radarSelect!.value).toBe("none");
    expect([...radarSelect!.options].map((o) => o.value)).toContain("none");
  });

  it("migrates draft warm_* colors to white/yellow on load", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        capabilities: {
          colors: [
            "red",
            "blue",
            "green",
            "white",
            "yellow",
            "magenta",
            "cyan",
            "warm_white",
            "warm_yellow",
          ],
          radar: ["none", "10s", "30s"],
          modes: [
            "toggle",
            "radio_mandatory",
            "radio_optional",
            "radio_split",
            "mixed",
            "cover",
          ],
          button_count: 4,
          gang_count_min: 1,
          gang_count_max: 4,
          cover: {
            min_time_s: 1,
            max_time_s: 600,
            min_settle_s: 0,
            max_settle_s: 5,
            opposite_press: ["stop_only", "stop_then_reverse"],
            max_covers: 2,
          },
          mixed: {
            roles: ["toggle", "momentary", "radio", "cover_open", "cover_close"],
            min_pulse_s: 0.1,
            max_pulse_s: 600,
            default_pulse_s: 2,
          },
        },
        profiles: {
          lighting: {
            ...sampleProfile,
            color_on: "warm_yellow",
            color_off: "warm_white",
          },
        },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    expect(el._draft?.color_on).toBe("yellow");
    expect(el._draft?.color_off).toBe("white");
    expect(el._dirty).toBe(true);
    (el as any)._activeTab = "appearance";
    await el.updateComplete;
    const appearancePanel = el.shadowRoot?.querySelector(
      ".tab-panel.active"
    ) as HTMLElement;
    const selects = [...(appearancePanel?.querySelectorAll("select") || [])];
    const values = selects.flatMap((sel) => [...sel.options].map((o) => o.value));
    expect(values).not.toContain("warm_white");
    expect(values).not.toContain("warm_yellow");
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
            color_off: "white",
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
      COLOR_PREVIEW.white
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
    expect(el._dirty).toBe(false);
    el._onRingPress(4);
    await el.updateComplete;
    // Faceplate preview only — draft selected_button stays at the saved value.
    expect(el._draft?.selected_button).toBe(2);
    expect(el._radioPreviewSelected).toBe(4);
    expect(el._dirty).toBe(false);
    expect(el._isRingOn(4)).toBe(true);
    expect(el._isRingOn(2)).toBe(false);
  });

  it("does not mark dirty after save draft then faceplate press", async () => {
    const savedProfile = {
      ...panelPayload().profiles.lighting,
      mode: "radio_optional",
      selected_button: 1,
    };
    const callWS = vi
      .fn()
      .mockResolvedValueOnce(panelPayload({ sync_status: "synced" }))
      .mockResolvedValueOnce(savedProfile)
      .mockResolvedValueOnce(
        panelPayload({
          sync_status: "pending",
          profiles: { lighting: savedProfile },
        })
      );
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    (el.shadowRoot?.querySelector('[data-mode="radio_optional"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el._dirty).toBe(true);
    await el._saveDraft();
    await el.updateComplete;
    expect(el._dirty).toBe(false);

    el._onRingPress(3);
    await el.updateComplete;
    expect(el._dirty).toBe(false);
    expect(el.shadowRoot?.querySelector(".unsaved-draft")).toBeFalsy();
    expect(el._draft?.selected_button).not.toBe(3);
    expect(el._radioPreviewSelected).toBe(3);
    // Sync is still pending for hardware labels — not required for press preview.
    expect(el.shadowRoot?.querySelector("[data-sync-needed]")).toBeTruthy();
  });

  it("toggle faceplate press never marks draft dirty", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    expect(el._draft?.mode).toBe("toggle");
    expect(el._dirty).toBe(false);
    const before = JSON.stringify(el._draft);
    el._onRingPress(1);
    el._onRingPress(2);
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    expect(el._dirty).toBe(false);
    expect(JSON.stringify(el._draft)).toBe(before);
    expect(el.shadowRoot?.querySelector(".unsaved-draft")).toBeFalsy();
    const executeCalls = callWS.mock.calls.filter(
      (call: unknown[]) =>
        (call[0] as { type?: string })?.type === "conx_dynamic_panel/execute_button"
    );
    expect(executeCalls.length).toBe(2);
    expect(executeCalls[0][0]).toMatchObject({
      type: "conx_dynamic_panel/execute_button",
      entry_id: "abc",
      button: 1,
    });
    expect(executeCalls[1][0]).toMatchObject({ button: 2 });
  });

  it("faceplate press dispatches execute_button without dirty", async () => {
    const callWS = vi.fn().mockImplementation((msg: { type?: string }) => {
      if (msg.type === "conx_dynamic_panel/execute_button") {
        return Promise.resolve({
          entry_id: "abc",
          sync_status: "synced",
          relay_states: [true, false, false, false],
          momentary_active: [],
        });
      }
      return Promise.resolve(panelPayload({ sync_status: "synced" }));
    });
    const el = await mountCard({ language: "en", callWS });
    el._onRingPress(1);
    await Promise.resolve();
    await el.updateComplete;
    expect(el._dirty).toBe(false);
    expect(callWS).toHaveBeenCalledWith({
      type: "conx_dynamic_panel/execute_button",
      entry_id: "abc",
      button: 1,
    });
  });

  it("mixed momentary + toggle presses stay independent and never mark dirty", async () => {
    const mixedProfile: Profile = {
      ...sampleProfile,
      mode: "mixed",
      selected_button: null,
      buttons: sampleProfile.buttons.map((button, index) => ({
        ...button,
        role: index === 0 ? "momentary" : "toggle",
        pulse_time_s: 2,
        radio_member: true,
      })),
    };
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        sync_status: "synced",
        profiles: { lighting: mixedProfile },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    expect(el._draft?.mode).toBe("mixed");
    expect(el._dirty).toBe(false);
    const before = JSON.stringify(el._draft);

    // L1 momentary + L2 toggle: local LED only; draft untouched.
    el._onRingPress(1);
    el._onRingPress(2);
    await el.updateComplete;
    expect(el._dirty).toBe(false);
    expect(JSON.stringify(el._draft)).toBe(before);
    expect(el._radioPreviewSelected).toBeNull();
    expect(el._splitPreviewOn[1]).toBe(true);
    expect(el._splitPreviewOn[2]).toBe(true);
    // Independent — momentary press must not force toggle LED exclusivity.
    expect(el._isRingOn(1)).toBe(true);
    expect(el._isRingOn(2)).toBe(true);

    el._onRingPress(1);
    await el.updateComplete;
    expect(el._isRingOn(1)).toBe(false);
    expect(el._isRingOn(2)).toBe(true);
    expect(el._dirty).toBe(false);
    expect(JSON.stringify(el._draft)).toBe(before);
  });

  it("mixed momentary faceplate auto-offs after pulse_time_s", async () => {
    const mixedProfile: Profile = {
      ...sampleProfile,
      mode: "mixed",
      selected_button: null,
      buttons: sampleProfile.buttons.map((button, index) => ({
        ...button,
        role: index === 0 ? "momentary" : "toggle",
        pulse_time_s: 0.5,
        radio_member: true,
      })),
    };
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        sync_status: "synced",
        // No mapped relays → faceplate uses local optimistic pulse only.
        relay_entities: [],
        profiles: { lighting: mixedProfile },
      })
    );
    // Mount with real timers first — fake timers before load can hang Lit updates.
    const el = await mountCard({ language: "en", callWS });
    const before = JSON.stringify(el._draft);

    vi.useFakeTimers();
    try {
      el._onRingPress(1);
      await el.updateComplete;
      expect(el._isRingOn(1)).toBe(true);
      expect(el._dirty).toBe(false);

      await vi.advanceTimersByTimeAsync(500);
      await el.updateComplete;
      expect(el._isRingOn(1)).toBe(false);
      expect(el._dirty).toBe(false);
      expect(JSON.stringify(el._draft)).toBe(before);
    } finally {
      vi.useRealTimers();
    }
  });

  it("faceplate rings follow live mapped relay hass.states without dirty", async () => {
    const mixedProfile: Profile = {
      ...sampleProfile,
      mode: "mixed",
      selected_button: null,
      buttons: sampleProfile.buttons.map((button, index) => ({
        ...button,
        role: index === 0 ? "momentary" : "toggle",
        pulse_time_s: 2,
        radio_member: true,
      })),
    };
    const states: Record<string, { state: string }> = {
      "switch.l1": { state: "off" },
      "switch.l2": { state: "off" },
      "switch.l3": { state: "off" },
      "switch.l4": { state: "off" },
    };
    const subscribers: Array<(msg: Record<string, unknown>) => void> = [];
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        sync_status: "synced",
        profiles: { lighting: mixedProfile },
      })
    );
    const el = await mountCard({
      language: "en",
      callWS,
      states,
      connection: {
        subscribeMessage: vi.fn(async (cb: (msg: Record<string, unknown>) => void) => {
          subscribers.push(cb);
          cb({
            sync_status: "synced",
            relay_entities: ["switch.l1", "switch.l2", "switch.l3", "switch.l4"],
            relay_states: [false, false, false, false],
            momentary_active: [],
            cover_state: { active: false, state: "idle", direction: null, duration: null, reason: null },
          });
          return () => undefined;
        }),
      },
    });
    const before = JSON.stringify(el._draft);
    expect(el._dirty).toBe(false);
    expect(el._isRingOn(1)).toBe(false);

    // Physical / engine momentary ON → OFF via hass.states (no draft mutation).
    el.hass = { ...el.hass, states: { ...states, "switch.l1": { state: "on" } } };
    await el.updateComplete;
    expect(el._isRingOn(1)).toBe(true);
    expect(el._dirty).toBe(false);
    expect(JSON.stringify(el._draft)).toBe(before);

    el.hass = { ...el.hass, states: { ...states, "switch.l1": { state: "off" } } };
    await el.updateComplete;
    expect(el._isRingOn(1)).toBe(false);
    expect(el._dirty).toBe(false);
    expect(JSON.stringify(el._draft)).toBe(before);

    // Runtime push updates sync badge without touching draft.
    subscribers[0]?.({ sync_status: "out_of_sync" });
    await el.updateComplete;
    expect(el._panel?.sync_status).toBe("out_of_sync");
    expect(el._dirty).toBe(false);
    expect(JSON.stringify(el._draft)).toBe(before);
  });

  it("shouldUpdate on same hass reference when mapped relay state mutates", async () => {
    const mixedProfile: Profile = {
      ...sampleProfile,
      mode: "mixed",
      selected_button: null,
      buttons: sampleProfile.buttons.map((button, index) => ({
        ...button,
        role: index === 0 ? "momentary" : "toggle",
        pulse_time_s: 0.5,
        radio_member: true,
      })),
    };
    // Mutable states object — mirrors Lovelace reusing the same hass reference.
    const states: Record<string, { state: string }> = {
      "switch.l1": { state: "off" },
      "switch.l2": { state: "off" },
      "switch.l3": { state: "off" },
      "switch.l4": { state: "off" },
    };
    const hass = {
      language: "en",
      callWS: vi.fn().mockResolvedValue(
        panelPayload({
          sync_status: "synced",
          profiles: { lighting: mixedProfile },
        })
      ),
      states,
    };
    const el = await mountCard(hass);
    expect(el._isRingOn(1)).toBe(false);
    const before = JSON.stringify(el._draft);

    // Mutate in place, reassign same hass object (Lit default !== would skip).
    states["switch.l1"] = { state: "on" };
    el.hass = hass;
    await el.updateComplete;
    expect(el._isRingOn(1)).toBe(true);
    expect(el._dirty).toBe(false);
    expect(JSON.stringify(el._draft)).toBe(before);

    states["switch.l1"] = { state: "off" };
    el.hass = hass;
    await el.updateComplete;
    expect(el._isRingOn(1)).toBe(false);
    expect(el._dirty).toBe(false);
  });

  it("momentary UI pulse survives live ON reconcile and clears on timer/OFF", async () => {
    const mixedProfile: Profile = {
      ...sampleProfile,
      mode: "mixed",
      selected_button: null,
      buttons: sampleProfile.buttons.map((button, index) => ({
        ...button,
        role: index === 0 ? "momentary" : "toggle",
        pulse_time_s: 0.4,
        radio_member: true,
      })),
    };
    const states: Record<string, { state: string }> = {
      "switch.l1": { state: "off" },
      "switch.l2": { state: "off" },
      "switch.l3": { state: "off" },
      "switch.l4": { state: "off" },
    };
    const el = await mountCard({
      language: "en",
      callWS: vi.fn().mockResolvedValue(
        panelPayload({
          sync_status: "synced",
          profiles: { lighting: mixedProfile },
        })
      ),
      states,
    });
    const before = JSON.stringify(el._draft);

    vi.useFakeTimers();
    try {
      // Card press arms local pulse.
      el._onRingPress(1);
      await el.updateComplete;
      expect(el._isRingOn(1)).toBe(true);

      // Backend relay ON must not extinguish the ring (old reconcile bug).
      el.hass = {
        ...el.hass,
        states: { ...states, "switch.l1": { state: "on" } },
      };
      await el.updateComplete;
      expect(el._isRingOn(1)).toBe(true);
      expect(el._dirty).toBe(false);

      await vi.advanceTimersByTimeAsync(400);
      await el.updateComplete;
      // Live still ON → ring stays on via liveRelay.
      expect(el._isRingOn(1)).toBe(true);

      el.hass = {
        ...el.hass,
        states: { ...states, "switch.l1": { state: "off" } },
      };
      await el.updateComplete;
      expect(el._isRingOn(1)).toBe(false);
      expect(JSON.stringify(el._draft)).toBe(before);
    } finally {
      vi.useRealTimers();
    }
  });

  it("subscribe momentary_active arms UI pulse for physical press without dirty", async () => {
    const mixedProfile: Profile = {
      ...sampleProfile,
      mode: "mixed",
      selected_button: null,
      buttons: sampleProfile.buttons.map((button, index) => ({
        ...button,
        role: index === 0 ? "momentary" : "toggle",
        pulse_time_s: 0.3,
        radio_member: true,
      })),
    };
    const subscribers: Array<(msg: Record<string, unknown>) => void> = [];
    const states: Record<string, { state: string }> = {
      "switch.l1": { state: "off" },
      "switch.l2": { state: "off" },
      "switch.l3": { state: "off" },
      "switch.l4": { state: "off" },
    };
    const el = await mountCard({
      language: "en",
      callWS: vi.fn().mockResolvedValue(
        panelPayload({
          sync_status: "synced",
          profiles: { lighting: mixedProfile },
        })
      ),
      states,
      connection: {
        subscribeMessage: vi.fn(async (cb: (msg: Record<string, unknown>) => void) => {
          subscribers.push(cb);
          cb({
            sync_status: "synced",
            relay_entities: ["switch.l1", "switch.l2", "switch.l3", "switch.l4"],
            relay_states: [false, false, false, false],
            momentary_active: [],
          });
          return () => undefined;
        }),
      },
    });
    const before = JSON.stringify(el._draft);

    vi.useFakeTimers();
    try {
      // Physical press path: runtime says L1 ON + pulse armed (hass may lag).
      subscribers[0]?.({
        sync_status: "synced",
        relay_states: [true, false, false, false],
        momentary_active: [1],
      });
      // Also reflect entity ON the way HA eventually will.
      el.hass = {
        ...el.hass,
        states: { ...states, "switch.l1": { state: "on" } },
      };
      await el.updateComplete;
      expect(el._isRingOn(1)).toBe(true);
      expect(el._dirty).toBe(false);

      await vi.advanceTimersByTimeAsync(300);
      el.hass = {
        ...el.hass,
        states: { ...states, "switch.l1": { state: "off" } },
      };
      subscribers[0]?.({
        relay_states: [false, false, false, false],
        momentary_active: [],
      });
      await el.updateComplete;
      expect(el._isRingOn(1)).toBe(false);
      expect(JSON.stringify(el._draft)).toBe(before);
    } finally {
      vi.useRealTimers();
    }
  });

  it("toggle faceplate follows live relay and stays clean", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const states: Record<string, { state: string }> = {
      "switch.l1": { state: "off" },
      "switch.l2": { state: "on" },
      "switch.l3": { state: "off" },
      "switch.l4": { state: "off" },
    };
    const el = await mountCard({ language: "en", callWS, states });
    expect(el._isRingOn(1)).toBe(false);
    expect(el._isRingOn(2)).toBe(true);
    expect(el._dirty).toBe(false);

    el.hass = {
      ...el.hass,
      states: { ...states, "switch.l2": { state: "off" }, "switch.l1": { state: "on" } },
    };
    await el.updateComplete;
    expect(el._isRingOn(1)).toBe(true);
    expect(el._isRingOn(2)).toBe(false);
    expect(el._dirty).toBe(false);
  });

  it("editor edit dirty → save clean → press stays clean", async () => {
    const callWS = vi
      .fn()
      .mockResolvedValueOnce(panelPayload({ sync_status: "synced" }))
      .mockResolvedValueOnce({
        ...sampleProfile,
        name: "Lighting edited",
      })
      .mockResolvedValueOnce(
        panelPayload({
          sync_status: "pending",
          profiles: {
            lighting: { ...sampleProfile, name: "Lighting edited" },
          },
        })
      );
    const el = await mountCard({ language: "en", callWS });
    expect(el._dirty).toBe(false);
    el._patchDraft((draft: Profile) => {
      draft.name = "Lighting edited";
    });
    await el.updateComplete;
    expect(el._dirty).toBe(true);
    expect(el.shadowRoot?.querySelector(".unsaved-draft")).toBeTruthy();

    await el._saveDraft();
    await el.updateComplete;
    expect(el._dirty).toBe(false);
    expect(el.shadowRoot?.querySelector(".unsaved-draft")).toBeFalsy();

    el._onRingPress(1);
    el._onRingPress(3);
    await el.updateComplete;
    expect(el._dirty).toBe(false);
    expect(el.shadowRoot?.querySelector(".unsaved-draft")).toBeFalsy();
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
    expect(el.shadowRoot?.textContent).toMatch(/Unsaved draft/i);
    expect(el.shadowRoot?.textContent).toMatch(/last saved profile/i);
    const warn = el.shadowRoot?.querySelector(".warn.unsaved-draft") as HTMLElement;
    expect(warn).toBeTruthy();
    expect(warn.getAttribute("role")).toBe("status");
    // Emphasized unsaved-draft styles live on `.warn.unsaved-draft` in card CSS
    // (centered, bold, larger red) — jsdom does not resolve adoptedStyleSheets.
    const ctor = el.constructor as { styles?: { cssText?: string } | Array<{ cssText?: string }> };
    const sheets = Array.isArray(ctor.styles) ? ctor.styles : ctor.styles ? [ctor.styles] : [];
    const sheetText = sheets.map((sheet) => sheet.cssText || String(sheet)).join("\n");
    expect(sheetText).toMatch(/\.warn\.unsaved-draft\s*\{[^}]*text-align:\s*center/s);
    expect(sheetText).toMatch(/\.warn\.unsaved-draft\s*\{[^}]*font-weight:\s*700/s);
    expect(sheetText).toMatch(/\.warn\.unsaved-draft\s*\{[^}]*font-size:\s*1\.2rem/s);
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

  it("toggles operate mode to hide header chrome and show faceplate corner menu", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    expect(el._operateMode).toBe(false);
    expect(el.shadowRoot?.querySelector("[data-editor-chrome]")).toBeTruthy();
    expect(el.shadowRoot?.querySelector(".layout-hint")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("[data-actions='top']")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("[data-panel-title]")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("[data-card-header]")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("[data-status-action-bar]")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("[data-preview-chrome]")).toBeTruthy();
    expect(el.shadowRoot?.querySelector(".faceplate")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("[data-operate-menu]")).toBeFalsy();

    const toggle = el.shadowRoot?.querySelector(
      "[data-operate-toggle]"
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    expect(toggle.textContent?.trim()).toBe("Operate");
    toggle.click();
    await el.updateComplete;

    expect(el._operateMode).toBe(true);
    expect(loadStoredOperateMode()).toBe(true);
    const card = el.shadowRoot?.querySelector("ha-card");
    expect(card?.classList.contains("operate-mode")).toBe(true);
    expect(card?.getAttribute("data-operate")).toBe("true");
    expect(el.shadowRoot?.querySelector("[data-panel-title]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-card-header]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-status-action-bar]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-preview-chrome]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-operate-toggle]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-editor-chrome]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector(".layout-hint")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-actions='top']")).toBeFalsy();
    expect(el.shadowRoot?.querySelector(".settings-tabs")).toBeFalsy();
    expect(el.shadowRoot?.querySelector(".section-title")).toBeFalsy();
    const operateProfile = el.shadowRoot?.querySelector(
      "[data-operate-profile] .hero-profile-name"
    );
    expect(operateProfile).toBeTruthy();
    expect(operateProfile?.textContent?.trim()).toBe("Lighting");
    expect(el.shadowRoot?.querySelector(".faceplate")).toBeTruthy();
    expect(el.shadowRoot?.querySelector(".hero-preview.open.operate-hero")).toBeTruthy();
    const faceMenu = el.shadowRoot?.querySelector(
      "[data-operate-menu]"
    ) as HTMLButtonElement;
    expect(faceMenu).toBeTruthy();
    expect(faceMenu.classList.contains("faceplate-menu-btn")).toBe(true);

    faceMenu.click();
    await el.updateComplete;
    expect(el._menuOpen).toBe(true);
    const exitBtn = el.shadowRoot?.querySelector(
      "[data-operate-exit]"
    ) as HTMLButtonElement;
    expect(exitBtn).toBeTruthy();
    expect(exitBtn.textContent?.trim()).toBe("Settings");
    exitBtn.click();
    await el.updateComplete;
    expect(el._operateMode).toBe(false);
    expect(loadStoredOperateMode()).toBe(false);
    expect(el._menuOpen).toBe(false);
    expect(el.shadowRoot?.querySelector("[data-editor-chrome]")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("[data-actions='top']")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("[data-panel-title]")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("[data-operate-menu]")).toBeFalsy();
  });

  it("restores operate mode from localStorage on connect", async () => {
    persistOperateMode(true);
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "he", callWS });
    expect(el._operateMode).toBe(true);
    expect(el.shadowRoot?.querySelector("[data-editor-chrome]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-panel-title]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-card-header]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-operate-menu]")).toBeTruthy();
    const faceMenu = el.shadowRoot?.querySelector(
      "[data-operate-menu]"
    ) as HTMLButtonElement;
    faceMenu.click();
    await el.updateComplete;
    const exitBtn = el.shadowRoot?.querySelector(
      "[data-operate-exit]"
    ) as HTMLButtonElement;
    expect(exitBtn?.textContent?.trim()).toBe("הגדרות");
  });

  it("hides cover live controls in operate mode", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        sync_status: "synced",
        profiles: {
          lighting: {
            ...sampleProfile,
            mode: "cover",
            covers: [
              {
                id: "cover_1",
                open_button: 1,
                close_button: 2,
                open_time_s: 20,
                close_time_s: 20,
                direction_settle_s: 0.5,
                opposite_press: "stop_only",
              },
            ],
          },
        },
        active_profile_id: "lighting",
      })
    );
    const el = await mountCard({ language: "en", callWS });
    el._operateMode = true;
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector("[data-editor-chrome]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-panel-title]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-operate-menu]")).toBeTruthy();
    expect(el.shadowRoot?.querySelector(".faceplate")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("[data-cover-control]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-cover-open]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-cover-stop]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-cover-close]")).toBeFalsy();
  });

  it("switches editor tabs between profiles appearance and buttons", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    expect(el._activeTab).toBe("profiles");
    expect(el.shadowRoot?.querySelector(".profile-list")).toBeTruthy();
    el._activeTab = "appearance";
    await el.updateComplete;
    const appearancePanel = el.shadowRoot?.querySelector(
      ".tab-panel.active"
    ) as HTMLElement;
    expect(appearancePanel?.querySelector(".dimmer-field")).toBeTruthy();
    expect(appearancePanel?.querySelector("[data-mode-picker]")).toBeFalsy();
    el._activeTab = "buttons";
    await el.updateComplete;
    const buttonsPanel = el.shadowRoot?.querySelector(
      ".tab-panel.active"
    ) as HTMLElement;
    expect(buttonsPanel?.querySelector(".button-edit")).toBeTruthy();
    expect(buttonsPanel?.querySelector("[data-mode-picker]")).toBeTruthy();
  });

  it("places full-width mode chips at the top of the buttons tab", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    const buttonsPanel = el.shadowRoot?.querySelector(
      ".tab-panel.active"
    ) as HTMLElement;
    const modePicker = buttonsPanel?.querySelector(
      "[data-mode-picker]"
    ) as HTMLElement;
    expect(modePicker).toBeTruthy();
    expect(buttonsPanel.querySelector("select")).toBeFalsy();
    const chips = [
      ...(modePicker.querySelectorAll("button.radio-member[data-mode]") || []),
    ] as HTMLButtonElement[];
    expect(chips.map((chip) => chip.dataset.mode)).toEqual([
      "toggle",
      "radio_mandatory",
      "radio_optional",
      "radio_split",
      "mixed",
      "cover",
    ]);
    expect(modePicker.querySelector('[data-mode="toggle"]')?.classList.contains("on")).toBe(
      true
    );
    (modePicker.querySelector('[data-mode="cover"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el._draft?.mode).toBe("cover");
    expect(el._draft?.gang_count).toBe(4);
    const coverEl = el.shadowRoot?.querySelector("[data-cover-editor]");
    expect(coverEl).toBeTruthy();
    expect(coverEl?.querySelector("[data-cover-slot]")).toBeTruthy();
    expect(coverEl?.querySelector("[data-cover-add]")?.textContent?.trim()).toBe(
      "Add cover"
    );
    const modeEl = el.shadowRoot?.querySelector("[data-mode-picker]");
    expect(
      modeEl &&
        coverEl &&
        Boolean(modeEl.compareDocumentPosition(coverEl) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true);
  });

  it("hides radio and cover modes for 1-gang and coerces draft mode to toggle", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        sync_status: "synced",
        profiles: {
          lighting: {
            ...sampleProfile,
            mode: "radio_optional",
            selected_button: 2,
            gang_count: 2,
          },
        },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    expect(el._draft?.mode).toBe("radio_optional");

    const profilesPanelHost = el.shadowRoot?.querySelector(
      "[data-profiles-gang]"
    ) as HTMLElement;
    const pick1 = profilesPanelHost.querySelector(
      '[data-gang-picker] button.radio-member:nth-child(1)'
    ) as HTMLButtonElement;
    pick1.click();
    await el.updateComplete;
    expect(el._draft?.gang_count).toBe(1);
    expect(el._draft?.mode).toBe("toggle");

    const modePicker = el.shadowRoot?.querySelector(
      "[data-mode-picker]"
    ) as HTMLElement;
    const modes = [
      ...(modePicker.querySelectorAll("button.radio-member[data-mode]") || []),
    ].map((chip) => (chip as HTMLButtonElement).dataset.mode);
    expect(modes).toEqual(["toggle", "mixed"]);
    expect(modePicker.querySelector('[data-mode="radio_mandatory"]')).toBeFalsy();
    expect(modePicker.querySelector('[data-mode="radio_optional"]')).toBeFalsy();
    expect(modePicker.querySelector('[data-mode="radio_split"]')).toBeFalsy();
    expect(modePicker.querySelector('[data-mode="cover"]')).toBeFalsy();
    expect(modePicker.querySelector('[data-mode="mixed"]')).toBeTruthy();
  });

  it("shows per-button role controls in free mix mode", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    const modePicker = el.shadowRoot?.querySelector(
      "[data-mode-picker]"
    ) as HTMLElement;
    (modePicker.querySelector('[data-mode="mixed"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el._draft?.mode).toBe("mixed");
    expect(el.shadowRoot?.querySelector("[data-mixed-roles]")).toBeTruthy();
    expect(el.shadowRoot?.querySelector("[data-mixed-hint]")).toBeTruthy();
    // Roles are always visible — no accordion expand required.
    const roleCards = [
      ...(el.shadowRoot?.querySelectorAll("[data-mixed-role]") || []),
    ];
    expect(roleCards.length).toBe(el._draft?.gang_count || 4);
    const roleRow = el.shadowRoot?.querySelector(
      '[data-mixed-role="1"]'
    ) as HTMLElement;
    expect(roleRow).toBeTruthy();
    expect(roleRow.querySelector('[data-role="toggle"]')).toBeTruthy();
    expect(roleRow.querySelector('[data-role="momentary"]')).toBeTruthy();
    expect(roleRow.querySelector('[data-role="radio"]')).toBeTruthy();
    expect(roleRow.querySelector('[data-role="cover_open"]')).toBeTruthy();
    expect(roleRow.querySelector('[data-role="cover_close"]')).toBeTruthy();
    (roleRow.querySelector('[data-role="momentary"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el._draft?.buttons[0].role).toBe("momentary");
    expect(roleRow.querySelector("[data-pulse-time]")).toBeTruthy();

    (roleRow.querySelector('[data-role="cover_open"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el._draft?.buttons[0].role).toBe("cover_open");
    expect(roleRow.querySelector("[data-cover-id]")).toBeTruthy();
    expect(roleRow.querySelector("[data-cover-id-hint]")?.textContent || "").toMatch(
      /not a Home Assistant|לא ישות|не сущность/i
    );
    expect(roleRow.querySelector("[data-mixed-cover-hint]")?.textContent || "").toMatch(
      /Toggle\/Momentary|טוגל|Тоггл/
    );
    expect(roleRow.querySelector("[data-mixed-cover-hint]")?.textContent || "").not.toMatch(
      /below|למטה|ниже/i
    );
    // Travel times sit inside the cover-role card; bottom mixed editor is gone.
    expect(el.shadowRoot?.querySelector("[data-cover-editor]")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-mixed-cover-times]")).toBeFalsy();
    expect(roleRow.querySelector("[data-inline-cover-times]")).toBeTruthy();
    expect(roleRow.querySelector("[data-cover-open-time]")).toBeTruthy();
    expect(roleRow.querySelector("[data-cover-close-time]")).toBeTruthy();
    expect(roleRow.querySelector("[data-cover-settle]")).toBeTruthy();
    expect(roleRow.querySelector("[data-cover-opposite]")).toBeTruthy();

    const roleRow2 = el.shadowRoot?.querySelector(
      '[data-mixed-role="2"]'
    ) as HTMLElement;
    (roleRow2.querySelector('[data-role="cover_close"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el._draft?.buttons[1].role).toBe("cover_close");
    // Shared cover_1: times only once (on the first cover-role card).
    const updatedRow1 = el.shadowRoot?.querySelector(
      '[data-mixed-role="1"]'
    ) as HTMLElement;
    const updatedRow2 = el.shadowRoot?.querySelector(
      '[data-mixed-role="2"]'
    ) as HTMLElement;
    expect(updatedRow1.querySelector("[data-inline-cover-times]")).toBeTruthy();
    expect(updatedRow2.querySelector("[data-inline-cover-times]")).toBeFalsy();
    expect(updatedRow2.querySelector("[data-mixed-cover-times-on]")?.textContent || "").toContain(
      "L1"
    );
    expect(el.shadowRoot?.querySelector("[data-cover-editor]")).toBeFalsy();
    // Cover roles must not show HA action/entity pickers (motor slot ≠ HA entity).
    expect(updatedRow1.querySelector("[data-mixed-action-entity]")).toBeFalsy();
    expect(updatedRow2.querySelector("[data-mixed-action-entity]")).toBeFalsy();

    const radioRow = el.shadowRoot?.querySelector(
      '[data-mixed-role="1"]'
    ) as HTMLElement;
    (radioRow.querySelector('[data-role="radio"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el._draft?.buttons[0].role).toBe("radio");
    expect(el.shadowRoot?.querySelector(".radio-groups-section")).toBeTruthy();
    expect(radioRow.querySelector("[data-mixed-action-entity]")).toBeTruthy();
    expect(
      radioRow.querySelector('[data-action-picker][data-button="1"]')
    ).toBeTruthy();
  });

  it("shows searchable action/entity pickers on free-mix toggle and momentary", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({
      language: "en",
      callWS,
      services: {
        light: { toggle: {}, turn_on: {} },
        switch: { toggle: {} },
      },
      states: {
        "light.living_room": { state: "on" },
        "light.kitchen": { state: "off" },
        "switch.porch": { state: "off" },
      },
    });
    el._activeTab = "buttons";
    await el.updateComplete;
    (el.shadowRoot?.querySelector('[data-mode="mixed"]') as HTMLButtonElement).click();
    await el.updateComplete;

    const toggleCard = el.shadowRoot?.querySelector(
      '[data-mixed-role="1"]'
    ) as HTMLElement;
    // Default free-mix role is toggle — primary pickers visible without accordion.
    expect(toggleCard.querySelector(".mixed-role-extras")).toBeTruthy();
    expect(toggleCard.querySelector("[data-mixed-action-entity]")).toBeTruthy();
    const actionSelect = toggleCard.querySelector(
      '[data-action-picker][data-button="1"]'
    ) as HTMLSelectElement;
    const entitySelect = toggleCard.querySelector(
      '[data-entity-picker][data-button="1"]'
    ) as HTMLSelectElement;
    expect(actionSelect).toBeTruthy();
    expect(entitySelect).toBeTruthy();
    expect(toggleCard.querySelector("[data-action-filter]")).toBeTruthy();
    expect(toggleCard.querySelector("[data-entity-filter]")).toBeTruthy();

    actionSelect.value = "light.toggle";
    actionSelect.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(el._draft?.buttons[0].action?.action).toBe("light.toggle");

    const entityAfter = toggleCard.querySelector(
      '[data-entity-picker][data-button="1"]'
    ) as HTMLSelectElement;
    entityAfter.value = "light.kitchen";
    entityAfter.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(el._draft?.buttons[0].action).toEqual({
      action: "light.toggle",
      target: { entity_id: "light.kitchen" },
      data: {},
    });

    (toggleCard.querySelector('[data-role="momentary"]') as HTMLButtonElement).click();
    await el.updateComplete;
    const momentaryCard = el.shadowRoot?.querySelector(
      '[data-mixed-role="1"]'
    ) as HTMLElement;
    expect(momentaryCard.querySelector("[data-pulse-time]")).toBeTruthy();
    expect(momentaryCard.querySelector("[data-mixed-action-entity]")).toBeTruthy();
    expect(
      momentaryCard.querySelector('[data-action-picker][data-button="1"]')
    ).toBeTruthy();
    expect(
      momentaryCard.querySelector('[data-entity-picker][data-button="1"]')
    ).toBeTruthy();
  });

  it("labels free-mix per-button roles in Hebrew", () => {
    expect(localize("he", "card.mixed_roles")).toBe("תפקיד לכל כפתור");
    expect(localize("he", "role.momentary")).toBe("רגעי");
    expect(localize("he", "role.radio")).toBe("קבוצת רדיו");
    expect(localize("he", "role.radio")).not.toContain("רליי");
    expect(localize("he", "role.cover_open")).toBe("פתיחת תריס");
    expect(localize("he", "role.cover_close")).toBe("סגירת תריס");
    expect(localize("he", "card.cover_id")).toBe("מנוע / מזהה תריס");
    expect(localize("en", "card.cover_id")).toBe("Motor / Cover slot");
    expect(localize("ru", "card.cover_id")).toBe("Мотор / слот ролеты");
    expect(localize("he", "card.mixed_cover_hint")).toContain("ישות");
    expect(localize("he", "card.mixed_cover_hint")).toContain("טוגל");
    expect(localize("he", "card.mixed_cover_hint")).not.toContain("למטה");
    expect(localize("en", "card.mixed_cover_hint")).toContain("Toggle/Momentary");
    expect(localize("en", "card.mixed_cover_hint")).not.toMatch(/below/i);
    expect(localize("en", "card.picker_search")).toBe("Search…");
    expect(localize("he", "card.picker_search")).toBe("חיפוש…");
    expect(localize("en", "card.mixed_roles")).toBe("Per-button roles");
    expect(localize("en", "role.radio")).toBe("Radio group");
    expect(localize("he", "card.unsaved")).toContain("שמרו טיוטה");
    expect(localize("en", "card.sync_needed")).toContain("Press behavior");
  });

  it("promotes mixed buttons to radio when added to a radio group", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    const modePicker = el.shadowRoot?.querySelector(
      "[data-mode-picker]"
    ) as HTMLElement;
    (modePicker.querySelector('[data-mode="mixed"]') as HTMLButtonElement).click();
    await el.updateComplete;
    const roleRow = el.shadowRoot?.querySelector(
      '[data-mixed-role="2"]'
    ) as HTMLElement;
    (roleRow.querySelector('[data-role="radio"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el._draft?.buttons[1].role).toBe("radio");

    // L4 starts as toggle; joining a group must promote it to radio.
    expect(el._draft?.buttons[3].role).toBe("toggle");
    const groupCard = el.shadowRoot?.querySelector(
      ".radio-group-card:not(.is-summary)"
    ) as HTMLElement;
    const l4Chip = [
      ...(groupCard.querySelectorAll(".radio-member") || []),
    ].find((chip) => chip.textContent?.includes("L4")) as HTMLButtonElement;
    expect(l4Chip).toBeTruthy();
    l4Chip.click();
    await el.updateComplete;
    expect(el._draft?.buttons[3].role).toBe("radio");
    expect(el._draft?.radio_groups?.[0].buttons).toContain(4);
  });

  it("shows sync-needed notice after save when hardware is pending", async () => {
    const savedProfile = {
      ...panelPayload().profiles.lighting,
      mode: "mixed",
    };
    const callWS = vi
      .fn()
      .mockResolvedValueOnce(panelPayload({ sync_status: "synced" }))
      .mockResolvedValueOnce(savedProfile)
      .mockResolvedValueOnce(
        panelPayload({
          sync_status: "pending",
          profiles: { lighting: savedProfile },
        })
      );
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    (el.shadowRoot?.querySelector('[data-mode="mixed"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el._dirty).toBe(true);
    await el._saveDraft();
    await el.updateComplete;
    expect(el._dirty).toBe(false);
    expect(el.shadowRoot?.querySelector("[data-sync-needed]")).toBeTruthy();
    expect(el.shadowRoot?.querySelector(".unsaved-draft")).toBeFalsy();
    expect(el.shadowRoot?.querySelector("[data-status-action-bar]")).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[data-actions="top"]')).toBeTruthy();
  });

  it("keeps draft actions in the sticky top status bar", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "he", callWS });
    const top = el.shadowRoot?.querySelector('[data-actions="top"]') as HTMLElement;
    expect(top).toBeTruthy();
    const labels = [...(top.querySelectorAll(".btn") || [])].map((btn) =>
      (btn.textContent || "").trim()
    );
    expect(labels).toEqual([
      "שמור טיוטה",
      "בטל שינויים",
      "סנכרון לפאנל",
      "משיכה מהפאנל",
    ]);
    expect(el.shadowRoot?.querySelector(".actions-dock-footer")).toBeFalsy();
  });

  it("fills column width and keeps dense mixed-role chip styles", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "en", callWS });
    const ctor = el.constructor as {
      styles?: { cssText?: string } | Array<{ cssText?: string }>;
    };
    const sheets = Array.isArray(ctor.styles)
      ? ctor.styles
      : ctor.styles
        ? [ctor.styles]
        : [];
    const sheetText = sheets.map((sheet) => sheet.cssText || String(sheet)).join("\n");
    expect(sheetText).toMatch(/:host\s*\{[^}]*width:\s*100%/s);
    expect(sheetText).toMatch(/ha-card\.conx-card\s*\{[^}]*max-width:\s*none/s);
    expect(sheetText).toMatch(/\.faceplate-bezel\s*\{[^}]*width:\s*100%/s);
    expect(sheetText).toMatch(
      /\.mixed-role-picker\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/s
    );
    expect(sheetText).toMatch(
      /\.mixed-role-card-main\s*\{[^}]*grid-template-columns:\s*minmax\(2\.2rem,\s*4\.2rem\)\s+minmax\(0,\s*1fr\)/s
    );
    expect(sheetText).toMatch(/\.mixed-role-picker\s+\.radio-member\s*\{[^}]*min-height:\s*22px/s);
    expect(sheetText).toMatch(
      /\.cover-times-compact\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(5\.5rem,\s*1fr\)\)/s
    );
    expect(sheetText).toMatch(/\.mixed-cover-times\s*\{[^}]*flex:\s*1\s+1\s+100%/s);
    expect(sheetText).toMatch(/\.mixed-action-entity\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit/s);
    expect(sheetText).toMatch(/\.radio-member\.on\s*\{[^}]*color:\s*var\(--accent-text\)/s);
    expect(sheetText).toMatch(/\.mixed-role-l\s*\{[^}]*color:\s*var\(--text\)/s);
    expect(sheetText).toMatch(/\.actions-grid\s+\.btn\s*\{[^}]*min-height:\s*32px/s);
  });

  it("keeps free-mix role chips in a width grid row", async () => {
    const callWS = vi.fn().mockResolvedValue(panelPayload({ sync_status: "synced" }));
    const el = await mountCard({ language: "he", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    (el.shadowRoot?.querySelector('[data-mode="mixed"]') as HTMLButtonElement).click();
    await el.updateComplete;
    const card = el.shadowRoot?.querySelector(
      '[data-mixed-role="1"]'
    ) as HTMLElement;
    expect(card.querySelector(".mixed-role-card-main")).toBeTruthy();
    expect(card.querySelector(".mixed-role-picker")).toBeTruthy();
    // Default toggle shows action/entity extras in the role card.
    expect(card.querySelector(".mixed-role-extras")).toBeTruthy();
    expect(card.querySelector("[data-mixed-action-entity]")).toBeTruthy();
    const roles = [...(card.querySelectorAll("[data-role]") || [])].map(
      (chip) => chip.getAttribute("data-role")
    );
    expect(roles).toEqual([
      "toggle",
      "momentary",
      "radio",
      "cover_open",
      "cover_close",
    ]);
    (card.querySelector('[data-role="cover_close"]') as HTMLButtonElement).click();
    await el.updateComplete;
    const updated = el.shadowRoot?.querySelector(
      '[data-mixed-role="1"]'
    ) as HTMLElement;
    expect(updated.querySelector(".mixed-role-extras")).toBeTruthy();
    expect(updated.querySelector("[data-cover-id]")).toBeTruthy();
    expect(updated.querySelector("[data-mixed-action-entity]")).toBeFalsy();
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

describe("cover mode", () => {
  const coverProfile = (overrides: Record<string, unknown> = {}) => ({
    ...sampleProfile,
    mode: "cover",
    covers: [
      {
        ...(sampleProfile.covers?.[0] || {
          id: "cover_1",
          open_button: 1,
          close_button: 2,
          open_time_s: 20,
          close_time_s: 20,
          direction_settle_s: 0.5,
          opposite_press: "stop_only",
        }),
        open_button: 1,
        close_button: 3,
        ...overrides,
      },
    ],
  });

  beforeEach(() => {
    document.body.innerHTML = "";
    clearStoredLanguage();
    clearStoredOperateMode();
  });

  it("normalizes partial cover payloads into safe values", () => {
    expect(normalizeCover(undefined)).toEqual({
      id: "cover_1",
      open_button: 1,
      close_button: 2,
      open_time_s: 20,
      close_time_s: 20,
      direction_settle_s: 0.5,
      opposite_press: "stop_only",
    });
    const clamped = normalizeCover({
      open_button: 9,
      close_button: 9,
      open_time_s: 5000,
      close_time_s: 0,
      direction_settle_s: 99,
      opposite_press: "nonsense",
    } as never);
    expect(clamped.open_button).toBe(1);
    // The pair can never collapse onto a single button.
    expect(clamped.close_button).not.toBe(clamped.open_button);
    expect(clamped.open_time_s).toBe(600);
    expect(clamped.close_time_s).toBe(1);
    expect(clamped.direction_settle_s).toBe(5);
    expect(clamped.opposite_press).toBe("stop_only");
  });

  it("shows the cover editor only in cover mode", async () => {
    const callWS = vi
      .fn()
      .mockResolvedValue(panelPayload({ profiles: { lighting: sampleProfile } }));
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector("[data-cover-editor]")).toBeFalsy();

    el._patchDraft((draft: Profile) => {
      draft.mode = "cover";
    });
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector("[data-cover-editor]")).toBeTruthy();
  });

  it("shows Cover 1 and an Add-cover slot for Cover 2 on a 4-gang panel", async () => {
    const callWS = vi
      .fn()
      .mockResolvedValue(panelPayload({ profiles: { lighting: coverProfile() } }));
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;

    const editor = el.shadowRoot?.querySelector("[data-cover-editor]") as HTMLElement;
    expect(editor).toBeTruthy();
    expect(editor.querySelector("[data-gang-picker]")).toBeTruthy();
    expect(editor.querySelectorAll(".cover-block").length).toBe(2);
    expect(editor.querySelector("[data-cover-slot='1']")).toBeTruthy();
    expect(editor.querySelector("[data-cover-add]")?.textContent?.trim()).toBe("Add cover");

    (editor.querySelector("[data-cover-add]") as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el._draft?.covers?.length).toBe(2);
    expect(el._draft?.covers?.[1]?.open_button).toBe(2);
    expect(el._draft?.covers?.[1]?.close_button).toBe(4);
    // After adding, the empty slot is gone and both editors remain.
    const updated = el.shadowRoot?.querySelector("[data-cover-editor]") as HTMLElement;
    expect(updated.querySelector("[data-cover-slot]")).toBeFalsy();
    expect(updated.querySelectorAll(".cover-block").length).toBe(2);
    expect(updated.querySelector("[data-cover-add]")).toBeFalsy();
  });

  it("raises gang_count to 4 when switching into cover mode", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        profiles: {
          lighting: { ...sampleProfile, gang_count: 2, mode: "toggle" },
        },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    expect(el._draft?.gang_count).toBe(2);
    (el.shadowRoot?.querySelector(
      '[data-mode="cover"]'
    ) as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el._draft?.mode).toBe("cover");
    expect(el._draft?.gang_count).toBe(4);
    expect(el.shadowRoot?.querySelector("[data-cover-slot='1']")).toBeTruthy();
  });

  it("swaps directions instead of assigning one button to both", async () => {
    const callWS = vi
      .fn()
      .mockResolvedValue(panelPayload({ profiles: { lighting: coverProfile() } }));
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;

    const pickers = el.shadowRoot?.querySelectorAll(".cover-buttons");
    expect(pickers?.length).toBe(2);
    const closeChips = Array.from(
      (pickers?.[1] as HTMLElement).querySelectorAll("button.radio-member")
    ) as HTMLButtonElement[];

    // Assign the close direction to L1, which the open direction already uses.
    closeChips[0].click();
    await el.updateComplete;
    expect(el._draft?.covers?.[0]?.close_button).toBe(1);
    expect(el._draft?.covers?.[0]?.open_button).toBe(3);
    expect(el._draft?.covers?.[0]?.open_button).not.toBe(el._draft?.covers?.[0]?.close_button);
  });

  it("edits travel times and clamps them to the supported range", async () => {
    const callWS = vi
      .fn()
      .mockResolvedValue(panelPayload({ profiles: { lighting: coverProfile() } }));
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;

    const openTime = el.shadowRoot?.querySelector(
      "input[data-cover-open-time]"
    ) as HTMLInputElement;
    openTime.value = "35";
    openTime.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(el._draft?.covers?.[0]?.open_time_s).toBe(35);

    const closeTime = el.shadowRoot?.querySelector(
      "input[data-cover-close-time]"
    ) as HTMLInputElement;
    closeTime.value = "99999";
    closeTime.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(el._draft?.covers?.[0]?.close_time_s).toBe(600);
    // Editing a draft must never touch hardware.
    expect(callWS).toHaveBeenCalledTimes(1);
  });

  it("stores the opposite-direction policy on the draft", async () => {
    const callWS = vi
      .fn()
      .mockResolvedValue(panelPayload({ profiles: { lighting: coverProfile() } }));
    const el = await mountCard({ language: "en", callWS });
    el._activeTab = "buttons";
    await el.updateComplete;
    const select = el.shadowRoot?.querySelector(
      "select[data-cover-opposite]"
    ) as HTMLSelectElement;
    select.value = "stop_then_reverse";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(el._draft?.covers?.[0]?.opposite_press).toBe("stop_then_reverse");
  });

  it("lights only the travelling direction ring", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        profiles: { lighting: coverProfile() },
        cover_state: {
          active: true,
          state: "close",
          direction: "close",
          duration: 20,
          reason: "press",
        },
      })
    );
    const el = await mountCard({ language: "en", callWS });
    const rings = [...(el.shadowRoot?.querySelectorAll(".ring") || [])];
    expect(rings.map((ring) => ring.classList.contains("on"))).toEqual([
      false,
      false,
      true,
      false,
    ]);
  });

  it("drives the cover through the integration websocket API", async () => {
    const callWS = vi.fn().mockImplementation((msg: Record<string, unknown>) => {
      if (msg.type === "conx_dynamic_panel/cover_command") {
        return Promise.resolve({
          active: true,
          state: msg.command === "stop" ? "idle" : msg.command,
          direction: msg.command === "stop" ? null : msg.command,
          duration: 20,
          reason: "command",
        });
      }
      return Promise.resolve(panelPayload({ profiles: { lighting: coverProfile() } }));
    });
    const el = await mountCard({ language: "en", callWS });
    const control = el.shadowRoot?.querySelector("[data-cover-control]");
    expect(control).toBeTruthy();

    (el.shadowRoot?.querySelector("[data-cover-open]") as HTMLButtonElement).click();
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;
    expect(callWS).toHaveBeenCalledWith({
      type: "conx_dynamic_panel/cover_command",
      entry_id: "abc",
      command: "open",
      cover_id: "cover_1",
    });
    expect(el._panel?.cover_state?.state).toBe("open");

    (el.shadowRoot?.querySelector("[data-cover-stop]") as HTMLButtonElement).click();
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;
    expect(el._panel?.cover_state?.state).toBe("idle");
  });

  it("labels cover mode in Hebrew and Russian", () => {
    expect(localize("he", "mode.cover")).toBe("תריס");
    expect(localize("he", "card.cover_open")).toBe("פתיחה");
    expect(localize("ru", "mode.cover")).toContain("Ролета");
    expect(localize("en", "card.cover_stop")).toBe("Stop");
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

describe("ha pickers", () => {
  it("lists domain.service actions from hass.services", () => {
    expect(
      listServiceActions({
        light: { toggle: {}, turn_on: {} },
        switch: { toggle: {} },
      })
    ).toEqual(["light.toggle", "light.turn_on", "switch.toggle"]);
  });

  it("filters entity ids by action domain", () => {
    expect(actionDomain("light.toggle")).toBe("light");
    expect(
      listEntityIds(
        {
          "light.living_room": { state: "on" },
          "switch.kitchen": { state: "off" },
        },
        "light"
      )
    ).toEqual(["light.living_room"]);
    expect(withCurrentOption(["light.a"], "light.legacy")).toEqual([
      "light.legacy",
      "light.a",
    ]);
  });

  it("renders service and entity selects from hass and marks draft dirty", async () => {
    const callWS = vi.fn().mockResolvedValue(
      panelPayload({
        profiles: {
          lighting: {
            ...sampleProfile,
            buttons: [
              {
                index: 1,
                name: "Living room",
                action: {
                  action: "light.toggle",
                  target: { entity_id: "light.living_room" },
                  data: {},
                },
              },
              ...sampleProfile.buttons.slice(1),
            ],
          },
        },
      })
    );
    const el = await mountCard({
      language: "en",
      callWS,
      services: {
        light: { toggle: {}, turn_on: {} },
        switch: { toggle: {} },
      },
      states: {
        "light.living_room": { state: "on" },
        "light.kitchen": { state: "off" },
        "switch.porch": { state: "off" },
      },
    });
    el._activeTab = "buttons";
    await el.updateComplete;
    (
      el.shadowRoot?.querySelector(
        '.button-edit[data-button="1"] .button-edit-toggle'
      ) as HTMLButtonElement
    ).click();
    await el.updateComplete;

    const actionSelect = el.shadowRoot?.querySelector(
      '[data-action-picker][data-button="1"]'
    ) as HTMLSelectElement;
    const entitySelect = el.shadowRoot?.querySelector(
      '[data-entity-picker][data-button="1"]'
    ) as HTMLSelectElement;
    expect(actionSelect).toBeTruthy();
    expect(entitySelect).toBeTruthy();
    expect([...actionSelect.options].map((opt) => opt.value)).toEqual(
      expect.arrayContaining(["", "light.toggle", "light.turn_on", "switch.toggle"])
    );
    expect([...entitySelect.options].map((opt) => opt.value)).toEqual([
      "",
      "light.kitchen",
      "light.living_room",
    ]);
    expect(entitySelect.options).not.toContainEqual(
      expect.objectContaining({ value: "switch.porch" })
    );

    actionSelect.value = "switch.toggle";
    actionSelect.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(el._dirty).toBe(true);
    expect(el._draft.buttons[0].action?.action).toBe("switch.toggle");
    expect(el._draft.buttons[0].action?.target).toEqual({});

    const entityAfter = el.shadowRoot?.querySelector(
      '[data-entity-picker][data-button="1"]'
    ) as HTMLSelectElement;
    expect([...entityAfter.options].map((opt) => opt.value)).toEqual([
      "",
      "switch.porch",
    ]);
    entityAfter.value = "switch.porch";
    entityAfter.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(el._draft.buttons[0].action).toEqual({
      action: "switch.toggle",
      target: { entity_id: "switch.porch" },
      data: {},
    });
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
