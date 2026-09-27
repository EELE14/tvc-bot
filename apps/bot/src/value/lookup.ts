import {
  NoValueError,
  SerialOutOfRangeError,
  SerialParseError,
  resolveValue,
  splitTrailingSerial,
  type ResolvedValue,
} from "@tvc/core";
import { LookupOutcome } from "@tvc/db/types";
import type { ItemRepository, ItemWithValues } from "../types.ts";
import { EASTER_EGGS } from "./easter-eggs.ts";

export type Lookup =
  | { outcome: "EASTER_EGG"; reply: string }
  | { outcome: "UNKNOWN_ITEM" }
  | { outcome: "AMBIGUOUS_QUERY"; candidates: ItemWithValues[] }
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

async function findWithSerial(
  items: ItemRepository,
  query: string,
  serial: string | null,
): Promise<{ candidates: ItemWithValues[]; serial: string | null }> {
  const candidates = await items.find(query);
  if (candidates.length > 0) return { candidates, serial };

  const split = splitTrailingSerial(query);
  if (!split) return { candidates, serial };
  return {
    candidates: await items.find(split.name),
    serial: serial ?? split.serial,
  };
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
    const { candidates, serial: effectiveSerial } = await findWithSerial(
      items,
      query,
      serial,
    );
    item = candidates[0];
    if (!item) return { outcome: "UNKNOWN_ITEM" };
    if (candidates.length > 1)
      return { outcome: "AMBIGUOUS_QUERY", candidates };

    return {
      outcome: "RESOLVED",
      item,
      resolved: resolveValue(item.values, effectiveSerial),
    };
  } catch (error) {
    return { outcome: classify(error), item, error };
  }
}
