/**
 * Worker System Integration Test
 *
 * Verifies:
 * 1. Worker startup and configuration
 * 2. Job polling and processing
 * 3. Error handling
 * 4. Graceful shutdown
 *
 * Usage:
 *   npx tsx scripts/test-worker-integration.ts
 */

import { spawn, ChildProcess } from "child_process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Test configuration
const TEST_USER_EMAIL = `worker-test-${Date.now()}@wastewise.local`;
const TEST_PASSWORD = "TestPassword123!";

async function main() {
  console.log("🧪 Starting Worker Integration Test\n");

  let workerProcess: ChildProcess | null = null;
  let userId: string | null = null;
  let projectId: string | null = null;

  try {
    // 1. Setup Test Data
    console.log("📝 Setting up test data...");

    // Create User
    const { data: userData, error: userError } =
      await supabase.auth.admin.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (userError)
      throw new Error(`Failed to create user: ${userError.message}`);
    userId = userData.user.id;
    console.log(`   User created: ${userId}`);

    // Create Project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        property_name: "Worker Test Property",
        units: 100,
        city: "Test City",
        state: "TX",
        property_type: "Garden-Style",
        equipment_type: "COMPACTOR",
        status: "draft",
      })
      .select()
      .single();
    if (projectError)
      throw new Error(`Failed to create project: ${projectError.message}`);
    projectId = project.id;
    console.log(`   Project created: ${projectId}`);

    // Create minimal invoice data (required for analysis)
    await supabase.from("invoice_data").insert({
      project_id: projectId,
      invoice_number: "TEST-INV-001",
      invoice_date: "2025-01-01",
      vendor_name: "Test Vendor",
      service_type: "Compactor",
      total_amount: 1000,
      hauls: 4,
    });
    console.log("   Invoice data created");

    // 2. Start Worker
    console.log("\n👷 Starting worker process...");
    // Use pnpm worker to ensure correct environment
    workerProcess = spawn("pnpm", ["worker", "--poll=1000"], {
      stdio: "pipe",
      shell: true,
      env: { ...process.env, FORCE_COLOR: "true" },
    });

    // Monitor worker output
    workerProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      // console.log(`[Worker]: ${output.trim()}`) // Uncomment for debug
      if (output.includes("Worker started successfully")) {
        console.log("   ✅ Worker started successfully");
      }
    });

    workerProcess.stderr?.on("data", (data) => {
      // Only log actual errors, ignore warnings/info if possible or just log everything for debug
      const output = data.toString().trim();
      if (output) console.error(`[Worker Stderr]: ${output}`);
    });

    // Wait for worker to initialize
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. Test Job Processing
    console.log("\n🔄 Test 1: Normal Job Processing");
    const { data: job, error: jobError } = await supabase
      .from("analysis_jobs")
      .insert({
        user_id: userId,
        project_id: projectId,
        job_type: "complete_analysis",
        status: "pending",
      })
      .select()
      .single();

    if (jobError) throw new Error(`Failed to create job: ${jobError.message}`);
    console.log(`   Job created: ${job.id}`);

    // Poll for completion
    console.log("   Waiting for job completion...");
    let completed = false;
    for (let i = 0; i < 30; i++) {
      // 30 seconds max
      const { data: currentJob } = await supabase
        .from("analysis_jobs")
        .select("status, progress_percent")
        .eq("id", job.id)
        .single();

      if (currentJob?.status === "processing") {
        process.stdout.write(".");
      } else if (currentJob?.status === "completed") {
        console.log("\n   ✅ Job completed!");
        completed = true;
        break;
      } else if (currentJob?.status === "failed") {
        throw new Error("Job failed unexpectedly");
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!completed) throw new Error("Job timed out");

    // 4. Test Error Handling
    console.log("\n⚠️ Test 2: Error Handling");
    // Create job with invalid project ID (we'll use a random UUID that doesn't exist)
    // Note: We need to bypass RLS or foreign key constraints might fail immediately on insert if not careful.
    // Actually, the worker will fail when trying to load data for a project that doesn't exist or belongs to another user if we were testing that.
    // But here we can just create a job for the valid project but force a failure in the worker logic?
    // Easier: Create a job for a project that has NO data, which might cause a specific error,
    // OR just rely on the fact that we can't easily insert an invalid project_id due to FK constraints.
    // Let's try creating a job for the same project but delete the invoice data first to cause a "No data" error.

    await supabase.from("invoice_data").delete().eq("project_id", projectId);

    const { data: failJob, error: failJobError } = await supabase
      .from("analysis_jobs")
      .insert({
        user_id: userId,
        project_id: projectId,
        job_type: "complete_analysis",
        status: "pending",
      })
      .select()
      .single();

    if (failJobError)
      throw new Error(`Failed to create failing job: ${failJobError.message}`);
    console.log(`   Failing job created: ${failJob.id}`);

    // Poll for failure
    console.log("   Waiting for job failure...");
    let failed = false;
    for (let i = 0; i < 30; i++) {
      const { data: currentJob } = await supabase
        .from("analysis_jobs")
        .select("status, error_message")
        .eq("id", failJob.id)
        .single();

      if (currentJob?.status === "failed") {
        console.log(
          `\n   ✅ Job failed as expected: ${currentJob.error_message}`,
        );
        failed = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!failed) throw new Error("Job did not fail as expected");

    // 5. Test Graceful Shutdown
    console.log("\n🛑 Test 3: Graceful Shutdown");
    if (workerProcess) {
      workerProcess.kill("SIGTERM");
      console.log("   Sent SIGTERM to worker");

      await new Promise<void>((resolve) => {
        workerProcess?.on("exit", (code) => {
          console.log(`   ✅ Worker exited with code ${code}`);
          resolve();
        });
      });
    }

    console.log("\n🎉 All integration tests passed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    if (workerProcess) workerProcess.kill();
    process.exit(1);
  } finally {
    // Cleanup
    if (userId) {
      console.log("\n🧹 Cleaning up...");
      // Delete project (cascades to jobs, invoices, etc.)
      if (projectId)
        await supabase.from("projects").delete().eq("id", projectId);
      // Delete user
      await supabase.auth.admin.deleteUser(userId);
      console.log("   Cleanup complete");
    }
  }
}

main();
