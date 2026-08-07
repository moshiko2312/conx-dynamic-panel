import { describe, expect, it } from "vitest";
import { formatActionSlotSummary } from "../src/actionSlotSummary";

describe("formatActionSlotSummary", () => {
  it("returns not-set label when action is empty", () => {
    expect(formatActionSlotSummary("", "", "Not set")).toBe("Not set");
    expect(formatActionSlotSummary("  ", "light.salon", "Not set")).toBe(
      "Not set"
    );
  });

  it("returns service only when entity is missing", () => {
    expect(formatActionSlotSummary("light.toggle", "", "Not set")).toBe(
      "light.toggle"
    );
  });

  it("returns service · entity when both are set", () => {
    expect(
      formatActionSlotSummary("light.toggle", "light.salon_w", "Not set")
    ).toBe("light.toggle · light.salon_w");
  });
});
