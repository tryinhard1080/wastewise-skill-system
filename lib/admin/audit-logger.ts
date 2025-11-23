import { createClient } from "@/lib/supabase/server";

export type AuditAction =
  | "user.view"
  | "user.disable"
  | "user.enable"
  | "user.delete"
  | "user.role_change"
  | "job.view"
  | "job.retry"
  | "job.cancel"
  | "job.delete"
  | "skill.view"
  | "skill.update"
  | "system.health_check"
  | "system.metrics_view"
  | "admin.unauthorized_access_attempt";

export type AuditLogEntry = {
  adminUserId: string;
  action: AuditAction;
  resourceType: "user" | "job" | "skill" | "project" | "system";
  resourceId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
};

export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("admin_audit_log").insert({
      admin_user_id: entry.adminUserId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      changes: entry.changes || null,
      metadata: entry.metadata || null,
    });

    if (error) {
      console.error("Failed to log admin action:", error);
      // Don't throw - audit logging failures shouldn't break admin operations
    }
  } catch (error) {
    console.error("Error in logAdminAction:", error);
    // Silent failure - don't break admin operations
  }
}

export type AuditLogFilters = {
  adminUserId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
};

export async function getAuditLog(filters: AuditLogFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.adminUserId) {
    query = query.eq("admin_user_id", filters.adminUserId);
  }

  if (filters.resourceType) {
    query = query.eq("resource_type", filters.resourceType);
  }

  if (filters.resourceId) {
    query = query.eq("resource_id", filters.resourceId);
  }

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate.toISOString());
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate.toISOString());
  }

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    logs: data || [],
    total: count || 0,
    limit,
    offset,
  };
}
