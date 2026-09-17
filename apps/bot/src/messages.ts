import {
  NoValueError,
  SerialOutOfRangeError,
  SerialParseError,
  SerialRequiredError,
} from "@tvc/core";
import type { ItemWithValues } from "./types.ts";

export const INCOMPLETE_VALUES =
  "- These values are incomplete (ping a VE for more accurate values)";

export function unknownItem(query: string): string {
  return `No item called \`${query}\`.`;
}

export function ambiguousItem(
  query: string,
  candidates: ItemWithValues[],
): string {
  const names = candidates.map((item) => `\`${item.name}\``).join(", ");
  return `\`${query}\` matches several items: ${names}. Pick one of them.`;
}

export function describeFailure(error: unknown): string {
  if (error instanceof SerialRequiredError) {
    return "This item is valued by serial number. Add one to `/value`.";
  }
  if (error instanceof SerialParseError) {
    return `That serial is not a number: ${error.message}`;
  }
  if (error instanceof SerialOutOfRangeError) {
    return "No value is recorded for that serial range yet.";
  }
  if (error instanceof NoValueError) {
    return "No values are recorded for this item yet.";
  }
  return `Something went wrong: ${error instanceof Error ? error.message : String(error)}`;
}
