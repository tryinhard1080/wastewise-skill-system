/**
 * Tests for JobAlertManager
 *
 * Validates:
 * - Alert creation for different scenarios
 * - Notification channel selection
 * - Alert acknowledgment
 * - Stuck job detection
 * - Error rate monitoring
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  JobAlertManager,
  AlertType,
  AlertSeverity,
} from "@/lib/alerts/job-alerts";

// Mock notification services
vi.mock("@/lib/alerts/notification-service", () => ({
  sendEmailNotification: vi.fn().mockResolvedValue(true),
  sendSlackNotification: vi.fn().mockResolvedValue(true),
  sendPagerDutyNotification: vi.fn().mockResolvedValue(true),
}));

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => mockSupabase,
}));

describe("JobAlertManager", () => {
  let alertManager: JobAlertManager;

  beforeEach(() => {
    vi.clearAllMocks();
    alertManager = new JobAlertManager("http://localhost:54321", "test-key");

    // Set environment variables for testing
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.ADMIN_EMAIL = "admin@test.com";
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
  });

  describe("Job Failed Alert", () => {
    it("should create alert record when job fails", async () => {
      const mockAlert = {
        id: "alert-123",
        job_id: "job-123",
        alert_type: AlertType.JOB_FAILED,
        severity: AlertSeverity.ERROR,
        message: "Job job-123 failed after 3 attempts",
        created_at: new Date().toISOString(),
      };

      const insertMock = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockAlert, error: null }),
        })),
      }));

      const updateMock = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));

      mockSupabase.from
        .mockReturnValueOnce({ insert: insertMock })
        .mockReturnValueOnce({ update: updateMock });

      const job = {
        id: "job-123",
        job_type: "complete_analysis",
        project_id: "project-123",
        user_id: "user-123",
        retry_count: 2,
        retry_error_log: [],
      } as any;

      const error = new Error("Processing failed");

      await alertManager.sendJobFailedAlert(job, error);

      expect(insertMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalled();
    });

    it("should send email and Slack notifications", async () => {
      const mockAlert = {
        id: "alert-123",
        job_id: "job-123",
        alert_type: AlertType.JOB_FAILED,
        severity: AlertSeverity.ERROR,
        message: "Job failed",
        created_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockAlert, error: null }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      const job = {
        id: "job-123",
        retry_count: 2,
      } as any;

      const error = new Error("Test error");

      await alertManager.sendJobFailedAlert(job, error);

      const { sendEmailNotification, sendSlackNotification } = await import(
        "@/lib/alerts/notification-service"
      );

      expect(sendEmailNotification).toHaveBeenCalled();
      expect(sendSlackNotification).toHaveBeenCalled();
    });
  });

  describe("Job Stuck Alert", () => {
    it("should create alert for stuck jobs", async () => {
      const mockAlert = {
        id: "alert-123",
        job_id: "job-123",
        alert_type: AlertType.JOB_STUCK,
        severity: AlertSeverity.WARNING,
        message: "Job stuck",
        created_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockAlert, error: null }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      const job = {
        id: "job-123",
        job_type: "complete_analysis",
        project_id: "project-123",
        user_id: "user-123",
        started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        current_step: "Processing",
        progress_percent: 50,
      } as any;

      await alertManager.sendJobStuckAlert(job);

      const { sendEmailNotification } = await import(
        "@/lib/alerts/notification-service"
      );
      expect(sendEmailNotification).toHaveBeenCalled();
    });

    it("should skip alert if job has no start time", async () => {
      const job = {
        id: "job-123",
        started_at: null,
      } as any;

      await alertManager.sendJobStuckAlert(job);

      const { sendEmailNotification } = await import(
        "@/lib/alerts/notification-service"
      );
      expect(sendEmailNotification).not.toHaveBeenCalled();
    });
  });

  describe("High Error Rate Alert", () => {
    it("should create critical alert for high error rate", async () => {
      const mockAlert = {
        id: "alert-123",
        job_id: null,
        alert_type: AlertType.HIGH_ERROR_RATE,
        severity: AlertSeverity.CRITICAL,
        message: "High error rate",
        created_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockAlert, error: null }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      await alertManager.sendHighErrorRateAlert(15.5, "1 hour");

      const {
        sendEmailNotification,
        sendSlackNotification,
        sendPagerDutyNotification,
      } = await import("@/lib/alerts/notification-service");

      expect(sendEmailNotification).toHaveBeenCalled();
      expect(sendSlackNotification).toHaveBeenCalled();
      // PagerDuty only called if configured
      if (process.env.PAGERDUTY_KEY) {
        expect(sendPagerDutyNotification).toHaveBeenCalled();
      }
    });
  });

  describe("Check Stuck Jobs", () => {
    it("should detect and alert on stuck jobs", async () => {
      const stuckJobs = [
        {
          job_id: "job-123",
          started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          duration_minutes: 60,
          job_type: "complete_analysis",
          user_id: "user-123",
        },
      ];

      mockSupabase.rpc.mockResolvedValueOnce({
        data: stuckJobs,
        error: null,
      });

      const mockJob = {
        id: "job-123",
        started_at: stuckJobs[0].started_at,
        job_type: stuckJobs[0].job_type,
        user_id: stuckJobs[0].user_id,
        current_step: "Processing",
        progress_percent: 50,
        project_id: "project-123",
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: "alert-123" },
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      await alertManager.checkStuckJobs();

      expect(mockSupabase.rpc).toHaveBeenCalledWith("detect_stuck_jobs");
    });
  });

  describe("Check Error Rate", () => {
    it("should calculate error rate and alert if threshold exceeded", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 15.5, // 15.5% error rate (exceeds 10% threshold)
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: "alert-123" },
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      await alertManager.checkErrorRate("1 hour");

      expect(mockSupabase.rpc).toHaveBeenCalledWith("calculate_error_rate", {
        time_window: "1 hour",
      });
    });

    it("should not alert if error rate below threshold", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 5.0, // 5% error rate (below 10% threshold)
        error: null,
      });

      await alertManager.checkErrorRate("1 hour");

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe("Alert Management", () => {
    it("should fetch recent alerts", async () => {
      const mockAlerts = [
        { id: "alert-1", created_at: new Date().toISOString() },
        { id: "alert-2", created_at: new Date().toISOString() },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: mockAlerts, error: null }),
          })),
        })),
      });

      const alerts = await alertManager.getRecentAlerts(50);

      expect(alerts).toHaveLength(2);
      expect(mockSupabase.from).toHaveBeenCalledWith("job_alerts");
    });

    it("should fetch unacknowledged alerts", async () => {
      const mockAlerts = [{ id: "alert-1", acknowledged_at: null }];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          is: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: mockAlerts, error: null }),
          })),
        })),
      });

      const alerts = await alertManager.getUnacknowledgedAlerts();

      expect(alerts).toHaveLength(1);
    });

    it("should acknowledge alert", async () => {
      const updateMock = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));

      mockSupabase.from.mockReturnValue({
        update: updateMock,
      });

      await alertManager.acknowledgeAlert("alert-123", "user-123");

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          acknowledged_by: "user-123",
        }),
      );
    });
  });
});
