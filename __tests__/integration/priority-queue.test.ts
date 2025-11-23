/**
 * Integration Tests for Priority Queue System
 *
 * Tests end-to-end priority queue behavior:
 * - Jobs ordered by priority
 * - Priority assignment logic
 * - Queue retrieval with retry_after filtering
 * - Worker claiming mechanism
 *
 * Note: These tests require a running Supabase instance
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

describe("Priority Queue Integration", () => {
  let supabase: ReturnType<typeof createClient<Database>>;
  let testUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // Create test user (assuming auth is set up)
    // In real tests, you'd use a test user or mock auth

    // For now, we'll skip user creation and use a placeholder
    testUserId = "00000000-0000-0000-0000-000000000001";
    testProjectId = "00000000-0000-0000-0000-000000000002";
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from("analysis_jobs").delete().ilike("id", "%");
  });

  describe("Priority Assignment", () => {
    it("should assign priority 3 for first-time user", async () => {
      const { data: priority } = await supabase.rpc("assign_job_priority", {
        user_id: testUserId,
        job_type: "complete_analysis",
      });

      // First-time user should get priority 3 (high)
      expect(priority).toBe(3);
    });

    it("should assign priority 5 for regular analysis after first job", async () => {
      // Create a completed job for the user
      await supabase.from("analysis_jobs").insert({
        user_id: testUserId,
        project_id: testProjectId,
        job_type: "complete_analysis",
        status: "completed",
        input_data: {},
        completed_at: new Date().toISOString(),
      });

      const { data: priority } = await supabase.rpc("assign_job_priority", {
        user_id: testUserId,
        job_type: "complete_analysis",
      });

      // Regular user should get priority 5 (normal)
      expect(priority).toBe(5);
    });

    it("should assign priority 7 for report generation", async () => {
      const { data: priority } = await supabase.rpc("assign_job_priority", {
        user_id: testUserId,
        job_type: "report_generation",
      });

      expect(priority).toBe(7);
    });
  });

  describe("Queue Ordering", () => {
    it("should return jobs in priority order", async () => {
      // Create jobs with different priorities
      const jobs = [
        { priority: 5, job_type: "complete_analysis" },
        { priority: 1, job_type: "complete_analysis" },
        { priority: 7, job_type: "report_generation" },
        { priority: 3, job_type: "invoice_extraction" },
      ];

      for (const job of jobs) {
        await supabase.from("analysis_jobs").insert({
          user_id: testUserId,
          project_id: testProjectId,
          job_type: job.job_type,
          status: "pending",
          priority: job.priority,
          input_data: {},
        });
      }

      // Get next job (should be priority 1)
      const { data: firstJobId } = await supabase.rpc("get_next_job", {
        worker_identifier: "test-worker-1",
      });

      expect(firstJobId).toBeDefined();

      const { data: firstJob } = await supabase
        .from("analysis_jobs")
        .select("priority")
        .eq("id", firstJobId!)
        .single();

      expect(firstJob?.priority).toBe(1);
    });
  });

  describe("Retry After Filtering", () => {
    it("should skip jobs with future retry_after timestamp", async () => {
      const futureTime = new Date(Date.now() + 60000).toISOString(); // 1 minute in future

      // Create job with future retry_after
      await supabase.from("analysis_jobs").insert({
        user_id: testUserId,
        project_id: testProjectId,
        job_type: "complete_analysis",
        status: "pending",
        priority: 1,
        retry_after: futureTime,
        input_data: {},
      });

      // Create job ready for processing
      const { data: readyJob } = await supabase
        .from("analysis_jobs")
        .insert({
          user_id: testUserId,
          project_id: testProjectId,
          job_type: "complete_analysis",
          status: "pending",
          priority: 5,
          retry_after: null,
          input_data: {},
        })
        .select()
        .single();

      // Get next job - should skip the one with future retry_after
      const { data: nextJobId } = await supabase.rpc("get_next_job", {
        worker_identifier: "test-worker-2",
      });

      expect(nextJobId).toBe(readyJob?.id);
    });

    it("should process jobs with past retry_after timestamp", async () => {
      const pastTime = new Date(Date.now() - 60000).toISOString(); // 1 minute in past

      const { data: retryJob } = await supabase
        .from("analysis_jobs")
        .insert({
          user_id: testUserId,
          project_id: testProjectId,
          job_type: "complete_analysis",
          status: "pending",
          priority: 1,
          retry_after: pastTime,
          retry_count: 1,
          input_data: {},
        })
        .select()
        .single();

      // Get next job - should include the retry job
      const { data: nextJobId } = await supabase.rpc("get_next_job", {
        worker_identifier: "test-worker-3",
      });

      expect(nextJobId).toBe(retryJob?.id);
    });
  });

  describe("Worker Claiming", () => {
    it("should assign worker_id when claiming job", async () => {
      const { data: job } = await supabase
        .from("analysis_jobs")
        .insert({
          user_id: testUserId,
          project_id: testProjectId,
          job_type: "complete_analysis",
          status: "pending",
          priority: 5,
          input_data: {},
        })
        .select()
        .single();

      const workerId = "test-worker-4";

      await supabase.rpc("get_next_job", {
        worker_identifier: workerId,
      });

      const { data: claimedJob } = await supabase
        .from("analysis_jobs")
        .select("worker_id, claimed_at")
        .eq("id", job!.id)
        .single();

      expect(claimedJob?.worker_id).toBe(workerId);
      expect(claimedJob?.claimed_at).toBeDefined();
    });

    it("should skip jobs already claimed by another worker (SKIP LOCKED)", async () => {
      const { data: job } = await supabase
        .from("analysis_jobs")
        .insert({
          user_id: testUserId,
          project_id: testProjectId,
          job_type: "complete_analysis",
          status: "pending",
          priority: 1,
          input_data: {},
        })
        .select()
        .single();

      // First worker claims the job
      await supabase.rpc("get_next_job", {
        worker_identifier: "worker-A",
      });

      // Second worker should get null (job is locked)
      const { data: nextJobId } = await supabase.rpc("get_next_job", {
        worker_identifier: "worker-B",
      });

      // Should be null or a different job (not the claimed one)
      if (nextJobId) {
        expect(nextJobId).not.toBe(job?.id);
      }
    });
  });

  describe("Queue Metrics", () => {
    it("should return comprehensive queue metrics", async () => {
      // Create various jobs
      await supabase.from("analysis_jobs").insert([
        {
          user_id: testUserId,
          project_id: testProjectId,
          job_type: "complete_analysis",
          status: "pending",
          priority: 1,
          input_data: {},
        },
        {
          user_id: testUserId,
          project_id: testProjectId,
          job_type: "complete_analysis",
          status: "pending",
          priority: 5,
          input_data: {},
        },
        {
          user_id: testUserId,
          project_id: testProjectId,
          job_type: "complete_analysis",
          status: "processing",
          started_at: new Date().toISOString(),
          input_data: {},
        },
      ]);

      const { data: metrics } = await supabase.rpc("get_queue_metrics");

      expect(metrics).toHaveProperty("total_pending");
      expect(metrics).toHaveProperty("total_processing");
      expect(metrics).toHaveProperty("by_priority");
      expect(metrics).toHaveProperty("error_rate_1h");
      expect(metrics).toHaveProperty("stuck_jobs");

      const metricsData = metrics as Record<string, any>;
      expect(metricsData.total_pending).toBeGreaterThanOrEqual(2);
      expect(metricsData.total_processing).toBeGreaterThanOrEqual(1);
    });
  });
});
