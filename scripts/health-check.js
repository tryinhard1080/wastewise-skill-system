/**
 * Health Check Script for Docker Container
 *
 * Simple health check that validates database connectivity.
 * Used by Docker HEALTHCHECK instruction.
 *
 * Exit codes:
 *   0 = healthy
 *   1 = unhealthy
 */

const https = require("https");
const http = require("http");

const TIMEOUT_MS = 5000;

/**
 * Check if Supabase database is accessible
 */
async function checkDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Health check failed: Missing environment variables");
    return false;
  }

  return new Promise((resolve) => {
    const url = new URL(supabaseUrl);
    const protocol = url.protocol === "https:" ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: "/rest/v1/",
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      timeout: TIMEOUT_MS,
    };

    const req = protocol.request(options, (res) => {
      if (
        res.statusCode === 200 ||
        res.statusCode === 401 ||
        res.statusCode === 403
      ) {
        // 200 = OK, 401/403 = authenticated but unauthorized (DB is responding)
        resolve(true);
      } else {
        console.error(
          `Health check failed: Unexpected status code ${res.statusCode}`,
        );
        resolve(false);
      }
    });

    req.on("error", (error) => {
      console.error("Health check failed:", error.message);
      resolve(false);
    });

    req.on("timeout", () => {
      console.error("Health check failed: Request timeout");
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Main health check
 */
async function main() {
  try {
    const isHealthy = await checkDatabase();

    if (isHealthy) {
      console.log("Health check passed");
      process.exit(0);
    } else {
      console.error("Health check failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("Health check error:", error.message);
    process.exit(1);
  }
}

main();
