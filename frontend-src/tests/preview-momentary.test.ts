/**
 * Regression guard for the standalone HTML preview (file://, no HA).
 * Momentary faceplate rings must auto-OFF via renderFaceplate after pulse_time_s.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const PREVIEW_HTML = resolve(
  import.meta.dirname,
  "../../previews/conx-card-preview.html"
);

describe("standalone HTML preview momentary pulse", () => {
  it("auto-off timer refreshes faceplate (not a missing render())", () => {
    const html = readFileSync(PREVIEW_HTML, "utf8");
    const blockMatch = html.match(
      /if \(role === "momentary"\) \{[\s\S]*?\/\/ toggle: independent LED preview only\./
    );
    expect(blockMatch).toBeTruthy();
    const block = blockMatch![0];
    expect(block).toContain("renderFaceplate()");
    expect(block).toMatch(/clampPulseTime\(button && button\.pulse_time_s/);
    expect(block).toMatch(/clearTimeout\(state\.momentaryTimers\[index\]\)/);
    // The original bug: timer called nonexistent render(), so the ring never turned off.
    expect(block).not.toMatch(/\brender\(\);/);
  });

  it("simulates ON → auto-OFF after button pulse_time_s; re-press cancels", () => {
    vi.useFakeTimers();
    const DEFAULT_PULSE_TIME = 2;
    const clampPulseTime = (value: unknown, fallback = DEFAULT_PULSE_TIME) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(600, Math.max(0.1, n));
    };

    const draft = {
      mode: "mixed",
      ringOn: { 1: false } as Record<number, boolean>,
      buttons: [{ index: 1, role: "momentary", pulse_time_s: 0.3 }],
    };
    const state = {
      draft,
      dirty: false,
      momentaryTimers: {} as Record<number, ReturnType<typeof setTimeout>>,
    };
    let faceplateRenders = 0;

    function renderFaceplate() {
      faceplateRenders += 1;
    }

    function handleFaceplatePress(index: number) {
      const d = state.draft;
      if (state.momentaryTimers[index]) {
        clearTimeout(state.momentaryTimers[index]);
        delete state.momentaryTimers[index];
      }
      if (d.ringOn[index]) {
        d.ringOn[index] = false;
        return;
      }
      const button = d.buttons.find((b) => b.index === index);
      const pulseMs = clampPulseTime(button?.pulse_time_s) * 1000;
      d.ringOn[index] = true;
      state.momentaryTimers[index] = setTimeout(() => {
        delete state.momentaryTimers[index];
        if (state.draft) state.draft.ringOn[index] = false;
        renderFaceplate();
      }, pulseMs);
    }

    handleFaceplatePress(1);
    expect(draft.ringOn[1]).toBe(true);
    expect(state.dirty).toBe(false);

    vi.advanceTimersByTime(299);
    expect(draft.ringOn[1]).toBe(true);
    expect(faceplateRenders).toBe(0);

    vi.advanceTimersByTime(1);
    expect(draft.ringOn[1]).toBe(false);
    expect(faceplateRenders).toBe(1);
    expect(state.momentaryTimers[1]).toBeUndefined();

    // Custom pulse from draft (not stale default 2s)
    draft.buttons[0].pulse_time_s = 1.5;
    handleFaceplatePress(1);
    expect(draft.ringOn[1]).toBe(true);
    vi.advanceTimersByTime(1499);
    expect(draft.ringOn[1]).toBe(true);
    vi.advanceTimersByTime(1);
    expect(draft.ringOn[1]).toBe(false);

    // Re-press while armed cancels and turns OFF (no auto timer left).
    handleFaceplatePress(1);
    expect(draft.ringOn[1]).toBe(true);
    handleFaceplatePress(1);
    expect(draft.ringOn[1]).toBe(false);
    expect(state.momentaryTimers[1]).toBeUndefined();
    vi.advanceTimersByTime(2000);
    expect(draft.ringOn[1]).toBe(false);
    expect(state.dirty).toBe(false);

    vi.useRealTimers();
  });
});
