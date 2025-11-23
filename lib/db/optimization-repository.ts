/**
 * Optimization Opportunities Repository
 *
 * Handles database operations for optimizations table.
 * Stores calculated savings opportunities and recommendations.
 *
 * Features:
 * - Type-safe JSONB calculation breakdowns
 * - Priority-based sorting
 * - Confidence level tracking
 * - Contact information storage
 */

import { logger } from "@/lib/observability/logger";
import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type OptimizationRow = Database["public"]["Tables"]["optimizations"]["Row"];
type OptimizationInsert =
  Database["public"]["Tables"]["optimizations"]["Insert"];
type OptimizationUpdate =
  Database["public"]["Tables"]["optimizations"]["Update"];

export type OpportunityType =
  | "compactor_monitors"
  | "contamination_reduction"
  | "bulk_subscription"
  | "other";

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export interface CalculationBreakdown {
  // Compactor optimization
  current_avg_tons_per_haul?: number;
  target_tons_per_haul?: number;
  capacity_utilization_current?: number;
  current_annual_hauls?: number;
  optimized_annual_hauls?: number;
  hauls_eliminated?: number;
  cost_per_haul?: number;
  gross_annual_savings?: number;
  installation_cost?: number;
  annual_monitoring_cost?: number;
  net_year1_savings?: number;
  net_annual_savings_year2plus?: number;
  roi_percent?: number;
  payback_months?: number;

  // Contamination reduction
  current_contamination_cost?: number;
  contamination_percent?: number;
  reduction_potential?: number;
  estimated_annual_savings?: number;

  // Bulk subscription
  current_monthly_average?: number;
  subscription_cost?: number;
  annual_savings?: number;

  // Custom fields
  [key: string]: any;
}

export interface ContactInfo {
  vendor_name?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface OptimizationRecord {
  id?: string;
  project_id: string;
  opportunity_type: OpportunityType;
  recommend: boolean;
  priority?: number; // 1-5, where 1 is highest
  title: string;
  description?: string;
  calculation_breakdown: CalculationBreakdown;
  contact_info?: ContactInfo;
  implementation_timeline?: string;
  confidence?: Confidence;
}

export class OptimizationRepository {
  private supabase: SupabaseClient<Database>;

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase as SupabaseClient<Database>;
  }

  /**
   * Create a new optimization opportunity
   */
  async create(
    optimization: OptimizationRecord,
  ): Promise<{ data: OptimizationRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("optimizations")
        .insert(this.toInsert(optimization))
        .select()
        .single();

      if (error) {
        logger.error(
          "Failed to create optimization",
          new Error(error.message),
          {
            project_id: optimization.project_id,
            opportunity_type: optimization.opportunity_type,
          },
        );
        return { data: null, error: error.message };
      }

      logger.info("Optimization created", {
        id: data.id,
        project_id: optimization.project_id,
        type: optimization.opportunity_type,
        recommend: optimization.recommend,
      });

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Optimization creation exception", error as Error);
      return { data: null, error: message };
    }
  }

  /**
   * Batch create multiple optimizations
   */
  async batchCreate(
    optimizations: OptimizationRecord[],
  ): Promise<{ data: OptimizationRow[]; error: string | null }> {
    if (optimizations.length === 0) {
      return { data: [], error: null };
    }

    try {
      const inserts = optimizations.map((opt) => this.toInsert(opt));

      const { data, error } = await this.supabase
        .from("optimizations")
        .insert(inserts)
        .select();

      if (error) {
        logger.error(
          "Failed to batch create optimizations",
          new Error(error.message),
          {
            count: optimizations.length,
          },
        );
        return { data: [], error: error.message };
      }

      logger.info("Optimizations batch created", {
        count: data?.length || 0,
      });

      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Optimization batch creation exception", error as Error);
      return { data: [], error: message };
    }
  }

  /**
   * Get all optimizations for a project
   */
  async getByProjectId(
    projectId: string,
  ): Promise<{ data: OptimizationRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("optimizations")
        .select("*")
        .eq("project_id", projectId)
        .order("priority", { ascending: true }) // Priority 1 is highest
        .order("created_at", { ascending: false });

      if (error) {
        logger.error(
          "Failed to fetch optimizations",
          new Error(error.message),
          { project_id: projectId },
        );
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Optimization fetch exception", error as Error);
      return { data: [], error: message };
    }
  }

  /**
   * Get recommended optimizations for a project
   */
  async getRecommendedByProjectId(
    projectId: string,
  ): Promise<{ data: OptimizationRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("optimizations")
        .select("*")
        .eq("project_id", projectId)
        .eq("recommend", true)
        .order("priority", { ascending: true });

      if (error) {
        logger.error(
          "Failed to fetch recommended optimizations",
          new Error(error.message),
          {
            project_id: projectId,
          },
        );
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Recommended optimization fetch exception", error as Error);
      return { data: [], error: message };
    }
  }

  /**
   * Get optimizations by type
   */
  async getByType(
    projectId: string,
    type: OpportunityType,
  ): Promise<{ data: OptimizationRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("optimizations")
        .select("*")
        .eq("project_id", projectId)
        .eq("opportunity_type", type);

      if (error) {
        logger.error(
          "Failed to fetch optimizations by type",
          new Error(error.message),
          {
            project_id: projectId,
            type,
          },
        );
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Optimization type fetch exception", error as Error);
      return { data: [], error: message };
    }
  }

  /**
   * Update an optimization
   */
  async update(
    id: string,
    updates: Partial<OptimizationRecord>,
  ): Promise<{ data: OptimizationRow | null; error: string | null }> {
    try {
      const updateData: OptimizationUpdate = {};

      if (updates.recommend !== undefined)
        updateData.recommend = updates.recommend;
      if (updates.priority !== undefined)
        updateData.priority = updates.priority;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.calculation_breakdown !== undefined)
        updateData.calculation_breakdown = updates.calculation_breakdown as any;
      if (updates.contact_info !== undefined)
        updateData.contact_info = updates.contact_info as any;
      if (updates.implementation_timeline !== undefined)
        updateData.implementation_timeline = updates.implementation_timeline;
      if (updates.confidence !== undefined)
        updateData.confidence = updates.confidence;

      const { data, error } = await this.supabase
        .from("optimizations")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error(
          "Failed to update optimization",
          new Error(error.message),
          { id },
        );
        return { data: null, error: error.message };
      }

      logger.info("Optimization updated", { id });
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Optimization update exception", error as Error);
      return { data: null, error: message };
    }
  }

  /**
   * Delete an optimization
   */
  async delete(
    id: string,
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from("optimizations")
        .delete()
        .eq("id", id);

      if (error) {
        logger.error(
          "Failed to delete optimization",
          new Error(error.message),
          { id },
        );
        return { success: false, error: error.message };
      }

      logger.info("Optimization deleted", { id });
      return { success: true, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Optimization delete exception", error as Error);
      return { success: false, error: message };
    }
  }

  /**
   * Delete all optimizations for a project
   */
  async deleteByProjectId(
    projectId: string,
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from("optimizations")
        .delete()
        .eq("project_id", projectId);

      if (error) {
        logger.error(
          "Failed to delete project optimizations",
          new Error(error.message),
          { project_id: projectId },
        );
        return { success: false, error: error.message };
      }

      logger.info("Project optimizations deleted", { project_id: projectId });
      return { success: true, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Project optimization delete exception", error as Error);
      return { success: false, error: message };
    }
  }

  /**
   * Calculate total potential savings for a project
   */
  async getTotalSavings(
    projectId: string,
  ): Promise<{ total: number; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("optimizations")
        .select("calculation_breakdown")
        .eq("project_id", projectId)
        .eq("recommend", true);

      if (error) {
        logger.error(
          "Failed to calculate total savings",
          new Error(error.message),
          { project_id: projectId },
        );
        return { total: 0, error: error.message };
      }

      if (!data || data.length === 0) {
        return { total: 0, error: null };
      }

      // Sum up savings from all recommended optimizations
      const total = data.reduce(
        (sum: number, opt: { calculation_breakdown: unknown }) => {
          const breakdown = opt.calculation_breakdown as CalculationBreakdown;
          const savings =
            breakdown.net_annual_savings_year2plus ||
            breakdown.net_year1_savings ||
            breakdown.gross_annual_savings ||
            breakdown.estimated_annual_savings ||
            breakdown.annual_savings ||
            0;
          return sum + savings;
        },
        0,
      );

      return { total, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Total savings calculation exception", error as Error);
      return { total: 0, error: message };
    }
  }

  /**
   * Convert OptimizationRecord to database insert format
   */
  private toInsert(optimization: OptimizationRecord): OptimizationInsert {
    return {
      project_id: optimization.project_id,
      opportunity_type: optimization.opportunity_type,
      recommend: optimization.recommend,
      priority: optimization.priority,
      title: optimization.title,
      description: optimization.description,
      calculation_breakdown: optimization.calculation_breakdown as any,
      contact_info: optimization.contact_info as any,
      implementation_timeline: optimization.implementation_timeline,
      confidence: optimization.confidence,
    };
  }
}
