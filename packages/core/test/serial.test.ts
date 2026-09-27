import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseSerial,
  SerialParseError,
  splitTrailingSerial,
} from "../src/index.ts";

test("parses plain numbers", () => {
  assert.equal(parseSerial("100"), 100);
  assert.equal(parseSerial(100), 100);
});

test("applies suffix multipliers", () => {
  assert.equal(parseSerial("1k"), 1000);
  assert.equal(parseSerial("1.5k"), 1500);
  assert.equal(parseSerial("2M"), 2_000_000);
  assert.equal(parseSerial("3b"), 3_000_000_000);
  assert.equal(parseSerial("1t"), 1_000_000_000_000);
});

test("strips currency signs", () => {
  assert.equal(parseSerial("$50000"), 50_000);
});

test("lets the first matching suffix win, as the legacy bot did", () => {
  assert.equal(parseSerial("1mk"), 1000);
});

test("truncates towards zero", () => {
  assert.equal(parseSerial("1.9"), 1);
  assert.equal(parseSerial("1.2345k"), 1234);
});

test("rejects input the legacy parser rejected", () => {
  for (const input of ["", "abc", "1,000", "1 2"]) {
    assert.throws(
      () => parseSerial(input),
      SerialParseError,
      `input ${JSON.stringify(input)}`,
    );
  }
});

test("splits a serial typed after the item name", () => {
  assert.deepEqual(splitTrailingSerial("Paterson navy 32193"), {
    name: "Paterson navy",
    serial: "32193",
  });
  assert.deepEqual(splitTrailingSerial("  guycot #78785 "), {
    name: "guycot",
    serial: "78785",
  });
  assert.deepEqual(splitTrailingSerial("trade ticket 1.5k"), {
    name: "trade ticket",
    serial: "1.5k",
  });
});

test("leaves queries without a separate trailing number alone", () => {
  for (const query of ["19347", "Empty Vial x2", "model3 lightning", "kukri"]) {
    assert.equal(splitTrailingSerial(query), undefined, query);
  }
});
