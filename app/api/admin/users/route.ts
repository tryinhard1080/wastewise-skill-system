import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, type AdminRequest } from "@/lib/middleware/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/audit-logger";
import { z } from "zod";

const querySchema = z.object({
  search: z.string().optional(),
  role: z.enum(["user", "admin", "super_admin"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

async function handleGET(req: AdminRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const params = querySchema.parse({
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
      status: searchParams.get("status") || undefined,
      limit: searchParams.get("limit") || "50",
      offset: searchParams.get("offset") || "0",
    });

    const supabase = await createClient();

    // Build query - we need to query auth.users via the admin API
    // Then join with our custom tables
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers({
        page: Math.floor(params.offset / params.limit) + 1,
        perPage: params.limit,
      });

    if (authError) {
      throw authError;
    }

    const userIds = authUsers.users.map((u: any) => u.id);

    // Get role and status data
    const { data: roles } = await supabase
      .from("user_roles")
      .select("*")
      .in("user_id", userIds);

    const { data: statuses } = await supabase
      .from("user_status")
      .select("*")
      .in("user_id", userIds);

    // Get project counts
    const { data: projectCounts } = await supabase
      .from("projects")
      .select("user_id")
      .in("user_id", userIds);

    // Combine data
    let users = authUsers.users.map((user: any) => {
      const userRole = roles?.find((r) => r.user_id === user.id);
      const userStatus = statuses?.find((s) => s.user_id === user.id);
      const projectCount =
        projectCounts?.filter((p) => p.user_id === user.id).length || 0;

      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        role: userRole?.role || "user",
        is_active: userStatus?.is_active ?? true,
        disabled_at: userStatus?.disabled_at,
        disabled_reason: userStatus?.disabled_reason,
        project_count: projectCount,
      };
    });

    // Apply filters
    if (params.search) {
      users = users.filter((u: any) =>
        u.email?.toLowerCase().includes(params.search!.toLowerCase()),
      );
    }

    if (params.role) {
      users = users.filter((u: any) => u.role === params.role);
    }

    if (params.status === "active") {
      users = users.filter((u: any) => u.is_active === true);
    } else if (params.status === "inactive") {
      users = users.filter((u: any) => u.is_active === false);
    }

    // Log access
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: "user.view",
      resourceType: "user",
      metadata: { filters: params },
    });

    return NextResponse.json({
      users,
      total: users.length,
      limit: params.limit,
      offset: params.offset,
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch users",
        code: "USERS_FETCH_FAILED",
      },
      { status: 500 },
    );
  }
}

export const GET = requireAdmin(handleGET);
