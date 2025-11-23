import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, type AdminRequest } from "@/lib/middleware/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/audit-logger";

async function handleGET(req: AdminRequest) {
  try {
    const supabase = await createClient();

    const { data: skills, error } = await supabase
      .from("skills_config")
      .select("*")
      .order("skill_name");

    if (error) {
      throw error;
    }

    // Log access
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: "skill.view",
      resourceType: "skill",
    });

    return NextResponse.json({
      skills: skills || [],
      total: skills?.length || 0,
    });
  } catch (error) {
    console.error("Admin skills list error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch skills",
        code: "SKILLS_FETCH_FAILED",
      },
      { status: 500 },
    );
  }
}

export const GET = requireAdmin(handleGET);
