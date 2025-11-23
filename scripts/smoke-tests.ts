#!/usr/bin/env node
/**
 * Smoke Test Suite
 *
 * Post-deployment validation to ensure critical functionality works
 * Runs against staging/production environment
 */

interface SmokeTestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
  response?: any;
}

class SmokeTestRunner {
  private baseUrl: string;
  private results: SmokeTestResult[] = [];
  private authToken: string | null = null;

  constructor(
    baseUrl: string = process.env.STAGING_URL || "http://localhost:3000",
  ) {
    this.baseUrl = baseUrl;
  }

  async runAllTests(): Promise<boolean> {
    console.log(`🔥 Running Smoke Tests against ${this.baseUrl}\n`);

    await this.testHealthEndpoints();
    await this.testAuthFlow();
    await this.testAPIEndpoints();
    await this.testWorkerStatus();
    await this.testFileUploads();

    this.printResults();
    return this.results.every((r) => r.passed);
  }

  private async testHealthEndpoints(): Promise<void> {
    console.log("🏥 Health Check Endpoints...");

    await this.runTest("Frontend Health", async () => {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      const data = await response.json();
      if (data.status !== "ok") {
        throw new Error(`Health check returned: ${data.status}`);
      }
      return data;
    });

    await this.runTest("Database Connectivity", async () => {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const data = await response.json();
      if (data.database !== "connected") {
        throw new Error(`Database status: ${data.database}`);
      }
      return data;
    });

    await this.runTest("Worker Health", async () => {
      const response = await fetch(`${this.baseUrl}/api/health/worker`);
      if (!response.ok) {
        throw new Error(`Worker health check failed: ${response.status}`);
      }
      const data = await response.json();
      return data;
    });

    console.log();
  }

  private async testAuthFlow(): Promise<void> {
    console.log("🔐 Authentication Flow...");

    const testEmail = "test@wastewise.local";
    const testPassword = "TestPassword123!";

    await this.runTest("User Login", async () => {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Login failed: ${error}`);
      }

      const data = await response.json();
      this.authToken = data.access_token;
      return data;
    });

    await this.runTest("Authenticated Request", async () => {
      if (!this.authToken) {
        throw new Error("No auth token available");
      }

      const response = await fetch(`${this.baseUrl}/api/projects`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Authenticated request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    });

    console.log();
  }

  private async testAPIEndpoints(): Promise<void> {
    console.log("🌐 API Endpoints...");

    if (!this.authToken) {
      console.log("⚠️  Skipping API tests (no auth token)\n");
      return;
    }

    await this.runTest("List Projects", async () => {
      const response = await fetch(`${this.baseUrl}/api/projects`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to list projects: ${response.status}`);
      }

      const data = await response.json();
      return { projectCount: data.length };
    });

    await this.runTest("Health Metrics", async () => {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const data = await response.json();

      if (!data.timestamp) {
        throw new Error("No timestamp in health response");
      }

      return data;
    });

    console.log();
  }

  private async testWorkerStatus(): Promise<void> {
    console.log("⚙️  Background Worker...");

    await this.runTest("Worker Responding", async () => {
      const response = await fetch(`${this.baseUrl}/api/health/worker`);

      if (!response.ok) {
        throw new Error("Worker health endpoint not responding");
      }

      const data = await response.json();
      return data;
    });

    await this.runTest("Job Queue Accessible", async () => {
      if (!this.authToken) {
        throw new Error("No auth token");
      }

      const response = await fetch(`${this.baseUrl}/api/jobs`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (!response.ok) {
        throw new Error(`Jobs endpoint failed: ${response.status}`);
      }

      const data = await response.json();
      return { jobCount: data.length };
    });

    console.log();
  }

  private async testFileUploads(): Promise<void> {
    console.log("📤 File Upload System...");

    // Note: File upload testing requires multipart/form-data
    // This is a basic connectivity test
    await this.runTest("Upload Endpoint Available", async () => {
      if (!this.authToken) {
        throw new Error("No auth token");
      }

      // Just check if the endpoint is accessible (OPTIONS request)
      const response = await fetch(`${this.baseUrl}/api/projects/test/files`, {
        method: "OPTIONS",
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      // 404 is OK here - we're just checking connectivity
      if (response.status === 500) {
        throw new Error("Upload endpoint returned server error");
      }

      return { status: response.status };
    });

    console.log();
  }

  private async runTest(
    name: string,
    testFn: () => Promise<any>,
  ): Promise<void> {
    const start = Date.now();

    try {
      const response = await testFn();

      this.results.push({
        name,
        passed: true,
        message: "OK",
        duration: Date.now() - start,
        response,
      });

      console.log(`✅ ${name} (${Date.now() - start}ms)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Test failed";

      this.results.push({
        name,
        passed: false,
        message,
        duration: Date.now() - start,
      });

      console.log(`❌ ${name}`);
      console.log(`   └─ ${message}`);
    }
  }

  private printResults(): void {
    console.log("\n" + "=".repeat(80));
    console.log("🔥 Smoke Test Results");
    console.log("=".repeat(80));

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log("\n⚠️  DEPLOYMENT ISSUES DETECTED:\n");
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  ❌ ${r.name}: ${r.message}`);
        });
      console.log("\n💡 Check server logs and worker status");
      console.log();
    } else {
      console.log("\n✅ ALL SMOKE TESTS PASSED - Deployment successful!\n");
    }

    console.log("=".repeat(80) + "\n");
  }
}

// Run smoke tests
const baseUrl =
  process.argv[2] || process.env.STAGING_URL || "http://localhost:3000";
const runner = new SmokeTestRunner(baseUrl);

runner.runAllTests().then((success) => {
  process.exit(success ? 0 : 1);
});
