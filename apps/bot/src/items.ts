import { normalizeAlias } from "@tvc/core";
import type { PrismaClient } from "@tvc/db";
import type {
  CatalogueEntry,
  ItemRepository,
  ItemWithValues,
} from "./types.ts";

export function createItemRepository(
  db: PrismaClient,
  cacheTtlMs: number,
): ItemRepository {
  let cached: { entries: CatalogueEntry[]; expiresAt: number } | undefined;
  let refreshing: Promise<CatalogueEntry[]> | undefined;

  async function load(): Promise<CatalogueEntry[]> {
    const rows = await db.item.findMany({
      where: { deletedAt: null },
      select: { name: true, slug: true, aliases: { select: { alias: true } } },
      orderBy: { name: "asc" },
    });
    cached = {
      entries: rows.map((row) => ({
        name: row.name,
        slug: row.slug,
        aliases: row.aliases.map(({ alias }) => alias),
      })),
      expiresAt: Date.now() + cacheTtlMs,
    };
    return cached.entries;
  }

  function refresh(): Promise<CatalogueEntry[]> {
    refreshing ??= load().finally(() => {
      refreshing = undefined;
    });
    return refreshing;
  }

  async function catalogue(): Promise<CatalogueEntry[]> {
    if (!cached) return refresh();

    if (cached.expiresAt <= Date.now()) {
      void refresh().catch((error) =>
        console.error("refreshing the item cache failed", error),
      );
    }
    return cached.entries;
  }

  async function names(): Promise<string[]> {
    return (await catalogue()).map((entry) => entry.name);
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

  return { names, catalogue, find };
}
