import { NextRequest, NextResponse } from "next/server";

/**
 * Sentry Test Endpoint
 *
 * Throws an intentional error to test Sentry integration.
 * Only available in development mode for security.
 *
 * @throws {Error} Always throws to test error tracking
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 },
    );
  }

  throw new Error("Sentry test error - this is intentional");
}
