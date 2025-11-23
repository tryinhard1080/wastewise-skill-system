import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: "ok" | "error";
    storage: "ok" | "error";
  };
  errors?: string[];
}

/**
 * Health Check Endpoint
 *
 * Returns the overall health status of the application.
 * Used by monitoring services, load balancers, and ops teams.
 *
 * @returns 200 if healthy/degraded, 503 if unhealthy
 */
export async function GET() {
  const errors: string[] = [];
  let dbStatus: "ok" | "error" = "ok";
  let storageStatus: "ok" | "error" = "ok";

  try {
    // Check database connectivity
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("projects")
      .select("id")
      .limit(1);

    if (dbError) {
      dbStatus = "error";
      errors.push(`Database: ${dbError.message}`);
    }

    // Check storage connectivity
    const { error: storageError } = await supabase.storage.listBuckets();

    if (storageError) {
      storageStatus = "error";
      errors.push(`Storage: ${storageError.message}`);
    }
  } catch (error) {
    errors.push(
      `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  const result: HealthCheckResult = {
    status:
      errors.length === 0
        ? "healthy"
        : errors.length < 2
          ? "degraded"
          : "unhealthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime(),
    checks: {
      database: dbStatus,
      storage: storageStatus,
    },
    ...(errors.length > 0 && { errors }),
  };

  const statusCode =
    result.status === "healthy"
      ? 200
      : result.status === "degraded"
        ? 200
        : 503;

  return NextResponse.json(result, { status: statusCode });
}
