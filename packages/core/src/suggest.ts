import type { Suggestible } from "./types.ts";

const MIN_SCORE = 0.5;
const MAX_GAP_TO_BEST = 0.2;
const MAX_SUGGESTIONS = 10;
const MIN_WORD_LENGTH = 3;

function compact(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= MIN_WORD_LENGTH);
}

function bigrams(text: string): string[] {
  return Array.from({ length: text.length - 1 }, (_, index) =>
    text.slice(index, index + 2),
  );
}

function dice(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;

  const remaining = bigrams(b);
  const pairs = bigrams(a);
  let shared = 0;
  for (const pair of pairs) {
    const index = remaining.indexOf(pair);
    if (index === -1) continue;
    remaining.splice(index, 1);
    shared += 1;
  }
  return (2 * shared) / (pairs.length + bigrams(b).length);
}

function wordScore(query: string, candidate: string): number {
  const asked = words(query);
  const offered = words(candidate);
  if (asked.length === 0 || offered.length === 0) return 0;

  const best = asked.map((word) =>
    Math.max(...offered.map((other) => dice(word, other))),
  );
  return best.reduce((sum, score) => sum + score) / asked.length;
}

export function similarity(query: string, candidate: string): number {
  const asked = compact(query);
  const offered = compact(candidate);
  if (!asked || !offered) return 0;
  if (asked === offered) return 1;
  if (asked.length >= MIN_WORD_LENGTH && offered.includes(asked)) return 0.9;

  return Math.max(dice(asked, offered), wordScore(query, candidate));
}

export function suggest<T extends Suggestible>(
  query: string,
  entries: T[],
): T[] {
  const scored = entries
    .map((entry) => ({
      entry,
      score: Math.max(
        ...[entry.name, ...entry.aliases].map((text) =>
          similarity(query, text),
        ),
      ),
    }))
    .filter(({ score }) => score >= MIN_SCORE)
    .sort(
      (a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name),
    );

  const best = scored[0]?.score ?? 0;
  return scored
    .filter(({ score }) => score >= best - MAX_GAP_TO_BEST)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ entry }) => entry);
}
