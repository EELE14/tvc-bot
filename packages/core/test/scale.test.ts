import { test } from "node:test";
import assert from "node:assert/strict";
import { scaleLabel } from "../src/scale.ts";

test("uses the labels the discord bot showed", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(scaleLabel), [
    "None",
    "Very Low",
    "Low",
    "Good",
    "Quite Good",
    "Very Good",
  ]);
});

test("marks values outside the scale", () => {
  assert.equal(scaleLabel(6), "Invalid");
  assert.equal(scaleLabel(-1), "Invalid");
});
