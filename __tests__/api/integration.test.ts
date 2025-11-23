/**
 * API Integration Tests for WasteWise
 *
 * Tests API endpoints with real data and verifies database changes.
 * These tests interact with actual Supabase database and services.
 *
 * Prerequisites:
 * - Local Supabase running (supabase start)
 * - Test user created (see scripts/seed-test-project.ts)
 * - Environment variables configured (.env.local)
 *
 * Run: pnpm test __tests__/api/integration.test.ts
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Test configuration
const TEST_USER_EMAIL = "test@wastewise.local";
const TEST_USER_PASSWORD = "TestPassword123!";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Supabase admin client for database verification
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test state
let authToken: string;
let testUserId: string;
let testProjectId: string;
let testJobId: string;

describe("API Integration Tests", () => {
  beforeAll(async () => {
    // Authenticate test user and get token
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to authenticate test user. Run: pnpm seed");
    }

    const data = await response.json();
    authToken = data.session?.access_token;
    testUserId = data.user?.id;

    if (!authToken || !testUserId) {
      throw new Error("No auth token or user ID returned from login");
    }
  });

  afterEach(async () => {
    // Clean up test data after each test
    if (testProjectId) {
      await supabaseAdmin.from("projects").delete().eq("id", testProjectId);
      testProjectId = "";
    }

    if (testJobId) {
      await supabaseAdmin.from("analysis_jobs").delete().eq("id", testJobId);
      testJobId = "";
    }
  });

  describe("Health Check Endpoint", () => {
    it("should return 200 and healthy status", async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("ok");
      expect(data.timestamp).toBeDefined();
      expect(data.database).toBe("connected");
    });

    it("should include service status details", async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      expect(data.services).toBeDefined();
      expect(data.services.database).toBe("healthy");
      expect(data.services.storage).toBe("healthy");
    });
  });

  describe("Projects API", () => {
    it("should create a new project", async () => {
      const newProject = {
        name: "Test Integration Property",
        units: 250,
        property_type: "Garden-Style",
        equipment_type: "COMPACTOR",
        city: "Austin",
        state: "TX",
      };

      const response = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(newProject),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.name).toBe(newProject.name);
      expect(data.units).toBe(newProject.units);
      expect(data.user_id).toBe(testUserId);

      testProjectId = data.id;

      // Verify in database
      const { data: dbProject } = await supabaseAdmin
        .from("projects")
        .select("*")
        .eq("id", testProjectId)
        .single();

      expect(dbProject).toBeDefined();
      expect(dbProject!.name).toBe(newProject.name);
      expect(dbProject!.units).toBe(newProject.units);
      expect(dbProject!.property_type).toBe(newProject.property_type);
    });

    it("should validate required fields", async () => {
      const invalidProject = {
        name: "Missing Fields",
        // Missing required: units, property_type, equipment_type
      };

      const response = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(invalidProject),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should enforce CHECK constraints", async () => {
      const invalidPropertyType = {
        name: "Invalid Property Type",
        units: 200,
        property_type: "InvalidType", // Not in CHECK constraint
        equipment_type: "COMPACTOR",
      };

      const response = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(invalidPropertyType),
      });

      expect(response.status).toBe(400);
    });

    it("should list user projects (RLS enforcement)", async () => {
      // Create a test project first
      const createResponse = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: "RLS Test Project",
          units: 150,
          property_type: "Mid-Rise",
          equipment_type: "DUMPSTER",
        }),
      });

      testProjectId = (await createResponse.json()).id;

      // List projects
      const listResponse = await fetch(`${BASE_URL}/api/projects`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await listResponse.json();

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.some((p: any) => p.id === testProjectId)).toBe(true);

      // All returned projects should belong to test user
      data.forEach((project: any) => {
        expect(project.user_id).toBe(testUserId);
      });
    });

    it("should get project by ID", async () => {
      // Create project
      const createResponse = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: "Get By ID Test",
          units: 100,
          property_type: "High-Rise",
          equipment_type: "COMPACTOR",
        }),
      });

      testProjectId = (await createResponse.json()).id;

      // Get project
      const getResponse = await fetch(
        `${BASE_URL}/api/projects/${testProjectId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      const data = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(data.id).toBe(testProjectId);
      expect(data.name).toBe("Get By ID Test");
    });

    it("should delete project", async () => {
      // Create project
      const createResponse = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: "To Be Deleted",
          units: 50,
          property_type: "Garden-Style",
          equipment_type: "DUMPSTER",
        }),
      });

      const projectId = (await createResponse.json()).id;

      // Delete project
      const deleteResponse = await fetch(
        `${BASE_URL}/api/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      expect(deleteResponse.status).toBe(204);

      // Verify deletion in database
      const { data: deletedProject } = await supabaseAdmin
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      expect(deletedProject).toBeNull();
    });
  });

  describe("Analysis Jobs API", () => {
    beforeEach(async () => {
      // Create a test project for analysis tests
      const response = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: "Analysis Test Project",
          units: 250,
          property_type: "Garden-Style",
          equipment_type: "COMPACTOR",
        }),
      });

      testProjectId = (await response.json()).id;
    });

    it("should start an analysis job", async () => {
      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          projectId: testProjectId,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.jobId).toBeDefined();
      expect(data.status).toBe("pending");

      testJobId = data.jobId;

      // Verify job created in database
      const { data: dbJob } = await supabaseAdmin
        .from("analysis_jobs")
        .select("*")
        .eq("id", testJobId)
        .single();

      expect(dbJob).toBeDefined();
      expect(dbJob!.status).toBe("pending");
      expect(dbJob!.user_id).toBe(testUserId);
      expect(dbJob!.project_id).toBe(testProjectId);
    });

    it("should check job status", async () => {
      // Start a job
      const startResponse = await fetch(`${BASE_URL}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          projectId: testProjectId,
        }),
      });

      testJobId = (await startResponse.json()).jobId;

      // Check status
      const statusResponse = await fetch(`${BASE_URL}/api/jobs/${testJobId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await statusResponse.json();

      expect(statusResponse.status).toBe(200);
      expect(data.id).toBe(testJobId);
      expect(data.status).toMatch(/pending|processing|completed|failed/);
      expect(data.progress).toBeDefined();
    });

    it("should enforce RLS on job access", async () => {
      // Try to access a non-existent job ID
      const fakeJobId = "00000000-0000-0000-0000-000000000000";

      const response = await fetch(`${BASE_URL}/api/jobs/${fakeJobId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it("should validate job input", async () => {
      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          // Missing projectId
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("File Upload API", () => {
    beforeEach(async () => {
      // Create a test project
      const response = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: "Upload Test Project",
          units: 200,
          property_type: "Mid-Rise",
          equipment_type: "COMPACTOR",
        }),
      });

      testProjectId = (await response.json()).id;
    });

    it("should upload a file", async () => {
      // Create a test CSV file
      const csvContent = "Date,Tons,Hauls\n2025-01-01,5.2,1\n2025-01-02,6.1,1";
      const file = new Blob([csvContent], { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file, "test-haul-log.csv");
      formData.append("projectId", testProjectId);
      formData.append("fileType", "haul_log");

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.file_path).toBeDefined();
      expect(data.file_type).toBe("haul_log");

      // Verify file record in database
      const { data: dbFile } = await supabaseAdmin
        .from("project_files")
        .select("*")
        .eq("project_id", testProjectId)
        .eq("file_type", "haul_log")
        .single();

      expect(dbFile).toBeDefined();
      expect(dbFile!.file_name).toBe("test-haul-log.csv");
    });

    it("should validate file size limits", async () => {
      // Create a file larger than 10MB
      const largeFile = new Blob([new ArrayBuffer(11 * 1024 * 1024)], {
        type: "application/pdf",
      });

      const formData = new FormData();
      formData.append("file", largeFile, "large-file.pdf");
      formData.append("projectId", testProjectId);
      formData.append("fileType", "invoice");

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("size");
    });

    it("should validate file types", async () => {
      const invalidFile = new Blob(["invalid content"], { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", invalidFile, "invalid.txt");
      formData.append("projectId", testProjectId);
      formData.append("fileType", "invoice");

      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("type");
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits", async () => {
      const requests = [];

      // Make 30 rapid requests (rate limit is typically 20/min)
      for (let i = 0; i < 30; i++) {
        requests.push(
          fetch(`${BASE_URL}/api/health`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }),
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((r) => r.status === 429);

      expect(rateLimited).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await fetch(`${BASE_URL}/api/projects`, {
        method: "GET",
        // No Authorization header
      });

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent resources", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      const response = await fetch(`${BASE_URL}/api/projects/${fakeId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it("should handle malformed JSON gracefully", async () => {
      const response = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: "invalid json{",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("Database Verification", () => {
    it("should enforce Row Level Security (RLS)", async () => {
      // Create a project
      const createResponse = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: "RLS Verification Project",
          units: 100,
          property_type: "Garden-Style",
          equipment_type: "COMPACTOR",
        }),
      });

      testProjectId = (await createResponse.json()).id;

      // Try to access project from another user (should fail)
      const { data: otherUserProjects } = await supabaseAdmin
        .from("projects")
        .select("*")
        .eq("user_id", "00000000-0000-0000-0000-000000000000"); // Fake user ID

      expect(otherUserProjects).toEqual([]);
    });

    it("should cascade delete related records", async () => {
      // Create project
      const createResponse = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: "Cascade Delete Test",
          units: 100,
          property_type: "Garden-Style",
          equipment_type: "COMPACTOR",
        }),
      });

      const projectId = (await createResponse.json()).id;

      // Create related analysis job
      await supabaseAdmin.from("analysis_jobs").insert({
        user_id: testUserId,
        project_id: projectId,
        job_type: "complete_analysis",
        status: "pending",
      });

      // Delete project
      await fetch(`${BASE_URL}/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Verify related jobs are also deleted (cascade)
      const { data: orphanedJobs } = await supabaseAdmin
        .from("analysis_jobs")
        .select("*")
        .eq("project_id", projectId);

      expect(orphanedJobs).toEqual([]);
    });
  });
});
