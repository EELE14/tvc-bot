const UNITS = [
  { threshold: 1e12, suffix: "T" },
  { threshold: 1e9, suffix: "B" },
  { threshold: 1e6, suffix: "M" },
  { threshold: 1e3, suffix: "K" },
] as const;

export function formatAmount(amount: number): string {
  for (const { threshold, suffix } of UNITS) {
    if (amount >= threshold)
      return `${Number((amount / threshold).toFixed(2))}${suffix}`;
  }
  return String(amount);
}
