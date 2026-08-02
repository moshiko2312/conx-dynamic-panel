import { beforeEach, describe, expect, it, vi } from "vitest";
import { profilesEqual, cloneProfile } from "../src/api";
import { isRtl, localize } from "../src/localize";
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

describe("localize", () => {
  it("returns Hebrew strings for he", () => {
    expect(localize("he", "card.sync")).toContain("סנכרון");
    expect(isRtl("he-IL")).toBe(true);
  });

  it("falls back to English", () => {
    expect(localize("en", "card.sync")).toBe("Sync to Panel");
    expect(isRtl("en")).toBe(false);
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
  });

  it("registers card and editor", () => {
    expect(customElements.get("conx-dynamic-panel-card")).toBeTruthy();
    expect(customElements.get("conx-dynamic-panel-card-editor")).toBeTruthy();
  });

  it("renders missing entry message", async () => {
    const el = document.createElement("conx-dynamic-panel-card") as any;
    el.hass = { language: "en", callWS: vi.fn() };
    document.body.appendChild(el);
    // bypass setConfig requirement for render path
    el._config = { type: "custom:conx-dynamic-panel-card", entry_id: "" };
    el.requestUpdate();
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain("entry_id");
  });

  it("loads profiles through websocket only", async () => {
    const callWS = vi.fn().mockResolvedValue({
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
    });
    const el = document.createElement("conx-dynamic-panel-card") as any;
    el.hass = { language: "en", callWS };
    el.setConfig({ type: "custom:conx-dynamic-panel-card", entry_id: "abc" });
    document.body.appendChild(el);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;
    expect(callWS).toHaveBeenCalledWith({
      type: "conx_dynamic_panel/get_config",
      entry_id: "abc",
    });
    expect(el.shadowRoot?.textContent).toContain("Kitchen");
    expect(el.shadowRoot?.textContent).toContain("Living room");
  });

  it("keeps RTL direction for Hebrew", async () => {
    const callWS = vi.fn().mockResolvedValue({
      entry_id: "abc",
      panel_name: "מטבח",
      adapter_type: "zemismart_4gang",
      active_profile_id: "lighting",
      sync_status: "synced",
      last_sync: null,
      last_error: null,
      auto_sync: false,
      capabilities: {
        colors: ["cyan"],
        radar: ["30s"],
        modes: ["toggle"],
        button_count: 4,
      },
      profiles: { lighting: sampleProfile },
      applied_snapshot: {},
    });
    const el = document.createElement("conx-dynamic-panel-card") as any;
    el.hass = { language: "he", locale: { language: "he" }, callWS };
    el.setConfig({ type: "custom:conx-dynamic-panel-card", entry_id: "abc" });
    document.body.appendChild(el);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;
    const card = el.shadowRoot?.querySelector("ha-card");
    expect(card?.getAttribute("dir")).toBe("rtl");
  });

  it("edits draft locally without websocket writes until save", async () => {
    const callWS = vi.fn().mockResolvedValue({
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
    });
    const el = document.createElement("conx-dynamic-panel-card") as any;
    el.hass = { language: "en", callWS };
    el.setConfig({ type: "custom:conx-dynamic-panel-card", entry_id: "abc" });
    document.body.appendChild(el);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;

    const before = callWS.mock.calls.length;
    el._updateButton(1, { name: "Edited locally" });
    el.requestUpdate();
    await el.updateComplete;
    expect(el._dirty).toBe(true);
    expect(callWS.mock.calls.length).toBe(before);
    expect(el.shadowRoot?.textContent).toContain("unsaved draft changes");
  });

  it("requests sync through websocket and shows errors", async () => {
    const callWS = vi
      .fn()
      .mockResolvedValueOnce({
        entry_id: "abc",
        panel_name: "Kitchen",
        adapter_type: "zemismart_4gang",
        active_profile_id: "lighting",
        sync_status: "pending",
        last_sync: null,
        last_error: null,
        auto_sync: false,
        capabilities: {
          colors: ["cyan"],
          radar: ["30s"],
          modes: ["toggle"],
          button_count: 4,
        },
        profiles: { lighting: sampleProfile },
        applied_snapshot: {},
      })
      .mockRejectedValueOnce(new Error("Timed out waiting for text.n1"))
      .mockResolvedValueOnce({
        entry_id: "abc",
        panel_name: "Kitchen",
        adapter_type: "zemismart_4gang",
        active_profile_id: "lighting",
        sync_status: "error",
        last_sync: null,
        last_error: "Timed out waiting for text.n1",
        auto_sync: false,
        capabilities: {
          colors: ["cyan"],
          radar: ["30s"],
          modes: ["toggle"],
          button_count: 4,
        },
        profiles: { lighting: sampleProfile },
        applied_snapshot: {},
      });

    const el = document.createElement("conx-dynamic-panel-card") as any;
    el.hass = { language: "en", callWS };
    el.setConfig({ type: "custom:conx-dynamic-panel-card", entry_id: "abc" });
    document.body.appendChild(el);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;

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
    const callWS = vi.fn().mockResolvedValue({
      entry_id: "abc",
      panel_name: "Kitchen",
      adapter_type: "zemismart_4gang",
      active_profile_id: "lighting",
      sync_status: "synced",
      last_sync: null,
      last_error: null,
      auto_sync: false,
      capabilities: {
        colors: ["cyan"],
        radar: ["30s"],
        modes: ["toggle"],
        button_count: 4,
      },
      profiles: { lighting: sampleProfile },
      applied_snapshot: {},
    });
    const el = document.createElement("conx-dynamic-panel-card") as any;
    el.hass = { language: "en", callWS };
    el.setConfig({
      type: "custom:conx-dynamic-panel-card",
      entry_id: "abc",
      compact: true,
    });
    document.body.appendChild(el);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector("ha-card")?.classList.contains("compact")).toBe(
      true
    );
  });
});
