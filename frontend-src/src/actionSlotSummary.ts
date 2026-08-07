/**
 * Collapsed accordion summary for Action / Double-click action blocks.
 */

export function formatActionSlotSummary(
  action: string,
  entityId: string,
  notSetLabel: string
): string {
  const service = (action || "").trim();
  if (!service) {
    return notSetLabel;
  }
  const entity = (entityId || "").trim();
  return entity ? `${service} · ${entity}` : service;
}
