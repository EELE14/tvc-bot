import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NoValueError,
  SerialOutOfRangeError,
  SerialRequiredError,
  resolveValue,
  type ValueEntry,
} from "../src/value.ts";

const scale = { demand: 3, stability: 5, overpay: 2 };

function tier(
  serialMin: number,
  serialMax: number,
  amount: number,
): ValueEntry {
  return { serialMin, serialMax, amount, ...scale };
}

const nsv: ValueEntry = {
  serialMin: null,
  serialMax: null,
  amount: 200_000,
  ...scale,
};

const tradeTicket: ValueEntry[] = [
  tier(1, 1, 5_000_000),
  tier(1000, 4999, 50_000),
  tier(5000, 9999, 30_000),
  tier(10_000, 29_999, 20_000),
  tier(30_000, 49_999, 10_000),
  tier(50_000, 100_000, 5_000),
];

test("an unranged value ignores the serial", () => {
  const resolved = resolveValue([nsv], "12345");
  assert.equal(resolved.entry.amount, 200_000);
  assert.equal(resolved.serial, null);
  assert.equal(resolved.clamped, false);
});

test("a tiered item requires a serial", () => {
  assert.throws(() => resolveValue(tradeTicket), SerialRequiredError);
  assert.throws(() => resolveValue(tradeTicket, ""), SerialRequiredError);
});

test("picks the tier containing the serial", () => {
  assert.equal(resolveValue(tradeTicket, "7500").entry.amount, 30_000);
  assert.equal(resolveValue(tradeTicket, "1").entry.amount, 5_000_000);
});

test("clamps below the lowest and above the highest bound", () => {
  const low = resolveValue(tradeTicket, "0");
  assert.equal(low.serial, 1);
  assert.equal(low.clamped, true);

  const high = resolveValue(tradeTicket, "500k");
  assert.equal(high.serial, 100_000);
  assert.equal(high.entry.amount, 5_000);
  assert.equal(high.clamped, true);
});

test("reports a serial that falls into a gap between tiers", () => {
  assert.throws(() => resolveValue(tradeTicket, "500"), SerialOutOfRangeError);
});

test("reports an item that carries no value at all", () => {
  assert.throws(() => resolveValue([]), NoValueError);
});

test("resolves overlapping tiers to the narrowest range, whatever the row order", () => {
  const birch = [tier(90, 99, 2_500_000), tier(90, 94, 2_200_000)];
  assert.equal(resolveValue(birch, "92").entry.amount, 2_200_000);
  assert.equal(resolveValue(birch.toReversed(), "92").entry.amount, 2_200_000);

  const ivory = [tier(20_000, 39_999, 145_000), tier(30_000, 39_999, 135_000)];
  assert.equal(resolveValue(ivory, "35000").entry.amount, 135_000);
  assert.equal(resolveValue(ivory.toReversed(), "35000").entry.amount, 135_000);
  assert.equal(resolveValue(ivory, "25000").entry.amount, 145_000);
});
