/** Client-side scheduler helpers (conflict checks mirror the backend engine). */

export type ScheduleConditionOperator = "eq" | "neq" | "gt" | "lt" | "gte" | "lte";

export interface ScheduleRange {
  start: string;
  end: string;
  profile_id: string;
}

export interface ScheduleCondition {
  entity_id: string;
  operator: ScheduleConditionOperator;
  value: string;
}

export type SchedulerScope = "local" | "master";

export interface SchedulerTask {
  id: string;
  name: string;
  enabled: boolean;
  /** Monday=0 … Sunday=6 */
  weekdays: number[];
  /** 1–12 */
  months: number[];
  ranges: ScheduleRange[];
  notes?: string;
  scope?: SchedulerScope;
  /** Master tasks only: targeted panel entry IDs. */
  entry_ids?: string[];
  /** Structured HA entity conditions (empty = always active when time matches). */
  conditions?: ScheduleCondition[];
}

export interface ScheduleConflict {
  task_a_id: string;
  task_a_name: string;
  range_a: ScheduleRange;
  task_b_id: string;
  task_b_name: string;
  range_b: ScheduleRange;
  weekdays: number[];
  months: number[];
  message: string;
}

export interface PanelSummary {
  entry_id: string;
  panel_name: string;
}

const MINUTES_PER_DAY = 24 * 60;

export const WEEKDAY_KEYS = [
  "scheduler.day_mon",
  "scheduler.day_tue",
  "scheduler.day_wed",
  "scheduler.day_thu",
  "scheduler.day_fri",
  "scheduler.day_sat",
  "scheduler.day_sun",
] as const;

export const CONDITION_OPERATORS: ScheduleConditionOperator[] = [
  "eq",
  "neq",
  "gt",
  "lt",
  "gte",
  "lte",
];

export function parseHhmm(value: string): number {
  const text = String(value || "").trim();
  if (!/^\d{2}:\d{2}$/.test(text)) {
    throw new Error(`Invalid time '${value}'`);
  }
  const [h, m] = text.split(":").map((part) => Number(part));
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Invalid time '${value}'`);
  }
  return h * 60 + m;
}

/** Clock minutes in ``[start, end)``; overnight when start > end. */
export function minutesCovered(start: number, end: number): Set<number> {
  const s = ((start % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const e = ((end % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const out = new Set<number>();
  if (s === e) {
    out.add(s);
    return out;
  }
  if (s < e) {
    for (let i = s; i < e; i += 1) out.add(i);
    return out;
  }
  for (let i = s; i < MINUTES_PER_DAY; i += 1) out.add(i);
  for (let i = 0; i < e; i += 1) out.add(i);
  return out;
}

function rangesOverlapClock(a: ScheduleRange, b: ScheduleRange): boolean {
  const coveredA = minutesCovered(parseHhmm(a.start), parseHhmm(a.end));
  const coveredB = minutesCovered(parseHhmm(b.start), parseHhmm(b.end));
  for (const minute of coveredA) {
    if (coveredB.has(minute)) return true;
  }
  return false;
}

/**
 * Static timeline conflicts only. Conditions are runtime and do not remove
 * conflicts — overlapping enabled ranges with different profiles still block.
 */
export function findScheduleConflicts(tasks: SchedulerTask[]): ScheduleConflict[] {
  const enabled = tasks.filter((task) => task.enabled);
  const conflicts: ScheduleConflict[] = [];
  for (let i = 0; i < enabled.length; i += 1) {
    const taskA = enabled[i];
    for (let j = i; j < enabled.length; j += 1) {
      const taskB = enabled[j];
      const sameTask = taskA.id === taskB.id;
      const weekdays = taskA.weekdays.filter((d) => taskB.weekdays.includes(d));
      const months = taskA.months.filter((m) => taskB.months.includes(m));
      if (!weekdays.length || !months.length) continue;
      for (let ra = 0; ra < taskA.ranges.length; ra += 1) {
        const rangeA = taskA.ranges[ra];
        const startB = sameTask ? ra + 1 : 0;
        for (let rb = startB; rb < taskB.ranges.length; rb += 1) {
          const rangeB = taskB.ranges[rb];
          if (rangeA.profile_id === rangeB.profile_id) continue;
          if (!rangesOverlapClock(rangeA, rangeB)) continue;
          conflicts.push({
            task_a_id: taskA.id,
            task_a_name: taskA.name,
            range_a: rangeA,
            task_b_id: taskB.id,
            task_b_name: taskB.name,
            range_b: rangeB,
            weekdays,
            months,
            message: `Conflict: '${taskA.name}' (${rangeA.start}–${rangeA.end} → ${rangeA.profile_id}) overlaps '${taskB.name}' (${rangeB.start}–${rangeB.end} → ${rangeB.profile_id})`,
          });
        }
      }
    }
  }
  return conflicts;
}

/** Tasks that affect a single panel (locals + masters targeting it). */
export function tasksAffectingEntry(
  localTasks: SchedulerTask[],
  masterTasks: SchedulerTask[],
  entryId: string
): SchedulerTask[] {
  return [
    ...localTasks.filter((task) => (task.scope || "local") !== "master"),
    ...masterTasks.filter(
      (task) =>
        (task.scope || "master") === "master" && (task.entry_ids || []).includes(entryId)
    ),
  ];
}

export function normalizeConditions(conditions: ScheduleCondition[] | undefined): ScheduleCondition[] {
  if (!conditions?.length) return [];
  return conditions
    .map((item) => ({
      entity_id: String(item.entity_id || "").trim(),
      operator: (item.operator || "eq") as ScheduleConditionOperator,
      value: String(item.value ?? ""),
    }))
    .filter((item) => Boolean(item.entity_id));
}

export function emptyCondition(): ScheduleCondition {
  return { entity_id: "", operator: "eq", value: "" };
}

export function newSchedulerTaskId(prefix = "task"): string {
  return `${prefix}_${Date.now().toString(36)}`;
}

export function emptySchedulerTask(
  profileId: string,
  alternateProfileId?: string
): SchedulerTask {
  return {
    id: newSchedulerTaskId("task"),
    name: "Schedule",
    enabled: true,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    // Prefer a non-default profile when available so the faceplate next-row
    // can show a real profile change after save.
    ranges: [
      {
        start: "08:00",
        end: "17:00",
        profile_id: alternateProfileId || profileId,
      },
    ],
    notes: "",
    scope: "local",
    entry_ids: [],
    conditions: [],
  };
}

export function emptyMasterSchedulerTask(
  profileId: string,
  entryIds: string[],
  alternateProfileId?: string
): SchedulerTask {
  return {
    ...emptySchedulerTask(profileId, alternateProfileId),
    id: newSchedulerTaskId("master"),
    name: "Master schedule",
    scope: "master",
    entry_ids: [...entryIds],
  };
}
