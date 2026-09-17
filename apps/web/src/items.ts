import { cache } from "react";
import { rangedEntries, unrangedEntry } from "@tvc/core";
import { db } from "./db.ts";
import type { ItemDetail, ItemSummary } from "./types.ts";

export const listItems = cache((): Promise<ItemSummary[]> => {
  return db.item.findMany({
    where: { deletedAt: null },
    select: { slug: true, name: true, colour: true },
    orderBy: { name: "asc" },
  });
});

export function getItem(slug: string): Promise<ItemDetail | null> {
  return db.item.findFirst({
    where: { slug, deletedAt: null },
    include: { aliases: { orderBy: { alias: "asc" } }, values: true },
  });
}

export function splitValues(item: ItemDetail) {
  return {
    unranged: unrangedEntry(item.values),
    tiers: rangedEntries(item.values),
  };
}
