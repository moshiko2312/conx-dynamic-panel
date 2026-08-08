import { describe, expect, it } from "vitest";
import {
  findScheduleConflicts,
  normalizeConditions,
  parseHhmm,
  tasksAffectingEntry,
  type SchedulerTask,
} from "../src/scheduler";

describe("scheduler conflicts", () => {
  it("blocks different profiles at the same start time", () => {
    const tasks: SchedulerTask[] = [
      {
        id: "a",
        name: "A",
        enabled: true,
        weekdays: [0, 1, 2, 3, 4],
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        ranges: [{ start: "08:00", profile_id: "lighting" }],
      },
      {
        id: "b",
        name: "B",
        enabled: true,
        weekdays: [0, 1, 2, 3, 4],
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        ranges: [{ start: "08:00", profile_id: "scenes" }],
      },
    ];
    expect(findScheduleConflicts(tasks)).toHaveLength(1);
  });

  it("allows same profile at the same start time", () => {
    const tasks: SchedulerTask[] = [
      {
        id: "a",
        name: "A",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "08:00", profile_id: "lighting" }],
      },
      {
        id: "b",
        name: "B",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "08:00", profile_id: "lighting" }],
      },
    ];
    expect(findScheduleConflicts(tasks)).toHaveLength(0);
  });

  it("never conflicts when start times differ — no more duration overlap", () => {
    const tasks: SchedulerTask[] = [
      {
        id: "morning",
        name: "Morning",
        enabled: true,
        weekdays: [0, 1, 2, 3, 4],
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        ranges: [{ start: "08:00", profile_id: "lighting" }],
      },
      {
        id: "evening",
        name: "Evening",
        enabled: true,
        weekdays: [0, 1, 2, 3, 4],
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        ranges: [{ start: "12:00", profile_id: "scenes" }],
      },
    ];
    expect(findScheduleConflicts(tasks)).toHaveLength(0);
  });

  it("still conflicts when tasks have conditions (static check ignores them)", () => {
    const tasks: SchedulerTask[] = [
      {
        id: "a",
        name: "A",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "08:00", profile_id: "lighting" }],
        conditions: [{ entity_id: "binary_sensor.a", operator: "eq", value: "on" }],
      },
      {
        id: "b",
        name: "B",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "08:00", profile_id: "scenes" }],
        conditions: [{ entity_id: "binary_sensor.b", operator: "eq", value: "off" }],
      },
    ];
    expect(findScheduleConflicts(tasks)).toHaveLength(1);
  });

  it("no conflict when weekdays are disjoint, even at the same start time", () => {
    const tasks: SchedulerTask[] = [
      {
        id: "a",
        name: "A",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "08:00", profile_id: "lighting" }],
      },
      {
        id: "b",
        name: "B",
        enabled: true,
        weekdays: [1],
        months: [1],
        ranges: [{ start: "08:00", profile_id: "scenes" }],
      },
    ];
    expect(findScheduleConflicts(tasks)).toHaveLength(0);
  });

  it("parses HH:MM and rejects invalid input", () => {
    expect(parseHhmm("08:00")).toBe(8 * 60);
    expect(() => parseHhmm("25:00")).toThrow();
    expect(() => parseHhmm("bad")).toThrow();
  });

  it("merges local and master tasks for an entry", () => {
    const locals: SchedulerTask[] = [
      {
        id: "local",
        name: "Local",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "08:00", profile_id: "lighting" }],
        scope: "local",
      },
    ];
    const masters: SchedulerTask[] = [
      {
        id: "master",
        name: "Master",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "18:00", profile_id: "scenes" }],
        scope: "master",
        entry_ids: ["entry-1", "entry-2"],
      },
      {
        id: "other",
        name: "Other",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "10:00", profile_id: "scenes" }],
        scope: "master",
        entry_ids: ["entry-2"],
      },
    ];
    const affecting = tasksAffectingEntry(locals, masters, "entry-1");
    expect(affecting.map((t) => t.id).sort()).toEqual(["local", "master"]);
  });

  it("normalizes empty conditions away", () => {
    expect(
      normalizeConditions([
        { entity_id: "  ", operator: "eq", value: "on" },
        { entity_id: "binary_sensor.x", operator: "neq", value: "off" },
      ])
    ).toEqual([{ entity_id: "binary_sensor.x", operator: "neq", value: "off" }]);
  });
});

describe("scheduler export schema", () => {
  it("validates a portable scheduler payload", async () => {
    const { validateSchedulerExport, SCHEDULER_EXPORT_SCHEMA_VERSION } = await import(
      "../src/exportSchema"
    );
    const result = validateSchedulerExport({
      schema_version: SCHEDULER_EXPORT_SCHEMA_VERSION,
      scope: "scheduler",
      default_profile_id: "lighting",
      scheduler_tasks: {
        morning: {
          id: "morning",
          name: "Morning",
          enabled: true,
          weekdays: [0, 1, 2, 3, 4],
          months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          ranges: [{ start: "08:00", profile_id: "lighting" }],
        },
      },
      master_scheduler_tasks: {},
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.scope).toBe("scheduler");
      expect(result.payload.scheduler_tasks.morning.id).toBe("morning");
    }
  });

  it("accepts a legacy schema_version 1 export with a stale end key", async () => {
    const { validateSchedulerExport } = await import("../src/exportSchema");
    const result = validateSchedulerExport({
      schema_version: 1,
      scope: "scheduler",
      scheduler_tasks: {
        morning: {
          id: "morning",
          name: "Morning",
          enabled: true,
          weekdays: [0, 1, 2, 3, 4],
          months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          ranges: [{ start: "08:00", end: "12:00", profile_id: "lighting" }],
        },
      },
    });
    expect(result.ok).toBe(true);
  });

  it("rejects wrong scope and future schema", async () => {
    const { validateSchedulerExport } = await import("../src/exportSchema");
    expect(validateSchedulerExport({ scope: "profiles", scheduler_tasks: {} }).ok).toBe(
      false
    );
    expect(
      validateSchedulerExport({
        schema_version: 99,
        scope: "scheduler",
        scheduler_tasks: {},
      }).ok
    ).toBe(false);
  });
});
