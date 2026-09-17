import { test } from "node:test";
import assert from "node:assert/strict";
import { lookUp } from "../src/value/lookup.ts";
import type { ItemRepository, ItemWithValues } from "../src/types.ts";

function item(name: string, values: ItemWithValues["values"]): ItemWithValues {
  return { id: name, slug: name, name, values } as ItemWithValues;
}

const tier = (serialMin: number, serialMax: number, amount: number) => ({
  id: `${serialMin}`,
  itemId: "x",
  serialMin,
  serialMax,
  amount,
  demand: 3,
  stability: 5,
  overpay: 2,
});

const unranged = {
  id: "nsv",
  itemId: "x",
  serialMin: null,
  serialMax: null,
  amount: 200_000,
  demand: 3,
  stability: 5,
  overpay: 2,
};

function repository(found: ItemWithValues[]): ItemRepository {
  return { names: async () => [], find: async () => found };
}

test("reports an easter egg before touching the database", async () => {
  const items: ItemRepository = {
    names: async () => [],
    find: async () => {
      throw new Error("should not be queried");
    },
  };
  const lookup = await lookUp(items, "Hydrogen", null);
  assert.equal(lookup.outcome, "EASTER_EGG");
});

test("reports an unknown item", async () => {
  assert.equal(
    (await lookUp(repository([]), "nope", null)).outcome,
    "UNKNOWN_ITEM",
  );
});

test("reports an ambiguous query with its candidates", async () => {
  const candidates = [item("Kukri A", [unranged]), item("Kukri B", [unranged])];
  const lookup = await lookUp(repository(candidates), "kukri", null);

  assert.equal(lookup.outcome, "AMBIGUOUS_QUERY");
  assert.equal(
    lookup.outcome === "AMBIGUOUS_QUERY" && lookup.candidates.length,
    2,
  );
});

test("resolves a value", async () => {
  const lookup = await lookUp(
    repository([item("Relic", [unranged])]),
    "Relic",
    null,
  );

  assert.equal(lookup.outcome, "RESOLVED");
  assert.equal(
    lookup.outcome === "RESOLVED" && lookup.resolved.entry.amount,
    200_000,
  );
});

test("separates the ways a serial can fail", async () => {
  const gapped = repository([
    item("Ticket", [tier(1, 1, 5), tier(1000, 4999, 50)]),
  ]);

  assert.equal(
    (await lookUp(gapped, "Ticket", null)).outcome,
    "SERIAL_REQUIRED",
  );
  assert.equal(
    (await lookUp(gapped, "Ticket", "500")).outcome,
    "SERIAL_OUT_OF_RANGE",
  );
  assert.equal(
    (await lookUp(gapped, "Ticket", "abc")).outcome,
    "SERIAL_UNPARSEABLE",
  );
});

test("reports an item that carries no value", async () => {
  const lookup = await lookUp(repository([item("Cactus", [])]), "Cactus", "1");
  assert.equal(lookup.outcome, "ITEM_UNPRICED");
});

test("survives a database failure, so the user still hears back", async () => {
  const broken: ItemRepository = {
    names: async () => [],
    find: async () => {
      throw new Error("connection refused");
    },
  };
  const lookup = await lookUp(broken, "Accordion", "150");

  assert.equal(lookup.outcome, "FAILED");
  assert.equal(lookup.outcome === "FAILED" && lookup.item, undefined);
});
