import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin/audit-logger";

export type AdminAuthResult = {
  authorized: boolean;
  userId?: string;
  role?: "user" | "admin" | "super_admin";
  error?: string;
};

export async function checkAdminAuth(
  request: NextRequest,
): Promise<AdminAuthResult> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      error: "Not authenticated",
    };
  }

  // Check user role
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleError || !roleData) {
    return {
      authorized: false,
      error: "No role found",
    };
  }

  if (roleData.role !== "admin" && roleData.role !== "super_admin") {
    // Log unauthorized access attempt
    await logAdminAction({
      adminUserId: user.id,
      action: "admin.unauthorized_access_attempt",
      resourceType: "system",
      metadata: {
        path: request.nextUrl.pathname,
        method: request.method,
      },
    });

    return {
      authorized: false,
      role: roleData.role as "user" | "admin" | "super_admin",
      error: "Insufficient permissions",
    };
  }

  return {
    authorized: true,
    userId: user.id,
    role: roleData.role as "user" | "admin" | "super_admin",
  };
}

export type AdminRequest = NextRequest & {
  adminUserId: string;
  adminRole: "admin" | "super_admin";
};

export function requireAdmin(
  handler: (req: AdminRequest, context?: any) => Promise<Response>,
) {
  return async (req: NextRequest, context?: any) => {
    const authResult = await checkAdminAuth(req);

    if (!authResult.authorized) {
      return NextResponse.json(
        {
          error: authResult.error || "Unauthorized",
          code: "ADMIN_AUTH_REQUIRED",
        },
        { status: 403 },
      );
    }

    // Attach admin info to request
    const adminReq = req as AdminRequest;
    adminReq.adminUserId = authResult.userId!;
    adminReq.adminRole = authResult.role as "admin" | "super_admin";

    return handler(adminReq, context);
  };
}

export function requireSuperAdmin(
  handler: (req: AdminRequest, context?: any) => Promise<Response>,
) {
  return async (req: NextRequest, context?: any) => {
    const authResult = await checkAdminAuth(req);

    if (!authResult.authorized || authResult.role !== "super_admin") {
      return NextResponse.json(
        {
          error: "Super admin access required",
          code: "SUPER_ADMIN_REQUIRED",
        },
        { status: 403 },
      );
    }

    const adminReq = req as AdminRequest;
    adminReq.adminUserId = authResult.userId!;
    adminReq.adminRole = "super_admin";

    return handler(adminReq, context);
  };
}
