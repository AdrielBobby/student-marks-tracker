/**
 * lib/prisma.ts — Prisma v7 Client Singleton with better-sqlite3 Driver Adapter
 *
 * Prisma v7 Architecture Notes:
 *  - provider = "prisma-client" (new TypeScript-native generator)
 *  - Driver adapters are REQUIRED — no built-in query engine for SQLite in v7.
 *  - @prisma/adapter-better-sqlite3 connects via the native better-sqlite3 binding.
 *  - PrismaBetterSqlite3 accepts { url } — NOT a raw Database instance.
 *  - The singleton pattern prevents connection exhaustion during Next.js hot reloads.
 *  - dotenv is NOT imported here — Next.js already exposes process.env in API routes.
 *    (dotenv is only needed in prisma.config.ts and standalone scripts like test-db.ts)
 */

import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Attach to globalThis so the instance survives hot module replacement in dev.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

/**
 * The Prisma client singleton.
 * Always defined — safe to import and use in any server-side context.
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());
