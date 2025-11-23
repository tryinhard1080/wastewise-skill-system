import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, type AdminRequest } from "@/lib/middleware/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const querySchema = z.object({
  period: z.enum(["24h", "7d", "30d", "90d"]).default("7d"),
});

async function handleGET(req: AdminRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const params = querySchema.parse({
      period: searchParams.get("period") || "7d",
    });

    const supabase = await createClient();

    // Calculate date range
    const now = new Date();
    const periodMap = {
      "24h": 1,
      "7d": 7,
      "30d": 30,
      "90d": 90,
    };
    const daysAgo = periodMap[params.period];
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Total users
    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const totalUsers = allUsers?.users.length || 0;

    // Active users (users with recent activity)
    const { data: activeJobs } = await supabase
      .from("analysis_jobs")
      .select("user_id")
      .gte("created_at", startDate.toISOString());

    const uniqueActiveUsers = new Set(activeJobs?.map((j: any) => j.user_id))
      .size;

    // Jobs processed
    const { data: jobs } = await supabase
      .from("analysis_jobs")
      .select(
        "status, created_at, ai_tokens_input, ai_tokens_output, ai_cost_usd, ai_requests",
      )
      .gte("created_at", startDate.toISOString());

    const jobStats = {
      total: jobs?.length || 0,
      completed: jobs?.filter((j: any) => j.status === "completed").length || 0,
      failed: jobs?.filter((j: any) => j.status === "failed").length || 0,
      pending: jobs?.filter((j: any) => j.status === "pending").length || 0,
      processing:
        jobs?.filter((j: any) => j.status === "processing").length || 0,
    };

    // AI usage (aggregate token counts and costs)
    const aiUsage = jobs?.reduce(
      (acc: any, job: any) => {
        acc.totalTokensInput += job.ai_tokens_input || 0;
        acc.totalTokensOutput += job.ai_tokens_output || 0;
        acc.totalCost += job.ai_cost_usd || 0;
        acc.apiCalls += job.ai_requests || 0;
        return acc;
      },
      { totalTokensInput: 0, totalTokensOutput: 0, totalCost: 0, apiCalls: 0 },
    ) || {
      totalTokensInput: 0,
      totalTokensOutput: 0,
      totalCost: 0,
      apiCalls: 0,
    };

    // Storage usage
    const { data: files } = await supabase
      .from("project_files")
      .select("file_size");

    const storageUsage = {
      totalFiles: files?.length || 0,
      totalBytes:
        files?.reduce((sum: number, f: any) => sum + (f.file_size || 0), 0) ||
        0,
      totalMB: Math.round(
        (files?.reduce((sum: number, f: any) => sum + (f.file_size || 0), 0) ||
          0) /
          (1024 * 1024),
      ),
    };

    // Projects created
    const { data: projects } = await supabase
      .from("projects")
      .select("created_at, status")
      .gte("created_at", startDate.toISOString());

    const projectStats = {
      total: projects?.length || 0,
      completed:
        projects?.filter((p: any) => p.status === "completed").length || 0,
      processing:
        projects?.filter((p: any) => p.status === "processing").length || 0,
      failed: projects?.filter((p: any) => p.status === "failed").length || 0,
    };

    return NextResponse.json({
      period: params.period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      users: {
        total: totalUsers,
        active: uniqueActiveUsers,
      },
      jobs: jobStats,
      projects: projectStats,
      aiUsage,
      storage: storageUsage,
    });
  } catch (error) {
    console.error("System metrics error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch metrics",
        code: "METRICS_FETCH_FAILED",
      },
      { status: 500 },
    );
  }
}

export const GET = requireAdmin(handleGET);
