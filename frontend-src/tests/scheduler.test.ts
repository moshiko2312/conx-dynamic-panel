import { describe, expect, it } from "vitest";
import {
  findScheduleConflicts,
  minutesCovered,
  normalizeConditions,
  parseHhmm,
  tasksAffectingEntry,
  type SchedulerTask,
} from "../src/scheduler";

describe("scheduler conflicts", () => {
  it("blocks different profiles on overlapping times", () => {
    const tasks: SchedulerTask[] = [
      {
        id: "a",
        name: "A",
        enabled: true,
        weekdays: [0, 1, 2, 3, 4],
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        ranges: [{ start: "08:00", end: "12:00", profile_id: "lighting" }],
      },
      {
        id: "b",
        name: "B",
        enabled: true,
        weekdays: [0, 1, 2, 3, 4],
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        ranges: [{ start: "10:00", end: "14:00", profile_id: "scenes" }],
      },
    ];
    expect(findScheduleConflicts(tasks)).toHaveLength(1);
  });

  it("allows same profile overlap", () => {
    const tasks: SchedulerTask[] = [
      {
        id: "a",
        name: "A",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "08:00", end: "12:00", profile_id: "lighting" }],
      },
      {
        id: "b",
        name: "B",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "10:00", end: "14:00", profile_id: "lighting" }],
      },
    ];
    expect(findScheduleConflicts(tasks)).toHaveLength(0);
  });

  it("allows adjacent ranges that share an exclusive end boundary", () => {
    const tasks: SchedulerTask[] = [
      {
        id: "morning",
        name: "Morning",
        enabled: true,
        weekdays: [0, 1, 2, 3, 4],
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        ranges: [{ start: "08:00", end: "12:00", profile_id: "lighting" }],
      },
      {
        id: "evening",
        name: "Evening",
        enabled: true,
        weekdays: [0, 1, 2, 3, 4],
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        ranges: [{ start: "12:00", end: "17:00", profile_id: "scenes" }],
      },
    ];
    expect(findScheduleConflicts(tasks)).toHaveLength(0);
  });

  it("still conflicts on true overlap past a shared boundary", () => {
    const tasks: SchedulerTask[] = [
      {
        id: "a",
        name: "A",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "08:00", end: "13:00", profile_id: "lighting" }],
      },
      {
        id: "b",
        name: "B",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "12:00", end: "17:00", profile_id: "scenes" }],
      },
    ];
    expect(findScheduleConflicts(tasks)).toHaveLength(1);
  });

  it("handles overnight ranges with exclusive end", () => {
    const covered = minutesCovered(parseHhmm("22:00"), parseHhmm("06:00"));
    expect(covered.has(22 * 60)).toBe(true);
    expect(covered.has(23 * 60)).toBe(true);
    expect(covered.has(3 * 60)).toBe(true);
    expect(covered.has(5 * 60 + 59)).toBe(true);
    expect(covered.has(6 * 60)).toBe(false);
    expect(covered.has(12 * 60)).toBe(false);
  });

  it("allows overnight adjacent to morning at exclusive end", () => {
    const tasks: SchedulerTask[] = [
      {
        id: "night",
        name: "Night",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "22:00", end: "06:00", profile_id: "lighting" }],
      },
      {
        id: "morning",
        name: "Morning",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "06:00", end: "12:00", profile_id: "scenes" }],
      },
    ];
    expect(findScheduleConflicts(tasks)).toHaveLength(0);
  });

  it("still conflicts when tasks have conditions (static time check)", () => {
    const tasks: SchedulerTask[] = [
      {
        id: "a",
        name: "A",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "08:00", end: "13:00", profile_id: "lighting" }],
        conditions: [{ entity_id: "binary_sensor.a", operator: "eq", value: "on" }],
      },
      {
        id: "b",
        name: "B",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "12:00", end: "17:00", profile_id: "scenes" }],
        conditions: [{ entity_id: "binary_sensor.b", operator: "eq", value: "off" }],
      },
    ];
    expect(findScheduleConflicts(tasks)).toHaveLength(1);
  });

  it("merges local and master tasks for an entry", () => {
    const locals: SchedulerTask[] = [
      {
        id: "local",
        name: "Local",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "08:00", end: "12:00", profile_id: "lighting" }],
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
        ranges: [{ start: "18:00", end: "22:00", profile_id: "scenes" }],
        scope: "master",
        entry_ids: ["entry-1", "entry-2"],
      },
      {
        id: "other",
        name: "Other",
        enabled: true,
        weekdays: [0],
        months: [1],
        ranges: [{ start: "10:00", end: "11:00", profile_id: "scenes" }],
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
          ranges: [{ start: "08:00", end: "12:00", profile_id: "lighting" }],
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
