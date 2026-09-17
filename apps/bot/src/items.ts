import { normalizeAlias } from "@tvc/core";
import type { PrismaClient } from "@tvc/db";
import type { ItemRepository, ItemWithValues } from "./types.ts";

export function createItemRepository(
  db: PrismaClient,
  cacheTtlMs: number,
): ItemRepository {
  let cached: { names: string[]; expiresAt: number } | undefined;

  async function names(): Promise<string[]> {
    if (cached && cached.expiresAt > Date.now()) return cached.names;

    const rows = await db.item.findMany({
      where: { deletedAt: null },
      select: { name: true },
      orderBy: { name: "asc" },
    });
    cached = {
      names: rows.map((row) => row.name),
      expiresAt: Date.now() + cacheTtlMs,
    };
    return cached.names;
  }

  async function find(query: string): Promise<ItemWithValues[]> {
    const exact = await db.item.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { name: { equals: query, mode: "insensitive" } },
          { slug: { equals: query, mode: "insensitive" } },
        ],
      },
      include: { values: true },
    });
    if (exact) return [exact];

    return db.item.findMany({
      where: {
        deletedAt: null,
        aliases: { some: { normalized: normalizeAlias(query) } },
      },
      include: { values: true },
      orderBy: { name: "asc" },
    });
  }

  return { names, find };
}
