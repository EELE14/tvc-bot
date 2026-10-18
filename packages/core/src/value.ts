import { NoValueError, SerialOutOfRangeError } from "./errors.ts";
import { parseSerial } from "./serial.ts";
import type { Ranged, ResolvedValue, ValueEntry } from "./types.ts";

const HIGHEST_SERIAL = /^(#?high)?$/i;

function requestedSerial(
  serialInput: string | number | null | undefined,
  highest: number,
): number {
  if (serialInput === undefined || serialInput === null) return highest;
  if (HIGHEST_SERIAL.test(String(serialInput).trim())) return highest;
  return parseSerial(serialInput);
}

function isRanged<T extends ValueEntry>(entry: T): entry is Ranged<T> {
  return entry.serialMin !== null && entry.serialMax !== null;
}

export function rangedEntries<T extends ValueEntry>(entries: T[]): Ranged<T>[] {
  return entries.filter(isRanged).sort((a, b) => a.serialMin - b.serialMin);
}

export function highestSerial(entries: ValueEntry[]): number | null {
  const tops = entries.flatMap((entry) =>
    entry.serialMax === null ? [] : [entry.serialMax],
  );
  return tops.length > 0 ? Math.max(...tops) : null;
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
  const highest = highestSerial(tiers);
  if (!lowest || highest === null) throw new NoValueError("item has no values");

  const requested = requestedSerial(serialInput, highest);
  const serial = Math.min(Math.max(requested, lowest.serialMin), highest);
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
