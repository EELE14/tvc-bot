import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveValue } from "@tvc/core";
import { ItemColour } from "@tvc/db";
import { buildValueEmbed } from "../src/render/embeds.ts";
import type { ItemWithValues } from "../src/types.ts";

const ESC = String.fromCharCode(27);

function item(overrides: Partial<ItemWithValues> = {}): ItemWithValues {
  return {
    id: "item",
    slug: "accordion",
    name: "Accordion",
    colour: ItemColour.PURPLE,
    unsure: false,
    imageSourceUrl: "https://example.invalid/accordion.png",
    imageObjectKey: null,
    imageContentType: null,
    imageBytes: null,
    lastEditorTag: "tristann_1716",
    valuedAt: new Date(0),
    createdAt: new Date(0),
    updatedAt: new Date(0),
    deletedAt: null,
    values: [],
    ...overrides,
  } as ItemWithValues;
}

function tier(
  serialMin: number,
  serialMax: number,
  amount: number,
  demand = 2,
  stability = 5,
  overpay = 1,
) {
  return {
    id: `${serialMin}`,
    itemId: "item",
    serialMin,
    serialMax,
    amount,
    demand,
    stability,
    overpay,
  };
}

const tiered = item({
  values: [tier(65, 69, 1_200_000), tier(100, 199, 400_000)],
});

test("renders the ansi block the discord bot always showed", () => {
  const embed = buildValueEmbed(
    tiered,
    resolveValue(tiered.values, "150"),
  ).toJSON();

  assert.equal(embed.title, "Accordion #150");
  assert.equal(
    embed.description,
    [
      "```ansi",
      `${ESC}[1;37mValue:${ESC}[0m ${ESC}[2;32m$400K${ESC}[0m`,
      `${ESC}[1;37mDemand:${ESC}[0m ${ESC}[2;33mLow${ESC}[0m`,
      `${ESC}[1;37mStability:${ESC}[0m ${ESC}[2;34mVery Good${ESC}[0m`,
      `${ESC}[1;37mOverpay:${ESC}[0m ${ESC}[2;31mVery Low${ESC}[0m`,
      "```",
    ].join("\n"),
  );
  assert.equal(embed.thumbnail?.url, "https://example.invalid/accordion.png");
  assert.equal(embed.footer, undefined);
});

test("marks the highest serial as HIGH", () => {
  const embed = buildValueEmbed(
    tiered,
    resolveValue(tiered.values, "999999"),
  ).toJSON();
  assert.equal(embed.title, "Accordion #HIGH");
});

test("drops the serial from the title for items valued without one", () => {
  const unranged = item({
    values: [
      {
        id: "nsv",
        itemId: "item",
        serialMin: null,
        serialMax: null,
        amount: 200_000,
        demand: 3,
        stability: 5,
        overpay: 0,
      },
    ],
  });
  const embed = buildValueEmbed(
    unranged,
    resolveValue(unranged.values, "12345"),
  ).toJSON();

  assert.equal(embed.title, "Accordion");
  assert.match(embed.description!, /Overpay:.*None/);
});

test("keeps the footer for incomplete values", () => {
  const empty = item({ values: [tier(1, 10, 0)] });
  const embed = buildValueEmbed(
    empty,
    resolveValue(empty.values, "5"),
  ).toJSON();

  assert.equal(
    embed.footer?.text,
    "- These values are incomplete (ping a VE for more accurate values)",
  );
});
