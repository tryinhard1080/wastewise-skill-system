/**
 * Environment Variable Validation Script
 *
 * Validates that all required environment variables are present and properly formatted.
 * Run this before deploying to catch configuration errors early.
 *
 * Usage:
 *   pnpm validate:env
 *   pnpm validate:env --strict  # Fail on warnings too
 */

import dotenv from "dotenv";
import path from "path";

// Load .env.local if exists (for local validation)
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvVariable {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  description: string;
}

// Define required environment variables
const ENV_VARIABLES: EnvVariable[] = [
  // Supabase (required for all environments)
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    validator: (val) => val.startsWith("http") && val.includes("supabase"),
    description: "Supabase project URL",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    validator: (val) => val.startsWith("eyJ") && val.length > 100,
    description: "Supabase anonymous key (JWT)",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    validator: (val) => val.startsWith("eyJ") && val.length > 100,
    description: "Supabase service role key (JWT)",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET",
    required: true,
    validator: (val) => val.length > 0 && !/\s/.test(val),
    description: "Supabase storage bucket name",
  },

  // AI Services (required)
  {
    name: "ANTHROPIC_API_KEY",
    required: true,
    validator: (val) => val.startsWith("sk-ant-"),
    description: "Anthropic Claude API key",
  },

  // Application (required)
  {
    name: "NEXT_PUBLIC_APP_URL",
    required: true,
    validator: (val) => val.startsWith("http"),
    description: "Application URL",
  },
  {
    name: "NODE_ENV",
    required: true,
    validator: (val) => ["development", "staging", "production"].includes(val),
    description: "Node environment",
  },

  // Monitoring (optional but recommended for production)
  {
    name: "NEXT_PUBLIC_SENTRY_DSN",
    required: false,
    validator: (val) => val.startsWith("https://") && val.includes("sentry.io"),
    description: "Sentry error tracking DSN",
  },
  {
    name: "SENTRY_AUTH_TOKEN",
    required: false,
    validator: (val) => val.startsWith("sntrys_"),
    description: "Sentry auth token for source maps",
  },

  // Worker Configuration (optional - has defaults)
  {
    name: "WORKER_POLL_INTERVAL",
    required: false,
    validator: (val) => !isNaN(parseInt(val, 10)) && parseInt(val, 10) > 0,
    description: "Worker polling interval in milliseconds",
  },
  {
    name: "WORKER_MAX_CONCURRENT_JOBS",
    required: false,
    validator: (val) => !isNaN(parseInt(val, 10)) && parseInt(val, 10) > 0,
    description: "Maximum concurrent jobs per worker",
  },
];

/**
 * Validate a single environment variable
 */
function validateEnvVar(envVar: EnvVariable): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const value = process.env[envVar.name];

  // Check if required variable is missing
  if (envVar.required && !value) {
    errors.push(
      `❌ ${envVar.name} is required but not set (${envVar.description})`,
    );
    return { errors, warnings };
  }

  // Check if optional variable is missing (warning only)
  if (!envVar.required && !value) {
    warnings.push(`⚠️  ${envVar.name} is not set (${envVar.description})`);
    return { errors, warnings };
  }

  // Validate format if validator exists
  if (value && envVar.validator && !envVar.validator(value)) {
    errors.push(
      `❌ ${envVar.name} has invalid format (${envVar.description})\n   Current value: ${value.substring(0, 20)}...`,
    );
  }

  return { errors, warnings };
}

/**
 * Validate environment-specific requirements
 */
function validateEnvironmentSpecific(): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeEnv = process.env.NODE_ENV;

  // Production-specific checks
  if (nodeEnv === "production") {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      warnings.push(
        "⚠️  Sentry DSN not configured for production (error tracking recommended)",
      );
    }

    if (process.env.DEBUG === "true") {
      warnings.push("⚠️  DEBUG mode enabled in production (should be false)");
    }

    if (process.env.LOG_LEVEL === "debug") {
      warnings.push(
        "⚠️  LOG_LEVEL set to debug in production (should be warn or error)",
      );
    }

    if (process.env.NEXT_PUBLIC_APP_URL?.includes("localhost")) {
      errors.push("❌ NEXT_PUBLIC_APP_URL points to localhost in production");
    }
  }

  // Development-specific checks
  if (nodeEnv === "development") {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      warnings.push("⚠️  Sentry configured in development (may create noise)");
    }
  }

  return { errors, warnings };
}

/**
 * Check for common misconfigurations
 */
function checkCommonMisconfigurations(): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if using example/placeholder values
  const examplePatterns = [
    "your-",
    "example",
    "placeholder",
    "changeme",
    "localhost",
  ];

  ENV_VARIABLES.filter((v) => v.required).forEach((envVar) => {
    const value = process.env[envVar.name]?.toLowerCase() || "";

    examplePatterns.forEach((pattern) => {
      if (value.includes(pattern)) {
        warnings.push(
          `⚠️  ${envVar.name} appears to contain placeholder value: ${process.env[envVar.name]?.substring(0, 30)}...`,
        );
      }
    });
  });

  // Check if ANON_KEY and SERVICE_ROLE_KEY are the same (common mistake)
  if (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ===
      process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    errors.push(
      "❌ ANON_KEY and SERVICE_ROLE_KEY are the same (they should be different)",
    );
  }

  return { errors, warnings };
}

/**
 * Main validation function
 */
function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  WasteWise Environment Validation");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log(`Environment: ${process.env.NODE_ENV || "not set"}\n`);

  // Validate each environment variable
  ENV_VARIABLES.forEach((envVar) => {
    const { errors, warnings } = validateEnvVar(envVar);
    result.errors.push(...errors);
    result.warnings.push(...warnings);
  });

  // Validate environment-specific requirements
  const envSpecific = validateEnvironmentSpecific();
  result.errors.push(...envSpecific.errors);
  result.warnings.push(...envSpecific.warnings);

  // Check for common misconfigurations
  const misconfigs = checkCommonMisconfigurations();
  result.errors.push(...misconfigs.errors);
  result.warnings.push(...misconfigs.warnings);

  // Print results
  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log("✅ All environment variables are valid!\n");
  } else {
    if (result.errors.length > 0) {
      console.log("ERRORS:\n");
      result.errors.forEach((error) => console.log(error));
      console.log("");
      result.valid = false;
    }

    if (result.warnings.length > 0) {
      console.log("WARNINGS:\n");
      result.warnings.forEach((warning) => console.log(warning));
      console.log("");
    }
  }

  // Summary
  console.log("═══════════════════════════════════════════════════════");
  console.log(`Errors: ${result.errors.length}`);
  console.log(`Warnings: ${result.warnings.length}`);
  console.log("═══════════════════════════════════════════════════════\n");

  return result;
}

/**
 * Main execution
 */
function main(): void {
  const strictMode = process.argv.includes("--strict");
  const result = validateEnvironment();

  if (!result.valid) {
    console.error("❌ Environment validation failed!\n");
    console.error("Please fix the errors above before deploying.\n");
    process.exit(1);
  }

  if (strictMode && result.warnings.length > 0) {
    console.error("❌ Environment validation failed in strict mode!\n");
    console.error("Please fix the warnings above before deploying.\n");
    process.exit(1);
  }

  console.log("✅ Environment validation passed!\n");
  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { validateEnvironment, ValidationResult };
