export const SCALE_LABELS = [
  "None",
  "Very Low",
  "Low",
  "Good",
  "Quite Good",
  "Very Good",
] as const;

export const SCALE_MIN = 0;
export const SCALE_MAX = 5;

export function scaleLabel(level: number): string {
  return SCALE_LABELS[level] ?? "Invalid";
}
