/**
 * E2E Test for Compactor Optimization Skill
 *
 * This script tests the full vertical slice:
 * 1. Create test project with haul data
 * 2. Create analysis job
 * 3. Worker processes job (run separately: pnpm worker)
 * 4. Poll job status
 * 5. Verify results
 *
 * Usage:
 *   # Terminal 1: Start worker
 *   pnpm worker
 *
 *   # Terminal 2: Run E2E test
 *   npx tsx scripts/test-e2e.ts
 */

import dotenv from "dotenv";
import path from "path";

// Load .env.local file
dotenv.config({ path: path.join(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Test user ID (you may need to create a test user first)
const TEST_USER_ID = "00000000-0000-0000-0000-000000000000"; // Will be created

async function main() {
  console.log("🧪 Starting E2E Test for Compactor Optimization\n");

  // Step 1: Create test user via SQL (service role can insert into auth schema)
  console.log("📝 Step 1: Creating test user...");

  const userId = "11111111-1111-1111-1111-111111111111";

  // NOTE: exec_sql RPC function not in generated types - skipping user creation
  // In production E2E tests, you would create users via Supabase Auth API
  // or have a dedicated test fixture function in your database

  // For now, assume test user exists or will be created by first auth flow
  console.log(`✅ Using test user: ${userId}\n`);

  // Step 2: Create test project
  console.log("📝 Step 2: Creating test project...");

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      property_name: "E2E Test Property",
      units: 200,
      city: "Atlanta",
      state: "GA",
      property_type: "Garden-Style",
      equipment_type: "COMPACTOR",
      status: "draft",
    })
    .select()
    .single();

  if (projectError || !project) {
    console.error("❌ Failed to create project:", projectError?.message);
    process.exit(1);
  }

  console.log(`✅ Project created: ${project.id}`);
  console.log(`   Property: ${project.property_name}`);
  console.log(`   Units: ${project.units}`);
  console.log(`   Equipment: ${project.equipment_type}\n`);

  // Step 3: Create haul log data (low utilization to trigger recommendation)
  console.log("📝 Step 3: Creating haul log data...");

  const haulLogEntries = [
    { haul_date: "2025-01-01", tonnage: 5.2 },
    { haul_date: "2025-01-08", tonnage: 5.4 },
    { haul_date: "2025-01-15", tonnage: 5.1 },
    { haul_date: "2025-01-22", tonnage: 5.3 },
    { haul_date: "2025-01-29", tonnage: 5.0 },
  ];

  for (const entry of haulLogEntries) {
    const { error: haulError } = await supabase.from("haul_log").insert({
      project_id: project.id,
      haul_date: entry.haul_date,
      tonnage: entry.tonnage,
      status: "normal",
    });

    if (haulError) {
      console.error("❌ Failed to create haul log entry:", haulError.message);
      process.exit(1);
    }
  }

  const avgTons =
    haulLogEntries.reduce((sum, e) => sum + e.tonnage, 0) /
    haulLogEntries.length;
  console.log(`✅ Created ${haulLogEntries.length} haul log entries`);
  console.log(
    `   Average tons per haul: ${avgTons.toFixed(2)} (< 6.0, should recommend monitoring)\n`,
  );

  // Step 4: Create invoice data
  console.log("📝 Step 4: Creating invoice data...");

  const { error: invoiceError } = await supabase.from("invoice_data").insert({
    project_id: project.id,
    invoice_number: "INV-TEST-001",
    invoice_date: "2025-01-31",
    vendor_name: "Test Waste Services",
    service_type: "Compactor Service",
    total_amount: 4250, // 5 hauls × $850
    hauls: 5,
  });

  if (invoiceError) {
    console.error("❌ Failed to create invoice:", invoiceError.message);
    process.exit(1);
  }

  console.log("✅ Invoice data created\n");

  // Step 5: Create analysis job
  console.log("📝 Step 5: Creating analysis job...");

  const { data: job, error: jobError } = await supabase
    .from("analysis_jobs")
    .insert({
      user_id: userId,
      project_id: project.id,
      job_type: "complete_analysis", // Will be routed to compactor-optimization
      status: "pending",
      progress_percent: 0,
    })
    .select()
    .single();

  if (jobError || !job) {
    console.error("❌ Failed to create job:", jobError?.message);
    process.exit(1);
  }

  console.log(`✅ Analysis job created: ${job.id}`);
  console.log(`   Status: ${job.status}`);
  console.log(`   Type: ${job.job_type}\n`);

  console.log("⏳ Waiting for worker to process job...");
  console.log("   Make sure you have started the worker: pnpm worker\n");

  // Step 6: Poll job status
  let attempts = 0;
  const maxAttempts = 60; // 60 seconds
  let finalJob: Database["public"]["Tables"]["analysis_jobs"]["Row"] | null =
    null;

  while (attempts < maxAttempts) {
    const { data: currentJob } = await supabase
      .from("analysis_jobs")
      .select("*")
      .eq("id", job.id)
      .single();

    if (currentJob) {
      console.log(
        `   [${attempts + 1}s] Status: ${currentJob.status} | Progress: ${currentJob.progress_percent}% | Step: ${currentJob.current_step || "N/A"}`,
      );

      if (currentJob.status === "completed") {
        finalJob = currentJob;
        console.log("\n✅ Job completed successfully!\n");
        break;
      }

      if (currentJob.status === "failed") {
        console.error("\n❌ Job failed!");
        console.error("   Error:", currentJob.error_message);
        console.error("   Details:", currentJob.error_details);
        process.exit(1);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts++;
  }

  if (!finalJob) {
    console.error("\n❌ Job did not complete within 60 seconds");
    console.error("   Current status: unknown (timed out)");
    process.exit(1);
  }

  // Step 7: Verify results
  console.log("📊 Step 7: Verifying results...\n");

  const resultData = finalJob.result_data as any;

  console.log("Results:");
  console.log(
    `   Recommend monitoring: ${resultData.recommend ? "✅ YES" : "❌ NO"}`,
  );
  console.log(
    `   Average tons per haul: ${resultData.avgTonsPerHaul?.toFixed(2)} tons`,
  );
  console.log(`   Target tons per haul: ${resultData.targetTonsPerHaul} tons`);
  console.log(`   Current annual hauls: ${resultData.currentAnnualHauls}`);
  console.log(`   Optimized annual hauls: ${resultData.optimizedAnnualHauls}`);
  console.log(`   Hauls eliminated: ${resultData.haulsEliminated}`);
  console.log(
    `   Gross annual savings: $${resultData.grossAnnualSavings?.toFixed(2)}`,
  );
  console.log(
    `   Net Year 1 savings: $${resultData.netYear1Savings?.toFixed(2)}`,
  );
  console.log(
    `   Net annual savings (Y2+): $${resultData.netAnnualSavingsYear2Plus?.toFixed(2)}`,
  );
  console.log(`   ROI: ${resultData.roiPercent?.toFixed(2)}%`);
  console.log(
    `   Payback period: ${resultData.paybackMonths?.toFixed(1)} months`,
  );

  console.log("\n" + "=".repeat(60));

  // Verify expectations
  const checks = [
    {
      name: "Recommendation should be TRUE (avg tons < 6.0)",
      pass: resultData.recommend === true,
    },
    {
      name: "Average tons should be ~5.2",
      pass: Math.abs(resultData.avgTonsPerHaul - 5.2) < 0.2,
    },
    {
      name: "Target tons should be 8.5",
      pass: resultData.targetTonsPerHaul === 8.5,
    },
    {
      name: "Savings should be positive",
      pass: resultData.grossAnnualSavings > 0,
    },
    {
      name: "ROI should be positive",
      pass: resultData.roiPercent > 0,
    },
  ];

  console.log("\n✅ Verification Checks:\n");

  let allPassed = true;
  checks.forEach((check) => {
    const icon = check.pass ? "✅" : "❌";
    console.log(`   ${icon} ${check.name}`);
    if (!check.pass) allPassed = false;
  });

  console.log("\n" + "=".repeat(60));

  if (allPassed) {
    console.log("\n🎉 E2E TEST PASSED!\n");
    console.log("Cleanup: Deleting test data...");

    // Cleanup
    await supabase.from("projects").delete().eq("id", project.id);

    console.log("✅ Test data cleaned up\n");
    process.exit(0);
  } else {
    console.log("\n❌ E2E TEST FAILED\n");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\n❌ Test error:", error);
  process.exit(1);
});
