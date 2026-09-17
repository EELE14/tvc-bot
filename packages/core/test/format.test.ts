import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatAmount } from "../src/format.ts";

const legacy: Record<string, string> = JSON.parse(
  readFileSync(
    new URL("./fixtures/legacy-amounts.json", import.meta.url),
    "utf8",
  ),
);

test("matches the legacy numerize output for every amount in the dataset", () => {
  for (const [amount, expected] of Object.entries(legacy)) {
    assert.equal(formatAmount(Number(amount)), expected, `amount ${amount}`);
  }
});

test("keeps the legacy rounding quirks", () => {
  assert.equal(formatAmount(1999), "2K");
  assert.equal(formatAmount(999999), "1000K");
  assert.equal(formatAmount(999), "999");
});
