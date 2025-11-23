import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local for tests
dotenv.config({ path: ".env.local" });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Make environment variables available in tests
    env: process.env as Record<string, string>,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
