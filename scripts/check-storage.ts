/**
 * Check and create storage bucket if needed
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

async function main() {
  console.log("\n🔍 Checking storage configuration...\n");

  // List existing buckets
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    console.error("❌ Error listing buckets:", listError);
    process.exit(1);
  }

  console.log(
    "📦 Existing buckets:",
    buckets?.map((b) => b.name).join(", ") || "none",
  );

  // Check if project-files bucket exists
  const projectFilesBucket = buckets?.find((b) => b.id === "project-files");

  if (projectFilesBucket) {
    console.log("✅ project-files bucket exists");
    console.log("   - Public:", projectFilesBucket.public);
    console.log(
      "   - File size limit:",
      projectFilesBucket.file_size_limit,
      "bytes",
    );
  } else {
    console.log("❌ project-files bucket NOT found");
    console.log("\n📝 Creating project-files bucket...\n");

    // Create bucket
    const { data: newBucket, error: createError } =
      await supabase.storage.createBucket("project-files", {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
          "text/html",
          "image/png",
          "image/jpeg",
        ],
      });

    if (createError) {
      console.error("❌ Error creating bucket:", createError);
      process.exit(1);
    }

    console.log("✅ Bucket created successfully:", newBucket);
  }

  console.log("\n✅ Storage configuration complete\n");
}

main();
