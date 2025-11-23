/**
 * OpenAPI Specification Endpoint
 *
 * GET /api/openapi.json - Returns the complete OpenAPI 3.0 specification
 *
 * This endpoint generates the spec dynamically by scanning all API routes
 * for JSDoc annotations and combining them with the base configuration.
 */

import { NextResponse } from "next/server";
import swaggerJsdoc from "swagger-jsdoc";
import { openApiDefinition } from "@/lib/api-docs/openapi-config";

const options: swaggerJsdoc.Options = {
  definition: openApiDefinition,
  apis: ["./app/api/**/*.ts", "./lib/api-docs/examples/**/*.ts"],
};

export async function GET() {
  try {
    const swaggerSpec = swaggerJsdoc(options);

    return NextResponse.json(swaggerSpec, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allow CORS for API testing tools
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error("Error generating OpenAPI spec:", error);
    return NextResponse.json(
      { error: "Failed to generate OpenAPI specification" },
      { status: 500 },
    );
  }
}
