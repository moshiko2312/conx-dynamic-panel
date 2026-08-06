import { describe, expect, it } from "vitest";
import {
  defaultActionData,
  defaultActionDataYaml,
  nextActionDataPrefill,
  shouldReplaceActionDataYaml,
} from "../src/actionDataDefaults";
import { parseActionData } from "../src/actionDataYaml";

describe("actionDataDefaults", () => {
  it("returns service-specific YAML for common HA services", () => {
    expect(defaultActionDataYaml("light.turn_on")).toContain("brightness_pct");
    expect(defaultActionDataYaml("light.turn_on")).toContain("rgb_color");
    expect(defaultActionDataYaml("cover.set_cover_position")).toBe(
      "position: 50"
    );
    expect(defaultActionDataYaml("climate.set_temperature")).toContain(
      "temperature: 22"
    );
    expect(defaultActionDataYaml("media_player.volume_set")).toBe(
      "volume_level: 0.5"
    );
    expect(defaultActionDataYaml("input_select.select_option")).toBe(
      "option: Morning"
    );
    expect(defaultActionDataYaml("script.turn_on")).toContain("variables");
    expect(defaultActionDataYaml("notify.notify")).toContain("message");
  });

  it("returns empty YAML for toggle / simple services", () => {
    expect(defaultActionDataYaml("light.toggle")).toBe("");
    expect(defaultActionDataYaml("switch.toggle")).toBe("");
    expect(defaultActionDataYaml("cover.open_cover")).toBe("");
    expect(defaultActionDataYaml("button.press")).toBe("");
    expect(defaultActionData("switch.turn_on")).toEqual({});
  });

  it("falls back to domain defaults for unknown services", () => {
    expect(defaultActionDataYaml("light.set_unknown")).toContain(
      "brightness_pct"
    );
    expect(defaultActionDataYaml("climate.set_unknown")).toContain(
      "temperature"
    );
    expect(defaultActionDataYaml("notify.mobile_app_phone")).toContain(
      "message"
    );
  });

  it("parses defaults into plain data objects", () => {
    const light = defaultActionData("light.turn_on");
    expect(light.brightness_pct).toBe(70);
    expect(light.rgb_color).toEqual([255, 200, 120]);
    const cover = defaultActionData("cover.set_cover_position");
    expect(cover).toEqual({ position: 50 });
  });

  it("replaces empty or previous auto-default YAML", () => {
    expect(shouldReplaceActionDataYaml("", undefined)).toBe(true);
    expect(shouldReplaceActionDataYaml("   ", "brightness_pct: 70")).toBe(true);
    expect(
      shouldReplaceActionDataYaml("brightness_pct: 70", "brightness_pct: 70")
    ).toBe(true);
    const prev = defaultActionDataYaml("light.turn_on");
    const roundTrip = parseActionData(prev);
    expect(roundTrip.ok).toBe(true);
    if (!roundTrip.ok) {
      return;
    }
    // Same data, different key order / spacing still counts as auto-default.
    expect(
      shouldReplaceActionDataYaml(
        "rgb_color: [255, 200, 120]\nbrightness_pct: 70",
        prev
      )
    ).toBe(true);
  });

  it("preserves customized YAML that differs from the last auto-default", () => {
    expect(
      shouldReplaceActionDataYaml("brightness_pct: 99", "brightness_pct: 70")
    ).toBe(false);
    expect(
      shouldReplaceActionDataYaml("name: day\nrun: true", undefined)
    ).toBe(false);
  });

  it("nextActionDataPrefill applies or preserves according to rules", () => {
    const first = nextActionDataPrefill("light.turn_on", "", undefined);
    expect(first).not.toBeNull();
    expect(first?.data.brightness_pct).toBe(70);

    const swapped = nextActionDataPrefill(
      "climate.set_temperature",
      first!.yaml,
      first!.yaml
    );
    expect(swapped).not.toBeNull();
    expect(swapped?.data.temperature).toBe(22);

    const custom = nextActionDataPrefill(
      "climate.set_temperature",
      "brightness_pct: 99",
      first!.yaml
    );
    expect(custom).toBeNull();

    const cleared = nextActionDataPrefill("", "brightness_pct: 70", first!.yaml);
    expect(cleared).toEqual({ yaml: "", data: {} });
  });
});
