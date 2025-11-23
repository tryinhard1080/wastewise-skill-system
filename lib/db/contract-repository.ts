/**
 * Contract Terms Repository
 *
 * Handles database operations for contract_terms table with upsert logic.
 * Contracts can be updated/replaced as new versions are extracted.
 *
 * Features:
 * - Upsert by project_id (one contract per project)
 * - Calendar reminder generation
 * - Clause categorization
 * - Type-safe JSONB handling
 */

import { logger } from "@/lib/observability/logger";
import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type ContractRow = Database["public"]["Tables"]["contract_terms"]["Row"];
type ContractInsert = Database["public"]["Tables"]["contract_terms"]["Insert"];
type ContractUpdate = Database["public"]["Tables"]["contract_terms"]["Update"];

export interface ContractClauses {
  "Term & Renewal"?: string[];
  "Rate Increases"?: string[];
  Termination?: string[];
  Liability?: string[];
  "Service Level"?: string[];
  "Force Majeure"?: string[];
  Indemnification?: string[];
  [key: string]: string[] | undefined;
}

export interface CalendarReminder {
  event: string;
  date: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  description?: string;
}

export interface ContractRecord {
  id?: string;
  project_id: string;
  source_file_id?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  term_length_years?: number;
  clauses: ContractClauses;
  calendar_reminders?: CalendarReminder[];
}

export class ContractRepository {
  private supabase: SupabaseClient<Database>;

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase as SupabaseClient<Database>;
  }

  /**
   * Create or update contract terms for a project
   *
   * Uses upsert logic: If contract exists for project, update it.
   * Otherwise, create new contract.
   */
  async upsert(
    contract: ContractRecord,
  ): Promise<{ data: ContractRow | null; error: string | null }> {
    try {
      // Check if contract exists for this project
      const existing = await this.getByProjectId(contract.project_id);

      if (existing.data) {
        // Update existing contract
        return this.update(existing.data.id, contract);
      } else {
        // Create new contract
        return this.create(contract);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Contract upsert exception", error as Error);
      return { data: null, error: message };
    }
  }

  /**
   * Create a new contract record
   */
  async create(
    contract: ContractRecord,
  ): Promise<{ data: ContractRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("contract_terms")
        .insert(this.toInsert(contract))
        .select()
        .single();

      if (error) {
        logger.error("Failed to create contract", new Error(error.message), {
          project_id: contract.project_id,
        });
        return { data: null, error: error.message };
      }

      logger.info("Contract created", {
        id: data.id,
        project_id: contract.project_id,
        start_date: contract.contract_start_date,
        end_date: contract.contract_end_date,
      });

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Contract creation exception", error as Error);
      return { data: null, error: message };
    }
  }

  /**
   * Update an existing contract
   */
  async update(
    id: string,
    updates: Partial<ContractRecord>,
  ): Promise<{ data: ContractRow | null; error: string | null }> {
    try {
      const updateData: ContractUpdate = {};

      if (updates.source_file_id !== undefined)
        updateData.source_file_id = updates.source_file_id;
      if (updates.contract_start_date !== undefined)
        updateData.contract_start_date = updates.contract_start_date;
      if (updates.contract_end_date !== undefined)
        updateData.contract_end_date = updates.contract_end_date;
      if (updates.term_length_years !== undefined)
        updateData.term_length_years = updates.term_length_years;
      if (updates.clauses !== undefined)
        updateData.clauses = updates.clauses as any;
      if (updates.calendar_reminders !== undefined)
        updateData.calendar_reminders = updates.calendar_reminders as any;

      const { data, error } = await this.supabase
        .from("contract_terms")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error("Failed to update contract", new Error(error.message), {
          id,
        });
        return { data: null, error: error.message };
      }

      logger.info("Contract updated", { id });
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Contract update exception", error as Error);
      return { data: null, error: message };
    }
  }

  /**
   * Get contract for a project
   */
  async getByProjectId(
    projectId: string,
  ): Promise<{ data: ContractRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("contract_terms")
        .select("*")
        .eq("project_id", projectId)
        .single();

      if (error) {
        // Not found is not an error condition for contracts
        if (error.code === "PGRST116") {
          return { data: null, error: null };
        }

        logger.error("Failed to fetch contract", new Error(error.message), {
          project_id: projectId,
        });
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Contract fetch exception", error as Error);
      return { data: null, error: message };
    }
  }

  /**
   * Get all contracts (for admin/reporting)
   */
  async getAll(): Promise<{ data: ContractRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("contract_terms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Failed to fetch all contracts", new Error(error.message));
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Contract fetch all exception", error as Error);
      return { data: [], error: message };
    }
  }

  /**
   * Get contracts expiring within a date range
   */
  async getExpiringContracts(
    startDate: string,
    endDate: string,
  ): Promise<{ data: ContractRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("contract_terms")
        .select("*")
        .gte("contract_end_date", startDate)
        .lte("contract_end_date", endDate)
        .order("contract_end_date", { ascending: true });

      if (error) {
        logger.error(
          "Failed to fetch expiring contracts",
          new Error(error.message),
          {
            start_date: startDate,
            end_date: endDate,
          },
        );
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Expiring contracts fetch exception", error as Error);
      return { data: [], error: message };
    }
  }

  /**
   * Delete a contract
   */
  async delete(
    id: string,
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from("contract_terms")
        .delete()
        .eq("id", id);

      if (error) {
        logger.error("Failed to delete contract", new Error(error.message), {
          id,
        });
        return { success: false, error: error.message };
      }

      logger.info("Contract deleted", { id });
      return { success: true, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Contract delete exception", error as Error);
      return { success: false, error: message };
    }
  }

  /**
   * Delete contract for a project
   */
  async deleteByProjectId(
    projectId: string,
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from("contract_terms")
        .delete()
        .eq("project_id", projectId);

      if (error) {
        logger.error(
          "Failed to delete project contract",
          new Error(error.message),
          { project_id: projectId },
        );
        return { success: false, error: error.message };
      }

      logger.info("Project contract deleted", { project_id: projectId });
      return { success: true, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Project contract delete exception", error as Error);
      return { success: false, error: message };
    }
  }

  /**
   * Generate calendar reminders from contract dates
   *
   * Creates reminders for:
   * - Contract end date (90 days before)
   * - Contract end date (30 days before)
   * - Contract end date (7 days before)
   */
  generateCalendarReminders(contract: ContractRecord): CalendarReminder[] {
    if (!contract.contract_end_date) {
      return [];
    }

    const endDate = new Date(contract.contract_end_date);
    const reminders: CalendarReminder[] = [];

    // 90 days before expiration
    const reminder90 = new Date(endDate);
    reminder90.setDate(reminder90.getDate() - 90);
    reminders.push({
      event: "Contract expiration - 90 day notice",
      date: reminder90.toISOString().split("T")[0],
      priority: "HIGH",
      description: "Begin contract renewal negotiation or vendor RFP process",
    });

    // 30 days before expiration
    const reminder30 = new Date(endDate);
    reminder30.setDate(reminder30.getDate() - 30);
    reminders.push({
      event: "Contract expiration - 30 day notice",
      date: reminder30.toISOString().split("T")[0],
      priority: "HIGH",
      description: "Finalize contract renewal or transition plan",
    });

    // 7 days before expiration
    const reminder7 = new Date(endDate);
    reminder7.setDate(reminder7.getDate() - 7);
    reminders.push({
      event: "Contract expiration - 7 day notice",
      date: reminder7.toISOString().split("T")[0],
      priority: "MEDIUM",
      description: "Confirm service transition or renewal is complete",
    });

    return reminders;
  }

  /**
   * Convert ContractRecord to database insert format
   */
  private toInsert(contract: ContractRecord): ContractInsert {
    return {
      project_id: contract.project_id,
      source_file_id: contract.source_file_id,
      contract_start_date: contract.contract_start_date,
      contract_end_date: contract.contract_end_date,
      term_length_years: contract.term_length_years,
      clauses: contract.clauses as any,
      calendar_reminders: contract.calendar_reminders as any,
    };
  }
}
