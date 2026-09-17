import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aliasProblems,
  itemProblems,
  nameProblems,
  valueProblems,
  type ValueEntry,
} from "../src/index.ts";

const scale = { demand: 3, stability: 5, overpay: 2 };
const tier = (serialMin: number, serialMax: number): ValueEntry => ({
  serialMin,
  serialMax,
  amount: 1000,
  ...scale,
});
const unranged: ValueEntry = {
  serialMin: null,
  serialMax: null,
  amount: 1000,
  ...scale,
};

test("accepts the shapes the dataset actually contains", () => {
  assert.deepEqual(valueProblems([unranged]), []);
  assert.deepEqual(valueProblems([tier(1, 99), tier(100, 199)]), []);
  assert.deepEqual(valueProblems([]), []);
});

test("accepts overlapping tiers, because two items carry them", () => {
  assert.deepEqual(valueProblems([tier(90, 99), tier(90, 94)]), []);
});

test("rejects mixing a serial-free value with tiers", () => {
  const problems = valueProblems([unranged, tier(1, 99)]);
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /cannot mix/);
});

test("rejects more than one serial-free value", () => {
  assert.match(valueProblems([unranged, unranged])[0]!, /only have one value/);
});

test("rejects reversed and half-filled serial bounds", () => {
  assert.match(valueProblems([tier(99, 1)])[0]!, /lowest serial is above/);
  assert.match(
    valueProblems([{ ...unranged, serialMin: 5 }])[0]!,
    /needs both a lowest and a highest/,
  );
});

test("holds demand and stability to 1..5 and overpay to 0..5", () => {
  assert.match(valueProblems([{ ...unranged, demand: 0 }])[0]!, /demand/);
  assert.match(valueProblems([{ ...unranged, stability: 6 }])[0]!, /stability/);
  assert.deepEqual(valueProblems([{ ...unranged, overpay: 0 }]), []);
});

test("rejects negative and fractional amounts", () => {
  assert.match(valueProblems([{ ...unranged, amount: -1 }])[0]!, /amount/);
  assert.match(valueProblems([{ ...unranged, amount: 1.5 }])[0]!, /amount/);
});

test("rejects duplicate and empty aliases, ignoring case and padding", () => {
  assert.deepEqual(aliasProblems(["Relic", "Ancient Relic"]), []);
  assert.match(aliasProblems(["Relic", " relic "])[0]!, /duplicate alias/);
  assert.match(aliasProblems([" "])[0]!, /cannot be empty/);
});

test("requires a name", () => {
  assert.deepEqual(nameProblems("Accordion"), []);
  assert.match(nameProblems("   ")[0]!, /name is required/);
});

test("collects every problem at once", () => {
  const problems = itemProblems({
    name: "",
    aliases: ["a", "A"],
    values: [tier(99, 1)],
  });
  assert.equal(problems.length, 3);
});
