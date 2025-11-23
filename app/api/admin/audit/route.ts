import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, type AdminRequest } from "@/lib/middleware/admin-auth";
import { getAuditLog } from "@/lib/admin/audit-logger";
import { z } from "zod";

const querySchema = z.object({
  adminUserId: z.string().uuid().optional(),
  resourceType: z
    .enum(["user", "job", "skill", "project", "system"])
    .optional(),
  resourceId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

async function handleGET(req: AdminRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const params = querySchema.parse({
      adminUserId: searchParams.get("adminUserId") || undefined,
      resourceType: searchParams.get("resourceType") || undefined,
      resourceId: searchParams.get("resourceId") || undefined,
      action: searchParams.get("action") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      limit: searchParams.get("limit") || "50",
      offset: searchParams.get("offset") || "0",
    });

    const result = await getAuditLog({
      adminUserId: params.adminUserId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      action: params.action,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      limit: params.limit,
      offset: params.offset,
    });

    return NextResponse.json({
      logs: result.logs,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch (error) {
    console.error("Admin audit log error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch audit logs",
        code: "AUDIT_FETCH_FAILED",
      },
      { status: 500 },
    );
  }
}

export const GET = requireAdmin(handleGET);
