import { normalizeAlias } from "./alias.ts";
import type { ValueEntry } from "./types.ts";

const SCALE_RANGES = {
  demand: [1, 5],
  stability: [1, 5],
  overpay: [0, 5],
} as const;

export type ItemInput = {
  name: string;
  aliases: string[];
  values: ValueEntry[];
};

function describe(entry: ValueEntry): string {
  return entry.serialMin === null
    ? "value"
    : `tier ${entry.serialMin}-${entry.serialMax}`;
}

function scaleProblems(entry: ValueEntry): string[] {
  return Object.entries(SCALE_RANGES).flatMap(([field, [min, max]]) => {
    const level = entry[field as keyof typeof SCALE_RANGES];
    return Number.isInteger(level) && level >= min && level <= max
      ? []
      : [`${describe(entry)}: ${field} must be between ${min} and ${max}`];
  });
}

function boundsProblems(entry: ValueEntry): string[] {
  const { serialMin, serialMax } = entry;
  if (serialMin === null && serialMax === null) return [];
  if (serialMin === null || serialMax === null) {
    return ["a tier needs both a lowest and a highest serial"];
  }
  if (!Number.isInteger(serialMin) || !Number.isInteger(serialMax)) {
    return [`${describe(entry)}: serials must be whole numbers`];
  }
  if (serialMin > serialMax) {
    return [`${describe(entry)}: lowest serial is above the highest`];
  }
  return [];
}

export function valueProblems(entries: ValueEntry[]): string[] {
  if (entries.length === 0) return [];

  const unranged = entries.filter((entry) => entry.serialMin === null);
  const problems = entries.flatMap((entry) => [
    ...boundsProblems(entry),
    ...scaleProblems(entry),
    ...(Number.isInteger(entry.amount) && entry.amount >= 0
      ? []
      : [`${describe(entry)}: amount must be a whole number of at least 0`]),
  ]);

  if (unranged.length > 1) {
    problems.push("an item can only have one value without a serial range");
  }
  if (unranged.length > 0 && unranged.length < entries.length) {
    problems.push("an item cannot mix a serial-free value with serial tiers");
  }
  return problems;
}

export function aliasProblems(aliases: string[]): string[] {
  const normalized = aliases.map(normalizeAlias);
  if (normalized.some((alias) => alias === ""))
    return ["aliases cannot be empty"];

  const duplicates = normalized.filter(
    (alias, index) => normalized.indexOf(alias) !== index,
  );
  return duplicates.length > 0
    ? [`duplicate alias: ${[...new Set(duplicates)].join(", ")}`]
    : [];
}

export function nameProblems(name: string): string[] {
  return name.trim() === "" ? ["name is required"] : [];
}

export function itemProblems(input: ItemInput): string[] {
  return [
    ...nameProblems(input.name),
    ...aliasProblems(input.aliases),
    ...valueProblems(input.values),
  ];
}
