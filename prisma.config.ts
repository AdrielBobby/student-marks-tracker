// prisma.config.ts — Prisma v7 configuration
//
// In Prisma v7, ALL datasource connection URLs must live here (not in schema.prisma).
// The `env()` helper from "prisma/config" is the correct way to read env vars for CLI commands.
// The `import "dotenv/config"` line ensures .env is loaded before Prisma reads process.env.

// Only load .env file in development; in production DATABASE_URL is injected by the environment
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Reads DATABASE_URL from .env file (e.g., "file:./prisma/dev.db")
    url: env("DATABASE_URL"),
  },
});
