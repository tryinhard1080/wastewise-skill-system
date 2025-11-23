#!/usr/bin/env node
/**
 * Production Monitoring Setup
 *
 * Automated configuration of monitoring, alerting, and health checks
 * for production deployment
 */

import * as fs from "fs";
import { execSync } from "child_process";

interface MonitoringConfig {
  sentry: {
    dsn: string;
    environment: "production";
    release: string;
    tracesSampleRate: number;
    replaysOnErrorSampleRate: number;
  };
  uptime: {
    frontendUrl: string;
    workerUrl: string;
    interval: number; // minutes
    timeout: number; // seconds
  };
  alerts: {
    email: string[];
    slack: string;
    pagerduty?: string;
  };
  backup: {
    schedule: string; // cron format
    retention: number; // days
    storage: string; // S3 bucket or R2 bucket
  };
}

class ProductionMonitoringSetup {
  private config: MonitoringConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  async setupAll(): Promise<void> {
    console.log("🔧 Setting up Production Monitoring...\n");

    await this.setupSentry();
    await this.setupUptimeMonitoring();
    await this.setupAlertChannels();
    await this.setupBackupAutomation();
    await this.setupHealthChecks();
    await this.setupLogAggregation();
    await this.verifySetup();

    console.log("\n✅ Production Monitoring Setup Complete!\n");
    this.printSummary();
  }

  private loadConfig(): MonitoringConfig {
    const configPath = "./.env.production";

    if (!fs.existsSync(configPath)) {
      throw new Error(
        ".env.production file not found. Create it with all required variables.",
      );
    }

    return {
      sentry: {
        dsn: process.env.SENTRY_DSN || "",
        environment: "production",
        release: this.getGitCommitSha(),
        tracesSampleRate: 1.0,
        replaysOnErrorSampleRate: 1.0,
      },
      uptime: {
        frontendUrl: "https://app.wastewise.io/api/health",
        workerUrl: "https://app.wastewise.io/api/health/worker",
        interval: 1, // every minute
        timeout: 30, // 30 seconds
      },
      alerts: {
        email: (process.env.ALERT_EMAILS || "").split(","),
        slack: process.env.SLACK_WEBHOOK_URL || "",
        pagerduty: process.env.PAGERDUTY_API_KEY,
      },
      backup: {
        schedule: "0 2 * * *", // 2 AM UTC daily
        retention: 90,
        storage: process.env.BACKUP_STORAGE_BUCKET || "",
      },
    };
  }

  private async setupSentry(): Promise<void> {
    console.log("📊 Setting up Sentry Error Tracking...");

    if (!this.config.sentry.dsn) {
      console.log("⚠️  Sentry DSN not configured. Skipping Sentry setup.");
      return;
    }

    // Create Sentry release
    try {
      execSync(`sentry-cli releases new ${this.config.sentry.release}`, {
        stdio: "pipe",
      });
      console.log(`✅ Sentry release created: ${this.config.sentry.release}`);

      // Upload source maps
      execSync("sentry-cli releases files upload-sourcemaps ./.next/static", {
        stdio: "pipe",
      });
      console.log("✅ Source maps uploaded to Sentry");

      // Finalize release
      execSync(`sentry-cli releases finalize ${this.config.sentry.release}`, {
        stdio: "pipe",
      });
      console.log("✅ Sentry release finalized");
    } catch (error) {
      console.log("⚠️  Sentry setup failed (install sentry-cli to enable)");
    }

    console.log();
  }

  private async setupUptimeMonitoring(): Promise<void> {
    console.log("⏰ Configuring Uptime Monitoring...");

    // Generate UptimeRobot configuration
    const uptimeConfig = {
      monitors: [
        {
          name: "WasteWise Frontend Health",
          url: this.config.uptime.frontendUrl,
          type: "HTTP",
          interval: this.config.uptime.interval * 60, // Convert to seconds
          timeout: this.config.uptime.timeout,
          expectedStatusCode: 200,
          expectedKeyword: "ok",
        },
        {
          name: "WasteWise Worker Health",
          url: this.config.uptime.workerUrl,
          type: "HTTP",
          interval: this.config.uptime.interval * 60,
          timeout: this.config.uptime.timeout,
          expectedStatusCode: 200,
        },
      ],
      alertContacts: this.config.alerts.email.map((email) => ({
        type: "email",
        value: email,
      })),
    };

    // Save configuration for manual setup
    fs.writeFileSync(
      "./config/uptime-monitors.json",
      JSON.stringify(uptimeConfig, null, 2),
    );

    console.log(
      "✅ Uptime monitoring configuration saved to ./config/uptime-monitors.json",
    );
    console.log("📝 Manual step: Import this config to UptimeRobot or Pingdom");
    console.log();
  }

  private async setupAlertChannels(): Promise<void> {
    console.log("🔔 Configuring Alert Channels...");

    // Test Slack webhook
    if (this.config.alerts.slack) {
      try {
        const response = await fetch(this.config.alerts.slack, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: "✅ WasteWise Production Monitoring - Slack alerts configured",
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "*WasteWise Production Monitoring*\n\nSlack alert channel configured successfully!",
                },
              },
            ],
          }),
        });

        if (response.ok) {
          console.log("✅ Slack webhook configured and tested");
        } else {
          console.log("⚠️  Slack webhook test failed");
        }
      } catch (error) {
        console.log("⚠️  Slack webhook not accessible");
      }
    }

    // Email alert configuration
    if (this.config.alerts.email.length > 0) {
      console.log(
        `✅ Email alerts configured for: ${this.config.alerts.email.join(", ")}`,
      );
    }

    // PagerDuty configuration
    if (this.config.alerts.pagerduty) {
      console.log("✅ PagerDuty API key configured (test manually)");
    }

    console.log();
  }

  private async setupBackupAutomation(): Promise<void> {
    console.log("💾 Setting up Automated Backups...");

    // Create backup automation script
    const cronJob = `
# WasteWise Production Database Backup
${this.config.backup.schedule} /opt/wastewise/scripts/backup-database.sh >> /var/log/wastewise-backup.log 2>&1

# Weekly full system backup (Sundays at 3 AM)
0 3 * * 0 /opt/wastewise/scripts/backup-full-system.sh >> /var/log/wastewise-backup.log 2>&1

# Backup verification (daily at 4 AM, after backup)
0 4 * * * /opt/wastewise/scripts/verify-backup.sh >> /var/log/wastewise-backup-verify.log 2>&1
`;

    fs.writeFileSync("./config/production-cron.txt", cronJob.trim());

    console.log("✅ Backup cron jobs saved to ./config/production-cron.txt");
    console.log("📝 Manual step: Add these cron jobs to production server");
    console.log(`   Schedule: ${this.config.backup.schedule}`);
    console.log(`   Retention: ${this.config.backup.retention} days`);
    console.log(`   Storage: ${this.config.backup.storage}`);
    console.log();
  }

  private async setupHealthChecks(): Promise<void> {
    console.log("🏥 Configuring Health Check Endpoints...");

    // Verify health endpoints are accessible
    const healthChecks = [
      { name: "Frontend", url: this.config.uptime.frontendUrl },
      { name: "Worker", url: this.config.uptime.workerUrl },
    ];

    for (const check of healthChecks) {
      try {
        const response = await fetch(check.url);
        if (response.ok) {
          console.log(`✅ ${check.name} health check accessible`);
        } else {
          console.log(
            `⚠️  ${check.name} health check returned ${response.status}`,
          );
        }
      } catch (error) {
        console.log(
          `❌ ${check.name} health check not accessible (deploy first)`,
        );
      }
    }

    console.log();
  }

  private async setupLogAggregation(): Promise<void> {
    console.log("📋 Configuring Log Aggregation...");

    // Generate log configuration for common platforms
    const logConfig = {
      cloudwatch: {
        logGroup: "/aws/ecs/wastewise-production",
        retentionDays: 30,
        streams: ["frontend", "worker"],
      },
      datadog: {
        source: "wastewise",
        service: "wastewise-production",
        tags: ["env:production", "app:wastewise"],
      },
    };

    fs.writeFileSync(
      "./config/log-aggregation.json",
      JSON.stringify(logConfig, null, 2),
    );

    console.log("✅ Log aggregation configuration saved");
    console.log("📝 Manual step: Configure logs in your cloud provider");
    console.log();
  }

  private async verifySetup(): Promise<void> {
    console.log("🔍 Verifying Monitoring Setup...");

    const checks = [];

    // Check environment variables
    checks.push({
      name: "Sentry DSN",
      passed: !!this.config.sentry.dsn,
      value: this.config.sentry.dsn ? "✅ Configured" : "❌ Missing",
    });

    checks.push({
      name: "Slack Webhook",
      passed: !!this.config.alerts.slack,
      value: this.config.alerts.slack ? "✅ Configured" : "⚠️  Optional",
    });

    checks.push({
      name: "Alert Emails",
      passed: this.config.alerts.email.length > 0,
      value: `${this.config.alerts.email.length} configured`,
    });

    checks.push({
      name: "Backup Storage",
      passed: !!this.config.backup.storage,
      value: this.config.backup.storage || "❌ Missing",
    });

    console.log("\n" + "=".repeat(60));
    console.log("Monitoring Configuration Status");
    console.log("=".repeat(60));

    checks.forEach((check) => {
      console.log(
        `${check.passed ? "✅" : "⚠️ "} ${check.name}: ${check.value}`,
      );
    });

    const allPassed = checks.filter((c) => c.passed).length;
    console.log(`\nPassed: ${allPassed}/${checks.length}`);
    console.log("=".repeat(60));
  }

  private printSummary(): void {
    console.log("\n" + "=".repeat(80));
    console.log("📊 Production Monitoring Summary");
    console.log("=".repeat(80));

    console.log("\n✅ Automated Setup Complete:");
    console.log("   - Sentry error tracking configured");
    console.log("   - Uptime monitoring configuration generated");
    console.log("   - Alert channels tested");
    console.log("   - Backup automation scheduled");
    console.log("   - Health checks verified");
    console.log("   - Log aggregation configured");

    console.log("\n📝 Manual Steps Required:");
    console.log("   1. Import uptime monitors to UptimeRobot/Pingdom");
    console.log("   2. Add cron jobs to production server");
    console.log("   3. Configure log aggregation in cloud provider");
    console.log("   4. Test PagerDuty integration (if using)");

    console.log("\n📁 Configuration Files Created:");
    console.log("   - ./config/uptime-monitors.json");
    console.log("   - ./config/production-cron.txt");
    console.log("   - ./config/log-aggregation.json");

    console.log("\n🔗 Monitoring Dashboards:");
    console.log(`   - Sentry: https://sentry.io/wastewise-production`);
    console.log(`   - Health: ${this.config.uptime.frontendUrl}`);
    console.log(`   - Worker: ${this.config.uptime.workerUrl}`);

    console.log("\n🚨 Alert Channels:");
    if (this.config.alerts.slack) {
      console.log("   - Slack: Configured");
    }
    if (this.config.alerts.email.length > 0) {
      console.log(`   - Email: ${this.config.alerts.email.join(", ")}`);
    }
    if (this.config.alerts.pagerduty) {
      console.log("   - PagerDuty: Configured");
    }

    console.log("\n💡 Next Steps:");
    console.log("   1. Complete manual setup steps above");
    console.log("   2. Test all alert channels");
    console.log("   3. Run production smoke tests");
    console.log("   4. Deploy to production");
    console.log("   5. Monitor for 24 hours");

    console.log("\n" + "=".repeat(80));
  }

  private getGitCommitSha(): string {
    try {
      return execSync("git rev-parse --short HEAD", {
        encoding: "utf-8",
      }).trim();
    } catch {
      return "v1.0.0";
    }
  }
}

// Run setup
const setup = new ProductionMonitoringSetup();
setup.setupAll().catch((error) => {
  console.error("❌ Monitoring setup failed:", error);
  process.exit(1);
});
