import { SerialParseError } from "./errors.ts";

const MULTIPLIERS = [
  ["k", 1e3],
  ["m", 1e6],
  ["b", 1e9],
  ["t", 1e12],
] as const;

export function parseSerial(input: string | number): number {
  const text = String(input).toLowerCase();
  const multiplier =
    MULTIPLIERS.find(([token]) => text.includes(token))?.[1] ?? 1;
  const digits = text.replace(/[kmbt$]/g, "").trim();
  const parsed = Number(digits);

  if (digits === "" || !Number.isFinite(parsed)) {
    throw new SerialParseError(`could not convert ${input} to a number`);
  }
  return Math.trunc(parsed * multiplier);
}
