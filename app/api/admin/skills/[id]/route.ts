import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  type AdminRequest,
} from "@/lib/middleware/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/audit-logger";
import { z } from "zod";

const updateSchema = z.object({
  conversion_rates: z.record(z.number()).optional(),
  thresholds: z.record(z.number()).optional(),
  enabled: z.boolean().optional(),
});

async function handleGET(
  req: AdminRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: skill, error } = await supabase
      .from("skills_config")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !skill) {
      return NextResponse.json(
        { error: "Skill config not found", code: "SKILL_NOT_FOUND" },
        { status: 404 },
      );
    }

    await logAdminAction({
      adminUserId: req.adminUserId,
      action: "skill.view",
      resourceType: "skill",
      resourceId: id,
    });

    return NextResponse.json({ skill });
  } catch (error) {
    console.error("Admin skill detail error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch skill",
        code: "SKILL_FETCH_FAILED",
      },
      { status: 500 },
    );
  }
}

async function handlePATCH(
  req: AdminRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const update = updateSchema.parse(body);

    const supabase = await createClient();

    // Get current config
    const { data: current, error: fetchError } = await supabase
      .from("skills_config")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json(
        { error: "Skill config not found", code: "SKILL_NOT_FOUND" },
        { status: 404 },
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
      last_validated: null, // Mark as needing validation
    };

    if (update.conversion_rates) {
      updateData.conversion_rates = update.conversion_rates;
    }

    if (update.thresholds) {
      updateData.thresholds = update.thresholds;
    }

    if (update.enabled !== undefined) {
      updateData.enabled = update.enabled;
    }

    // Update config
    const { error: updateError } = await supabase
      .from("skills_config")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    // Log action with changes
    await logAdminAction({
      adminUserId: req.adminUserId,
      action: "skill.update",
      resourceType: "skill",
      resourceId: id,
      changes: {
        conversion_rates: {
          from: current.conversion_rates,
          to: update.conversion_rates || current.conversion_rates,
        },
        thresholds: {
          from: current.thresholds,
          to: update.thresholds || current.thresholds,
        },
        enabled: {
          from: current.enabled,
          to: update.enabled !== undefined ? update.enabled : current.enabled,
        },
      },
      metadata: {
        skillName: current.skill_name,
        warning:
          "CRITICAL: Skill configuration changed. Run evals to validate calculations!",
      },
    });

    return NextResponse.json({
      success: true,
      warning:
        "Skill configuration updated. IMPORTANT: Run calculation evals to ensure formulas still match reference implementation.",
    });
  } catch (error) {
    console.error("Admin skill update error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update skill",
        code: "SKILL_UPDATE_FAILED",
      },
      { status: 500 },
    );
  }
}

export const GET = requireSuperAdmin(handleGET);
export const PATCH = requireSuperAdmin(handlePATCH);
