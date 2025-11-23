import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { join } from "path";

// Load environment variables
dotenv.config({ path: join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Fetching test user...");

  const {
    data: { users },
    error: userError,
  } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error("Failed to list users:", userError);
    process.exit(1);
  }

  const testUser = users.find((u) => u.email === "test@wastewise.local");

  if (!testUser) {
    console.error("Test user not found");
    process.exit(1);
  }

  console.log("Found test user:", testUser.id);

  console.log("Fetching test project...");
  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", testUser.id)
    .limit(1);

  if (projectError) {
    console.error("Failed to list projects:", projectError);
    process.exit(1);
  }

  if (!projects || projects.length === 0) {
    console.error("No projects found for test user");
    process.exit(1);
  }

  const projectId = projects[0].id;
  console.log("Found project:", projectId);

  console.log("Creating test job...");

  const { data, error } = await supabase
    .from("analysis_jobs")
    .insert({
      project_id: projectId,
      user_id: testUser.id,
      job_type: "complete_analysis",
      status: "pending",
      input_data: { projectId: projectId },
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create job:", error);
    process.exit(1);
  }

  console.log("Job created successfully:", data.id);
}

main();
