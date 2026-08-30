import { supabaseAdmin } from "../config/supabase";
import { logger } from "../config/logger";

/**
 * Unified audit logging.
 * Table: audit_logs (user_id, event_type, resource, metadata, created_at)
 * Root cause of prior bug: auth wrote to `audit_log` while journal wrote to `audit_logs`.
 */
export type AuditEvent = {
  actorId: string;
  action: string;
  resource?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(event: AuditEvent): Promise<void> {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    user_id: event.actorId,
    event_type: event.action,
    resource: event.resource ?? null,
    metadata: event.metadata ?? {}
  });

  if (error) {
    // Never fail the primary request solely because audit logging failed,
    // but surface it loudly so schema drift is visible.
    logger.error({ err: error, event }, "Failed to write audit_logs row");
  }
}
