import {
  NoValueError,
  SerialOutOfRangeError,
  SerialParseError,
} from "@tvc/core";

export const INCOMPLETE_VALUES =
  "- These values are incomplete (ping a VE for more accurate values)";

export function unknownItem(
  query: string,
  suggestions: { name: string }[],
): string {
  const missing = `No item called \`${query}\`.`;
  const [only] = suggestions;
  if (!only) return missing;
  if (suggestions.length === 1)
    return `${missing} Did you mean \`${only.name}\`?`;
  return `${missing} Did you mean one of these?`;
}

export function ambiguousItem(query: string): string {
  return `\`${query}\` matches several items. Pick one below.`;
}

export const ONLY_ASKER_MAY_PICK = "Only the person who asked can pick here.";

export function describeFailure(error: unknown): string {
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
