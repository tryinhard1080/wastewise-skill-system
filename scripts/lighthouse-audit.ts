#!/usr/bin/env tsx

/**
 * Lighthouse Performance Audit Script
 *
 * Runs Lighthouse audits on all key pages and generates a performance report.
 *
 * Usage:
 *   pnpm add -D lighthouse puppeteer
 *   tsx scripts/lighthouse-audit.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

interface LighthouseResult {
  lhr: {
    finalUrl: string;
    categories: {
      performance: { score: number };
      accessibility: { score: number };
      "best-practices": { score: number };
      seo: { score: number };
    };
    audits: {
      "first-contentful-paint": { numericValue: number; displayValue: string };
      "largest-contentful-paint": {
        numericValue: number;
        displayValue: string;
      };
      "total-blocking-time": { numericValue: number; displayValue: string };
      "cumulative-layout-shift": { numericValue: number; displayValue: string };
      "speed-index": { numericValue: number; displayValue: string };
      interactive: { numericValue: number; displayValue: string };
    };
  };
  report: string;
}

const PAGES_TO_TEST = [
  { name: "Landing Page", url: "/" },
  { name: "Login Page", url: "/login" },
  { name: "Dashboard", url: "/dashboard", requiresAuth: true },
  // Note: Project-specific pages require dynamic IDs
  // These will be tested separately with real project IDs
];

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function runLighthouseAudit(url: string, name: string): Promise<any> {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"],
  });

  const options = {
    logLevel: "info" as const,
    output: "html" as const,
    port: chrome.port,
  };

  const fullUrl = `${BASE_URL}${url}`;
  console.log(`\n🔍 Running Lighthouse audit for: ${name} (${fullUrl})`);

  try {
    const runnerResult = (await lighthouse(
      fullUrl,
      options,
    )) as LighthouseResult;

    await chrome.kill();

    const { lhr } = runnerResult;

    const result = {
      name,
      url,
      scores: {
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(lhr.categories["best-practices"].score * 100),
        seo: Math.round(lhr.categories.seo.score * 100),
      },
      metrics: {
        fcp: {
          value: lhr.audits["first-contentful-paint"].numericValue,
          display: lhr.audits["first-contentful-paint"].displayValue,
        },
        lcp: {
          value: lhr.audits["largest-contentful-paint"].numericValue,
          display: lhr.audits["largest-contentful-paint"].displayValue,
        },
        tbt: {
          value: lhr.audits["total-blocking-time"].numericValue,
          display: lhr.audits["total-blocking-time"].displayValue,
        },
        cls: {
          value: lhr.audits["cumulative-layout-shift"].numericValue,
          display: lhr.audits["cumulative-layout-shift"].displayValue,
        },
        tti: {
          value: lhr.audits.interactive.numericValue,
          display: lhr.audits.interactive.displayValue,
        },
        speedIndex: {
          value: lhr.audits["speed-index"].numericValue,
          display: lhr.audits["speed-index"].displayValue,
        },
      },
      report: runnerResult.report,
    };

    console.log(`✅ Performance Score: ${result.scores.performance}/100`);
    console.log(`   - FCP: ${result.metrics.fcp.display}`);
    console.log(`   - LCP: ${result.metrics.lcp.display}`);
    console.log(`   - TBT: ${result.metrics.tbt.display}`);
    console.log(`   - CLS: ${result.metrics.cls.display}`);

    return result;
  } catch (error) {
    await chrome.kill();
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting Lighthouse Performance Audit");
  console.log(`📍 Base URL: ${BASE_URL}`);

  // Create reports directory
  const reportsDir = join(process.cwd(), "lighthouse-reports");
  mkdirSync(reportsDir, { recursive: true });

  const results = [];

  for (const page of PAGES_TO_TEST) {
    if (page.requiresAuth) {
      console.log(`\n⏭️  Skipping ${page.name} (requires authentication)`);
      continue;
    }

    try {
      const result = await runLighthouseAudit(page.url, page.name);
      results.push(result);

      // Save individual HTML report
      const sanitizedName = page.name.replace(/\s+/g, "-").toLowerCase();
      const reportPath = join(reportsDir, `${sanitizedName}.html`);
      writeFileSync(reportPath, result.report);
      console.log(`📄 Report saved to: ${reportPath}`);
    } catch (error) {
      console.error(`❌ Error auditing ${page.name}:`, error);
    }
  }

  // Generate summary report
  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    results: results.map((r) => ({
      name: r.name,
      url: r.url,
      scores: r.scores,
      metrics: r.metrics,
    })),
    averagePerformanceScore: Math.round(
      results.reduce((sum, r) => sum + r.scores.performance, 0) /
        results.length,
    ),
    passingPages: results.filter((r) => r.scores.performance >= 90).length,
    totalPages: results.length,
  };

  const summaryPath = join(reportsDir, "summary.json");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log("📊 LIGHTHOUSE AUDIT SUMMARY");
  console.log("=".repeat(60));
  console.log(
    `Average Performance Score: ${summary.averagePerformanceScore}/100`,
  );
  console.log(
    `Pages Scoring ≥90: ${summary.passingPages}/${summary.totalPages}`,
  );
  console.log(`Reports saved to: ${reportsDir}`);
  console.log("=".repeat(60));

  // Exit with error if average score is below 90
  if (summary.averagePerformanceScore < 90) {
    console.log("\n❌ FAILED: Average performance score is below 90");
    process.exit(1);
  } else {
    console.log("\n✅ PASSED: All pages meet performance targets");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
