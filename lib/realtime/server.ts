import "server-only";

import type { Scope } from "@/lib/access";

type RealtimeAuditEvent = {
  action: string;
  actorId: string | null;
  targetId: string | null;
};

const BROADCAST_ACTIONS = new Set<string>([
  "deposit_bank_created",
  "deposit_bank_updated",
  "deposit_bank_deleted",
  "deposit_bank_toggled",
  "product_created",
  "product_updated",
  "product_deleted",
  "channel_created",
  "channel_updated",
  "channel_deleted",
]);

const ADMIN_WIDE_ACTIONS = new Set<string>([
  "create_admin",
  "update_admin",
  "reset_admin_password",
  "delete_admin",
  "set_staff_leader",
  "set_access_overrides",
  "set_commission_rate",
  "update_commission_setting",
  ...BROADCAST_ACTIONS,
]);

export function shouldDeliverRealtimeEvent(
  scope: Scope,
  event: RealtimeAuditEvent,
): boolean {
  if (BROADCAST_ACTIONS.has(event.action)) {
    return true;
  }

  if (scope.role === "member") {
    return event.targetId === scope.actorId || event.actorId === scope.actorId;
  }

  if (scope.unrestricted) {
    return true;
  }

  if (ADMIN_WIDE_ACTIONS.has(event.action)) {
    return true;
  }

  if (event.actorId === scope.actorId) {
    return true;
  }

  if (!event.targetId || !scope.memberIds?.length) {
    return false;
  }

  return scope.memberIds.includes(event.targetId);
}
