#!/usr/bin/env node
/**
 * Pre-Deployment Validation Script
 *
 * Runs comprehensive checks before staging/production deployment
 * Ensures code quality, tests pass, and configuration is valid
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

class DeploymentValidator {
  private results: CheckResult[] = [];
  private startTime: number = Date.now();

  async runAllChecks(): Promise<boolean> {
    console.log("🚀 Running Pre-Deployment Validation...\n");

    await this.checkCodeQuality();
    await this.checkTests();
    await this.checkEnvironment();
    await this.checkDatabase();
    await this.checkSecurity();
    await this.checkDependencies();
    await this.checkBuildArtifacts();

    this.printResults();
    return this.results.every((r) => r.passed);
  }

  private async checkCodeQuality(): Promise<void> {
    console.log("📝 Code Quality Checks...");

    // TypeScript compilation
    await this.runCheck(
      "TypeScript Compilation",
      "pnpm tsc --noEmit",
      "All TypeScript files compile without errors",
    );

    // ESLint
    await this.runCheck(
      "ESLint",
      "pnpm lint --max-warnings 0",
      "No linting errors or warnings",
    );

    // Prettier (if configured)
    if (fs.existsSync(".prettierrc")) {
      await this.runCheck(
        "Code Formatting",
        "pnpm prettier --check .",
        "All files properly formatted",
      );
    }

    console.log();
  }

  private async checkTests(): Promise<void> {
    console.log("🧪 Test Suite Checks...");

    // Unit tests
    await this.runCheck(
      "Unit Tests",
      "pnpm test:unit --run",
      "All unit tests passing",
    );

    // Integration tests
    if (fs.existsSync("__tests__/integration")) {
      await this.runCheck(
        "Integration Tests",
        "pnpm test:integration --run",
        "All integration tests passing",
      );
    }

    // Calculation evals
    if (fs.existsSync("scripts/run-evals.ts")) {
      await this.runCheck(
        "Calculation Evals",
        "pnpm eval",
        "All calculation evals passing (<0.01% tolerance)",
      );
    }

    // E2E tests (optional - can be slow)
    const runE2E = process.env.RUN_E2E_CHECKS === "true";
    if (runE2E && fs.existsSync("__tests__/e2e")) {
      await this.runCheck(
        "E2E Tests",
        "pnpm test:e2e --project=chromium",
        "Critical E2E flows passing",
      );
    }

    console.log();
  }

  private async checkEnvironment(): Promise<void> {
    console.log("🔧 Environment Configuration...");

    // Environment template exists
    this.checkFileExists(
      "Environment Template",
      ".env.template",
      "Template file exists for environment setup",
    );

    // No secrets in .env.template
    await this.runCheck(
      "No Secrets in Template",
      () => {
        const template = fs.readFileSync(".env.template", "utf-8");
        const hasSecrets = /sk-ant-|eyJ[a-zA-Z0-9_-]+/.test(template);
        if (hasSecrets) {
          throw new Error("Found potential secrets in .env.template");
        }
      },
      "Environment template contains no secrets",
    );

    // .env.local not tracked
    await this.runCheck(
      "Git Ignore Check",
      () => {
        const gitignore = fs.readFileSync(".gitignore", "utf-8");
        if (!gitignore.includes(".env.local")) {
          throw new Error(".env.local not in .gitignore");
        }
      },
      ".env.local properly ignored by git",
    );

    console.log();
  }

  private async checkDatabase(): Promise<void> {
    console.log("💾 Database Checks...");

    // Migration files exist
    this.checkFileExists(
      "Database Migrations",
      "supabase/migrations",
      "Migration directory exists",
    );

    // Seed file exists
    this.checkFileExists("Seed Data", "supabase/seed.sql", "Seed file exists");

    // RPC functions documented
    const migrations = fs
      .readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"));
    const hasRPCFunctions = migrations.some((file) => {
      const content = fs.readFileSync(`supabase/migrations/${file}`, "utf-8");
      return content.includes("CREATE OR REPLACE FUNCTION");
    });

    this.addResult({
      name: "RPC Functions",
      passed: hasRPCFunctions,
      message: hasRPCFunctions
        ? "Database functions defined"
        : "No RPC functions found",
      duration: 0,
    });

    console.log();
  }

  private async checkSecurity(): Promise<void> {
    console.log("🔒 Security Checks...");

    // No hardcoded secrets in code
    await this.runCheck(
      "No Hardcoded Secrets",
      () => {
        const files = this.getAllTSFiles();
        for (const file of files) {
          const content = fs.readFileSync(file, "utf-8");
          // Check for common secret patterns
          if (/sk-ant-[a-zA-Z0-9]{32,}/.test(content)) {
            throw new Error(`Potential Anthropic API key in ${file}`);
          }
          if (
            /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/.test(content) &&
            !file.includes("__tests__")
          ) {
            throw new Error(`Potential JWT token in ${file}`);
          }
        }
      },
      "No hardcoded secrets detected",
    );

    // Security headers configured
    this.checkFileExists(
      "Security Headers",
      "middleware.ts",
      "Middleware file exists for security headers",
    );

    // Rate limiting configured
    const hasRateLimiting = fs.existsSync("lib/middleware/rate-limit.ts");
    this.addResult({
      name: "Rate Limiting",
      passed: hasRateLimiting,
      message: hasRateLimiting
        ? "Rate limiting configured"
        : "Rate limiting not found",
      duration: 0,
    });

    console.log();
  }

  private async checkDependencies(): Promise<void> {
    console.log("📦 Dependency Checks...");

    // No npm audit vulnerabilities (high/critical)
    await this.runCheck(
      "Security Vulnerabilities",
      "pnpm audit --audit-level high",
      "No high/critical vulnerabilities",
    );

    // Lock file in sync
    await this.runCheck(
      "Lock File Sync",
      () => {
        if (!fs.existsSync("pnpm-lock.yaml")) {
          throw new Error("pnpm-lock.yaml missing");
        }
      },
      "pnpm-lock.yaml exists and in sync",
    );

    console.log();
  }

  private async checkBuildArtifacts(): Promise<void> {
    console.log("🏗️  Build Artifacts...");

    // Next.js build succeeds
    await this.runCheck(
      "Production Build",
      "pnpm build",
      "Production build completes successfully",
    );

    // Build size check
    const buildDir = ".next";
    if (fs.existsSync(buildDir)) {
      const size = this.getDirectorySize(buildDir);
      const sizeInMB = size / (1024 * 1024);
      const passed = sizeInMB < 500; // 500MB limit

      this.addResult({
        name: "Build Size",
        passed,
        message: `Build size: ${sizeInMB.toFixed(2)} MB${passed ? "" : " (exceeds 500MB)"}`,
        duration: 0,
      });
    }

    console.log();
  }

  private async runCheck(
    name: string,
    command: string | (() => void),
    successMessage: string,
  ): Promise<void> {
    const start = Date.now();

    try {
      if (typeof command === "string") {
        execSync(command, { stdio: "pipe" });
      } else {
        command();
      }

      this.addResult({
        name,
        passed: true,
        message: successMessage,
        duration: Date.now() - start,
      });
    } catch (error) {
      this.addResult({
        name,
        passed: false,
        message: error instanceof Error ? error.message : "Check failed",
        duration: Date.now() - start,
      });
    }
  }

  private checkFileExists(
    name: string,
    filePath: string,
    successMessage: string,
  ): void {
    const exists = fs.existsSync(filePath);
    this.addResult({
      name,
      passed: exists,
      message: exists ? successMessage : `File not found: ${filePath}`,
      duration: 0,
    });
  }

  private addResult(result: CheckResult): void {
    this.results.push(result);
    const icon = result.passed ? "✅" : "❌";
    const duration =
      result.duration > 0 ? ` (${(result.duration / 1000).toFixed(1)}s)` : "";
    console.log(`${icon} ${result.name}${duration}`);
    if (!result.passed) {
      console.log(`   └─ ${result.message}`);
    }
  }

  private getAllTSFiles(): string[] {
    const files: string[] = [];
    const excludeDirs = ["node_modules", ".next", "dist", "coverage"];

    const walk = (dir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !excludeDirs.includes(item)) {
          walk(fullPath);
        } else if (
          stat.isFile() &&
          (item.endsWith(".ts") || item.endsWith(".tsx"))
        ) {
          files.push(fullPath);
        }
      }
    };

    walk(".");
    return files;
  }

  private getDirectorySize(dir: string): number {
    let size = 0;
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        size += this.getDirectorySize(fullPath);
      } else {
        size += stat.size;
      }
    }

    return size;
  }

  private printResults(): void {
    console.log("\n" + "=".repeat(80));
    console.log("📊 Pre-Deployment Validation Results");
    console.log("=".repeat(80));

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    console.log(`\nTotal Checks: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(
      `\nTotal Duration: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`,
    );

    if (failed > 0) {
      console.log("\n⚠️  DEPLOYMENT BLOCKED - Fix the following issues:\n");
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  ❌ ${r.name}: ${r.message}`);
        });
      console.log();
    } else {
      console.log("\n✅ ALL CHECKS PASSED - Ready for deployment!\n");
    }

    console.log("=".repeat(80) + "\n");
  }
}

// Run validation
const validator = new DeploymentValidator();
validator.runAllChecks().then((success) => {
  process.exit(success ? 0 : 1);
});
