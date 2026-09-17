import {
  NoValueError,
  SerialOutOfRangeError,
  SerialRequiredError,
} from "./errors.ts";
import { parseSerial } from "./serial.ts";
import type { Ranged, ResolvedValue, ValueEntry } from "./types.ts";

function isRanged<T extends ValueEntry>(entry: T): entry is Ranged<T> {
  return entry.serialMin !== null && entry.serialMax !== null;
}

export function rangedEntries<T extends ValueEntry>(entries: T[]): Ranged<T>[] {
  return entries.filter(isRanged).sort((a, b) => a.serialMin - b.serialMin);
}

export function unrangedEntry<T extends ValueEntry>(
  entries: T[],
): T | undefined {
  return entries.find((entry) => !isRanged(entry));
}

function moreSpecific<T extends ValueEntry>(
  a: Ranged<T>,
  b: Ranged<T>,
): Ranged<T> {
  const spanA = a.serialMax - a.serialMin;
  const spanB = b.serialMax - b.serialMin;
  if (spanA !== spanB) return spanA < spanB ? a : b;
  if (a.serialMin !== b.serialMin) return a.serialMin < b.serialMin ? a : b;
  return a.amount <= b.amount ? a : b;
}

export function resolveValue<T extends ValueEntry>(
  entries: T[],
  serialInput?: string | number | null,
): ResolvedValue<T> {
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
  const entry = covering.reduce<Ranged<T> | undefined>(
    (best, tier) => (best && moreSpecific(best, tier) === best ? best : tier),
    undefined,
  );
  if (!entry) {
    throw new SerialOutOfRangeError(`serial ${serial} falls between tiers`);
  }

  return { entry, serial, clamped: serial !== requested };
}
