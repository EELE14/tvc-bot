import { createPrismaClient, type PrismaClient } from "@tvc/db";

const globalForDb = globalThis as { prisma?: PrismaClient };

function connect(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return createPrismaClient(url);
}

export const db: PrismaClient = (globalForDb.prisma ??= connect());
