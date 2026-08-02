export interface AutomationExampleComments {
  alias: string;
  header: string;
  sync: string;
  ids: string;
  morning: string;
  evening: string;
  night: string;
}

export interface AutomationExampleOptions {
  entryId?: string;
  profileIds?: string[];
  comments: AutomationExampleComments;
}

export const AUTOMATION_EXAMPLE_ENTRY_PLACEHOLDER = "YOUR_ENTRY_ID";

const SLOTS = [
  { id: "morning", at: "06:30:00", profile: "morning" },
  { id: "evening", at: "18:00:00", profile: "evening" },
  { id: "night", at: "23:00:00", profile: "night" },
] as const;

function sanitize(value: string | undefined, fallback: string): string {
  const trimmed = (value || "").trim();
  return trimmed ? trimmed : fallback;
}

function commentLines(text: string): string[] {
  return String(text)
    .split("\n")
    .map((line) => `# ${line.trim()}`.trimEnd());
}

/**
 * Copy-ready Home Assistant automation that switches ConX profiles by time of
 * day. Every branch passes `sync: true` because activation alone only updates
 * the stored draft.
 */
export function buildAutomationExampleYaml(
  options: AutomationExampleOptions
): string {
  const { comments } = options;
  const entryId = sanitize(options.entryId, AUTOMATION_EXAMPLE_ENTRY_PLACEHOLDER);
  const slotComments: Record<string, string> = {
    morning: comments.morning,
    evening: comments.evening,
    night: comments.night,
  };
  const profileFor = (index: number) =>
    sanitize(options.profileIds?.[index], SLOTS[index].profile);

  const lines: string[] = [
    ...commentLines(comments.header),
    ...commentLines(comments.sync),
    ...commentLines(comments.ids),
    `alias: ${comments.alias}`,
    "mode: single",
    "triggers:",
  ];
  SLOTS.forEach((slot) => {
    lines.push(`  # ${slotComments[slot.id]}`);
    lines.push("  - trigger: time");
    lines.push(`    at: "${slot.at}"`);
    lines.push(`    id: ${slot.id}`);
  });
  lines.push("actions:");
  lines.push("  - choose:");
  SLOTS.forEach((slot, index) => {
    lines.push("      - conditions:");
    lines.push("          - condition: trigger");
    lines.push(`            id: ${slot.id}`);
    lines.push("        sequence:");
    lines.push("          - action: conx_dynamic_panel.activate_profile");
    lines.push("            data:");
    lines.push(`              entry_id: ${entryId}`);
    lines.push(`              profile_id: ${profileFor(index)}`);
    lines.push("              sync: true");
  });
  return `${lines.join("\n")}\n`;
}
