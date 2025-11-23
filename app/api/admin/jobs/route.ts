import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, type AdminRequest } from "@/lib/middleware/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/audit-logger";
import { z } from "zod";

const querySchema = z.object({
  status: z
    .enum(["pending", "processing", "completed", "failed", "cancelled"])
    .optional(),
  userId: z.string().uuid().optional(),
  jobType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

async function handleGET(req: AdminRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const params = querySchema.parse({
      status: searchParams.get("status") || undefined,
      userId: searchParams.get("userId") || undefined,
      jobType: searchParams.get("jobType") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      limit: searchParams.get("limit") || "50",
      offset: searchParams.get("offset") || "0",
    });

    const supabase = await createClient();

    let query = supabase.from("analysis_jobs").select(
      `
        *
      `,
      { count: "exact" },
    );

    // Apply filters
    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.userId) {
      query = query.eq("user_id", params.userId);
    }

    if (params.jobType) {
      query = query.eq("job_type", params.jobType);
    }

    if (params.startDate) {
      query = query.gte("created_at", params.startDate);
    }

    if (params.endDate) {
      query = query.lte("created_at", params.endDate);
    }

    // Pagination
    query = query
      .range(params.offset, params.offset + params.limit - 1)
      .order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Enrich with user emails and project names
    const enrichedJobs = await Promise.all(
      (data || []).map(async (job: any) => {
        const {
          data: { user },
        } = await supabase.auth.admin.getUserById(job.user_id);

        const { data: project } = await supabase
          .from("projects")
          .select("property_name, units")
          .eq("id", job.project_id)
          .single();

        return {
          ...job,
          user_email: user?.email,
          project_name: project?.property_name,
          project_units: project?.units,
        };
      }),
    );

    // Log access
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: "job.view",
      resourceType: "job",
      metadata: { filters: params },
    });

    return NextResponse.json({
      jobs: enrichedJobs,
      total: count,
      limit: params.limit,
      offset: params.offset,
    });
  } catch (error) {
    console.error("Admin jobs list error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch jobs",
        code: "JOBS_FETCH_FAILED",
      },
      { status: 500 },
    );
  }
}

export const GET = requireAdmin(handleGET);
