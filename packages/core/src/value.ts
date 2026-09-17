import {
  NoValueError,
  SerialOutOfRangeError,
  SerialRequiredError,
} from "./errors.ts";
import { parseSerial } from "./serial.ts";
import type { RangedEntry, ResolvedValue, ValueEntry } from "./types.ts";

function isRanged(entry: ValueEntry): entry is RangedEntry {
  return entry.serialMin !== null && entry.serialMax !== null;
}

export function rangedEntries(entries: ValueEntry[]): RangedEntry[] {
  return entries.filter(isRanged).sort((a, b) => a.serialMin - b.serialMin);
}

export function unrangedEntry(entries: ValueEntry[]): ValueEntry | undefined {
  return entries.find((entry) => !isRanged(entry));
}

function moreSpecific(a: RangedEntry, b: RangedEntry): RangedEntry {
  const spanA = a.serialMax - a.serialMin;
  const spanB = b.serialMax - b.serialMin;
  if (spanA !== spanB) return spanA < spanB ? a : b;
  if (a.serialMin !== b.serialMin) return a.serialMin < b.serialMin ? a : b;
  return a.amount <= b.amount ? a : b;
}

export function resolveValue(
  entries: ValueEntry[],
  serialInput?: string | number | null,
): ResolvedValue {
  const unranged = unrangedEntry(entries);
  if (unranged) return { entry: unranged, serial: null, clamped: false };

  const tiers = rangedEntries(entries);
  const lowest = tiers[0];
  const highest = tiers[tiers.length - 1];
  if (!lowest || !highest) throw new NoValueError("item has no values");

  if (serialInput === undefined || serialInput === null || serialInput === "") {
    throw new SerialRequiredError("serial required for this item");
  }

  const requested = parseSerial(serialInput);
  const serial = Math.min(
    Math.max(requested, lowest.serialMin),
    highest.serialMax,
  );
  const covering = tiers.filter(
    (tier) => serial >= tier.serialMin && serial <= tier.serialMax,
  );
  const entry = covering.reduce<RangedEntry | undefined>(
    (best, tier) => (best && moreSpecific(best, tier) === best ? best : tier),
    undefined,
  );
  if (!entry) {
    throw new SerialOutOfRangeError(`serial ${serial} falls between tiers`);
  }

  return { entry, serial, clamped: serial !== requested };
}
