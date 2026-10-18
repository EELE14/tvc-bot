import {
  NoValueError,
  SerialOutOfRangeError,
  SerialParseError,
  resolveValue,
  splitTrailingSerial,
  suggest,
  type ResolvedValue,
} from "@tvc/core";
import { LookupOutcome } from "@tvc/db/types";
import type {
  CatalogueEntry,
  ItemRepository,
  ItemWithValues,
} from "../types.ts";
import { EASTER_EGGS } from "./easter-eggs.ts";

export type Lookup =
  | { outcome: "EASTER_EGG"; reply: string }
  | {
      outcome: "UNKNOWN_ITEM";
      suggestions: CatalogueEntry[];
      serial: string | null;
    }
  | {
      outcome: "AMBIGUOUS_QUERY";
      candidates: ItemWithValues[];
      serial: string | null;
    }
  | { outcome: "RESOLVED"; item: ItemWithValues; resolved: ResolvedValue }
  | {
      outcome: FailedOutcome;
      item: ItemWithValues | undefined;
      error: unknown;
    };

type FailedOutcome =
  | "SERIAL_OUT_OF_RANGE"
  | "SERIAL_UNPARSEABLE"
  | "ITEM_UNPRICED"
  | "FAILED";

function classify(error: unknown): FailedOutcome {
  if (error instanceof SerialOutOfRangeError) return "SERIAL_OUT_OF_RANGE";
  if (error instanceof SerialParseError) return "SERIAL_UNPARSEABLE";
  if (error instanceof NoValueError) return "ITEM_UNPRICED";
  return "FAILED";
}

export function outcomeCode(lookup: Lookup): LookupOutcome {
  return LookupOutcome[lookup.outcome];
}

type Search = {
  name: string;
  serial: string | null;
  candidates: ItemWithValues[];
};

async function search(
  items: ItemRepository,
  query: string,
  serial: string | null,
): Promise<Search> {
  const candidates = await items.find(query);
  if (candidates.length > 0) return { name: query, serial, candidates };

  const split = splitTrailingSerial(query);
  if (!split) return { name: query, serial, candidates };
  return {
    name: split.name,
    serial: serial ?? split.serial,
    candidates: await items.find(split.name),
  };
}

async function suggestionsFor(
  items: ItemRepository,
  name: string,
): Promise<CatalogueEntry[]> {
  const catalogue = await items.catalogue().catch(() => []);
  return suggest(name, catalogue);
}

export async function lookUp(
  items: ItemRepository,
  query: string,
  serial: string | null,
): Promise<Lookup> {
  const egg = EASTER_EGGS[query.toLowerCase()];
  if (egg) return { outcome: "EASTER_EGG", reply: egg };

  let item: ItemWithValues | undefined;
  try {
    const found = await search(items, query, serial);
    item = found.candidates[0];
    if (!item) {
      return {
        outcome: "UNKNOWN_ITEM",
        suggestions: await suggestionsFor(items, found.name),
        serial: found.serial,
      };
    }
    if (found.candidates.length > 1) {
      return {
        outcome: "AMBIGUOUS_QUERY",
        candidates: found.candidates,
        serial: found.serial,
      };
    }

    return {
      outcome: "RESOLVED",
      item,
      resolved: resolveValue(item.values, found.serial),
    };
  } catch (error) {
    return { outcome: classify(error), item, error };
  }
}
