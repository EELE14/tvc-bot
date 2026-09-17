import { test } from "node:test";
import assert from "node:assert/strict";
import { itemProblems } from "@tvc/core";
import { parseItemForm } from "../src/form.ts";
import { toSlug } from "../src/slug.ts";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

test("parses a single value", () => {
  const input = parseItemForm(
    form({
      name: "  Ancient Relic  ",
      aliases: "Relic, Ancient Relic , ",
      colour: "BLUE",
      imageSourceUrl: "https://example.invalid/a.png",
      unsure: "on",
      mode: "single",
      "single.amount": "200000",
      "single.demand": "2",
      "single.stability": "3",
      "single.overpay": "5",
    }),
  );

  assert.equal(input.name, "Ancient Relic");
  assert.deepEqual(input.aliases, ["Relic", "Ancient Relic"]);
  assert.equal(input.colour, "BLUE");
  assert.equal(input.unsure, true);
  assert.deepEqual(input.values, [
    {
      serialMin: null,
      serialMax: null,
      amount: 200000,
      demand: 2,
      stability: 3,
      overpay: 5,
    },
  ]);
  assert.deepEqual(itemProblems(input), []);
});

test("parses tier rows", () => {
  const input = parseItemForm(
    form({
      name: "Accordion",
      aliases: "Accordion",
      colour: "PURPLE",
      mode: "tiers",
      tierCount: "2",
      "tier.0.min": "65",
      "tier.0.max": "69",
      "tier.0.amount": "1200000",
      "tier.0.demand": "2",
      "tier.0.stability": "5",
      "tier.0.overpay": "4",
      "tier.1.min": "100",
      "tier.1.max": "199",
      "tier.1.amount": "400000",
      "tier.1.demand": "3",
      "tier.1.stability": "5",
      "tier.1.overpay": "3",
    }),
  );

  assert.equal(input.values.length, 2);
  assert.equal(input.values[0]!.serialMin, 65);
  assert.equal(input.values[1]!.amount, 400000);
  assert.deepEqual(itemProblems(input), []);
});

test("treats an unknown colour as none and an empty image as null", () => {
  const input = parseItemForm(
    form({ name: "X", aliases: "", colour: "", mode: "single", "single.amount": "1", "single.demand": "1", "single.stability": "1", "single.overpay": "0" }),
  );

  assert.equal(input.colour, null);
  assert.equal(input.imageSourceUrl, null);
  assert.deepEqual(input.aliases, []);
});

test("surfaces validation problems from the shared rules", () => {
  const input = parseItemForm(
    form({
      name: "",
      aliases: "a, A",
      mode: "tiers",
      tierCount: "1",
      "tier.0.min": "99",
      "tier.0.max": "1",
      "tier.0.amount": "10",
      "tier.0.demand": "1",
      "tier.0.stability": "1",
      "tier.0.overpay": "0",
    }),
  );

  const problems = itemProblems(input);
  assert.equal(problems.length, 3);
});

test("derives slugs the way the prototype named its files", () => {
  assert.equal(toSlug("No.3 Shotgun Sawed Off"), "No3 Shotgun Sawed Off");
  assert.equal(toSlug("Coal (stacked)"), "Coal stacked");
  assert.equal(toSlug("  ???  "), "");
});
