/**
 * Swagger JSDoc Configuration
 *
 * This file configures swagger-jsdoc to scan API routes and generate
 * the complete OpenAPI specification.
 */

import swaggerJsdoc from "swagger-jsdoc";
import { openApiDefinition } from "./openapi-config";

const options: swaggerJsdoc.Options = {
  definition: openApiDefinition,
  apis: ["./app/api/**/*.ts", "./lib/api-docs/examples/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
