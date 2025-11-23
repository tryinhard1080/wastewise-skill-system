/**
 * Sandbox Compliance Tests
 *
 * Validates that Claude Code sandboxing is properly configured and enforced
 * for the WasteWise project.
 *
 * @note These tests verify configuration, not runtime sandbox enforcement
 * (which is handled by Claude Code internally).
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import {
  logFilesystemViolation,
  logNetworkViolation,
  logCommandViolation,
  getSandboxStats,
  getRecentViolations,
  detectSuspiciousPatterns,
  clearViolationHistory,
  exportViolations,
} from "@/lib/observability/sandbox-logger";

describe("Sandbox Configuration", () => {
  describe("Configuration Files", () => {
    it("should have main sandbox.json configuration", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const exists = await fs
        .access(configPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it("should have valid JSON in sandbox.json", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("should define filesystem boundaries", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      expect(config.filesystem).toBeDefined();
      expect(config.filesystem.allowed_write_paths).toBeDefined();
      expect(config.filesystem.denied_paths).toBeDefined();
      expect(Array.isArray(config.filesystem.allowed_write_paths)).toBe(true);
      expect(Array.isArray(config.filesystem.denied_paths)).toBe(true);
    });

    it("should define network boundaries", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      expect(config.network).toBeDefined();
      expect(config.network.allowed_domains).toBeDefined();
      expect(Array.isArray(config.network.allowed_domains)).toBe(true);
    });

    it("should define command exclusions", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      expect(config.commands).toBeDefined();
      expect(config.commands.excluded).toBeDefined();
      expect(Array.isArray(config.commands.excluded)).toBe(true);
    });
  });

  describe("Profile Configurations", () => {
    it("should have all 4 profile files", async () => {
      const profiles = [
        "wastewise-dev.json",
        "wastewise-testing.json",
        "wastewise-docs.json",
        "wastewise-readonly.json",
      ];

      for (const profile of profiles) {
        const profilePath = path.join(
          process.cwd(),
          ".claude",
          "profiles",
          profile,
        );
        const exists = await fs
          .access(profilePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      }
    });

    it("should have valid JSON in all profiles", async () => {
      const profiles = [
        "wastewise-dev.json",
        "wastewise-testing.json",
        "wastewise-docs.json",
        "wastewise-readonly.json",
      ];

      for (const profile of profiles) {
        const profilePath = path.join(
          process.cwd(),
          ".claude",
          "profiles",
          profile,
        );
        const content = await fs.readFile(profilePath, "utf-8");
        expect(
          () => JSON.parse(content),
          `${profile} should be valid JSON`,
        ).not.toThrow();
      }
    });

    it("should have profile_name in each profile", async () => {
      const profiles = [
        "wastewise-dev.json",
        "wastewise-testing.json",
        "wastewise-docs.json",
        "wastewise-readonly.json",
      ];

      for (const profile of profiles) {
        const profilePath = path.join(
          process.cwd(),
          ".claude",
          "profiles",
          profile,
        );
        const content = await fs.readFile(profilePath, "utf-8");
        const config = JSON.parse(content);
        expect(config.profile_name).toBeDefined();
        expect(typeof config.profile_name).toBe("string");
      }
    });
  });

  describe("Protected Resources", () => {
    it("should deny .env files", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const deniedPaths = config.filesystem.denied_paths;
      const hasEnvDenied = deniedPaths.some((path: string) =>
        path.includes(".env"),
      );
      expect(hasEnvDenied).toBe(true);
    });

    it("should deny credentials.json", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const deniedPaths = config.filesystem.denied_paths;
      const hasCredentialsDenied = deniedPaths.some((path: string) =>
        path.includes("credentials.json"),
      );
      expect(hasCredentialsDenied).toBe(true);
    });

    it("should deny supabase config.toml", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const deniedPaths = config.filesystem.denied_paths;
      const hasConfigDenied = deniedPaths.some((path: string) =>
        path.includes("config.toml"),
      );
      expect(hasConfigDenied).toBe(true);
    });

    it("should deny node_modules", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const deniedPaths = config.filesystem.denied_paths;
      const hasNodeModulesDenied = deniedPaths.some((path: string) =>
        path.includes("node_modules"),
      );
      expect(hasNodeModulesDenied).toBe(true);
    });

    it("should deny .git directory", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const deniedPaths = config.filesystem.denied_paths;
      const hasGitDenied = deniedPaths.some((path: string) =>
        path.includes(".git"),
      );
      expect(hasGitDenied).toBe(true);
    });
  });

  describe("Allowed Resources", () => {
    it("should allow project directories", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const allowedPaths = config.filesystem.allowed_write_paths;
      const requiredDirs = [
        "./app/**",
        "./components/**",
        "./lib/**",
        "./__tests__/**",
      ];

      for (const dir of requiredDirs) {
        const isAllowed = allowedPaths.includes(dir);
        expect(isAllowed, `${dir} should be in allowed_write_paths`).toBe(true);
      }
    });
  });

  describe("Network Boundaries", () => {
    it("should allow Anthropic API", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const allowedDomains = config.network.allowed_domains;
      const hasAnthropicAPI = allowedDomains.some((domain: string) =>
        domain.includes("anthropic.com"),
      );
      expect(hasAnthropicAPI).toBe(true);
    });

    it("should allow Supabase domains", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const allowedDomains = config.network.allowed_domains;
      const hasSupabase = allowedDomains.some((domain: string) =>
        domain.includes("supabase.co"),
      );
      expect(hasSupabase).toBe(true);
    });

    it("should allow Upstash domains", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const allowedDomains = config.network.allowed_domains;
      const hasUpstash = allowedDomains.some((domain: string) =>
        domain.includes("upstash.io"),
      );
      expect(hasUpstash).toBe(true);
    });

    it("should not have suspicious domains", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const allowedDomains = config.network.allowed_domains;
      const suspiciousDomains = ["malicious.com", "evil.com", "attacker.net"];

      for (const suspiciousDomain of suspiciousDomains) {
        const hasSuspicious = allowedDomains.some((domain: string) =>
          domain.includes(suspiciousDomain),
        );
        expect(hasSuspicious).toBe(false);
      }
    });
  });

  describe("Command Exclusions", () => {
    it("should exclude git", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const excludedCommands = config.commands.excluded;
      expect(excludedCommands).toContain("git");
    });

    it("should exclude supabase", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const excludedCommands = config.commands.excluded;
      expect(excludedCommands).toContain("supabase");
    });

    it("should exclude docker", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      const excludedCommands = config.commands.excluded;
      expect(excludedCommands).toContain("docker");
    });

    it("should have auto_approve_in_sandbox enabled", async () => {
      const configPath = path.join(process.cwd(), ".claude", "sandbox.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      expect(config.commands.auto_approve_in_sandbox).toBe(true);
    });
  });
});

describe("Sandbox Audit Logger", () => {
  beforeEach(() => {
    // Clear violation history before each test
    clearViolationHistory();
  });

  describe("Violation Logging", () => {
    it("should log filesystem violations", () => {
      logFilesystemViolation("write", ".env", false, "frontend-dev");

      const stats = getSandboxStats();
      expect(stats.total_violations).toBe(1);
      expect(stats.violations_by_type.filesystem_write).toBe(1);
    });

    it("should log network violations", () => {
      logNetworkViolation("malicious.com", "https://malicious.com/api", false);

      const stats = getSandboxStats();
      expect(stats.total_violations).toBe(1);
      expect(stats.violations_by_type.network_request).toBe(1);
    });

    it("should log command violations", () => {
      logCommandViolation("rm", ["-rf", "/"], false);

      const stats = getSandboxStats();
      expect(stats.total_violations).toBe(1);
      expect(stats.violations_by_type.command_execution).toBe(1);
    });

    it("should track approved vs denied violations", () => {
      logFilesystemViolation("read", ".env", false); // Denied
      logFilesystemViolation("write", "app/page.tsx", true); // Approved

      const stats = getSandboxStats();
      expect(stats.total_violations).toBe(2);
      expect(stats.approved_violations).toBe(1);
      expect(stats.denied_violations).toBe(1);
    });
  });

  describe("Severity Detection", () => {
    it("should mark .env access as critical", () => {
      logFilesystemViolation("read", ".env", false);

      const recent = getRecentViolations(1);
      expect(recent[0].severity).toBe("critical");
    });

    it("should mark credentials access as critical", () => {
      logFilesystemViolation("read", ".credentials.json", false);

      const recent = getRecentViolations(1);
      expect(recent[0].severity).toBe("critical");
    });

    it("should mark secret access as critical", () => {
      logFilesystemViolation("read", "secrets/api-key.txt", false);

      const recent = getRecentViolations(1);
      expect(recent[0].severity).toBe("critical");
    });

    it("should mark filesystem delete as high severity", () => {
      logFilesystemViolation("delete", "important-file.ts", false);

      const recent = getRecentViolations(1);
      expect(recent[0].severity).toBe("high");
    });

    it("should mark filesystem write as medium severity", () => {
      logFilesystemViolation("write", "/etc/hosts", false);

      const recent = getRecentViolations(1);
      expect(recent[0].severity).toBe("medium");
    });

    it("should mark read attempts as low severity", () => {
      logFilesystemViolation("read", "package.json", false);

      const recent = getRecentViolations(1);
      expect(recent[0].severity).toBe("low");
    });
  });

  describe("Statistics", () => {
    it("should calculate total violations", () => {
      logFilesystemViolation("read", ".env", false);
      logNetworkViolation("evil.com", "https://evil.com", false);
      logCommandViolation("dangerous", [], false);

      const stats = getSandboxStats();
      expect(stats.total_violations).toBe(3);
    });

    it("should group violations by type", () => {
      logFilesystemViolation("read", "file1", false);
      logFilesystemViolation("write", "file2", false);
      logNetworkViolation("domain1", "https://domain1.com", false);

      const stats = getSandboxStats();
      expect(stats.violations_by_type.filesystem_read).toBe(1);
      expect(stats.violations_by_type.filesystem_write).toBe(1);
      expect(stats.violations_by_type.network_request).toBe(1);
    });

    it("should group violations by severity", () => {
      logFilesystemViolation("read", ".env", false); // Critical
      logFilesystemViolation("delete", "file", false); // High
      logFilesystemViolation("write", "/path", false); // Medium

      const stats = getSandboxStats();
      expect(stats.violations_by_severity.critical).toBe(1);
      expect(stats.violations_by_severity.high).toBe(1);
      expect(stats.violations_by_severity.medium).toBe(1);
    });

    it("should track most common resources", () => {
      // Access same resource multiple times
      for (let i = 0; i < 5; i++) {
        logFilesystemViolation("read", ".env", false);
      }
      logFilesystemViolation("read", ".credentials.json", false);

      const stats = getSandboxStats();
      expect(stats.most_common_resources.length).toBeGreaterThan(0);
      expect(stats.most_common_resources[0].resource).toBe(".env");
      expect(stats.most_common_resources[0].count).toBe(5);
    });
  });

  describe("Suspicious Pattern Detection", () => {
    it("should detect multiple critical violations", () => {
      // Log 4 critical violations (threshold is 3)
      for (let i = 0; i < 4; i++) {
        logFilesystemViolation("read", ".env", false);
      }

      const patterns = detectSuspiciousPatterns();
      expect(patterns.suspicious).toBe(true);
      expect(patterns.reasons.length).toBeGreaterThan(0);
      expect(patterns.recommendations.length).toBeGreaterThan(0);
    });

    it("should detect high denial rate", () => {
      // Log mostly denied violations
      for (let i = 0; i < 10; i++) {
        logFilesystemViolation("read", "file", false); // Denied
      }
      logFilesystemViolation("write", "app/page.tsx", true); // Approved

      const patterns = detectSuspiciousPatterns();
      expect(patterns.suspicious).toBe(true);
    });

    it("should detect repeated access attempts", () => {
      // Access same resource 6 times (threshold is 5)
      for (let i = 0; i < 6; i++) {
        logFilesystemViolation("read", "secrets/api-key.txt", false);
      }

      const patterns = detectSuspiciousPatterns();
      expect(patterns.suspicious).toBe(true);
    });

    it("should not flag normal usage", () => {
      // Log reasonable violations
      logFilesystemViolation("write", "app/page.tsx", true);
      logFilesystemViolation("read", "lib/utils.ts", true);

      const patterns = detectSuspiciousPatterns();
      expect(patterns.suspicious).toBe(false);
      expect(patterns.reasons.length).toBe(0);
    });
  });

  describe("Export Functionality", () => {
    it("should export violations as JSON", () => {
      logFilesystemViolation("read", ".env", false);
      logNetworkViolation("evil.com", "https://evil.com", false);

      const exported = exportViolations();
      expect(() => JSON.parse(exported)).not.toThrow();

      const data = JSON.parse(exported);
      expect(data.stats).toBeDefined();
      expect(data.violations).toBeDefined();
      expect(data.exported_at).toBeDefined();
    });

    it("should include all violation data in export", () => {
      logFilesystemViolation("read", ".env", false, "frontend-dev");

      const exported = exportViolations();
      const data = JSON.parse(exported);

      expect(data.violations.length).toBe(1);
      expect(data.violations[0].type).toBe("filesystem_read");
      expect(data.violations[0].resource).toBe(".env");
      expect(data.violations[0].agent).toBe("frontend-dev");
    });
  });

  describe("Clear History", () => {
    it("should clear all violations", () => {
      logFilesystemViolation("read", "file1", false);
      logFilesystemViolation("read", "file2", false);

      let stats = getSandboxStats();
      expect(stats.total_violations).toBe(2);

      clearViolationHistory();

      stats = getSandboxStats();
      expect(stats.total_violations).toBe(0);
    });
  });
});

describe("Documentation", () => {
  it("should have comprehensive sandboxing guide", async () => {
    const guidePath = path.join(process.cwd(), "docs", "SANDBOXING.md");
    const exists = await fs
      .access(guidePath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("should have quick reference", async () => {
    const quickRefPath = path.join(
      process.cwd(),
      ".claude",
      "SANDBOX_QUICK_REF.md",
    );
    const exists = await fs
      .access(quickRefPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("should have profile README", async () => {
    const readmePath = path.join(
      process.cwd(),
      ".claude",
      "profiles",
      "README.md",
    );
    const exists = await fs
      .access(readmePath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("should document sandboxing in SECURITY.md", async () => {
    const securityPath = path.join(process.cwd(), "docs", "SECURITY.md");
    const content = await fs.readFile(securityPath, "utf-8");
    expect(content.toLowerCase()).toContain("sandbox");
  });

  it("should document sandboxing in project CLAUDE.md", async () => {
    const claudePath = path.join(process.cwd(), ".claude", "CLAUDE.md");
    const content = await fs.readFile(claudePath, "utf-8");
    expect(content.toLowerCase()).toContain("sandbox");
  });
});
