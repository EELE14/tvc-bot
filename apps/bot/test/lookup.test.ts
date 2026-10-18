import { test } from "node:test";
import assert from "node:assert/strict";
import { lookUp } from "../src/value/lookup.ts";
import type {
  CatalogueEntry,
  ItemRepository,
  ItemWithValues,
} from "../src/types.ts";

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

function stub(
  find: ItemRepository["find"],
  catalogue: CatalogueEntry[] = [],
): ItemRepository {
  return {
    names: async () => catalogue.map((entry) => entry.name),
    catalogue: async () => catalogue,
    find,
  };
}

function repository(found: ItemWithValues[]): ItemRepository {
  return stub(async () => found);
}

const failing = (message: string) =>
  stub(async () => {
    throw new Error(message);
  });

test("reports an easter egg before touching the database", async () => {
  const lookup = await lookUp(
    failing("should not be queried"),
    "Hydrogen",
    null,
  );
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
    (await lookUp(gapped, "Ticket", "500")).outcome,
    "SERIAL_OUT_OF_RANGE",
  );
  assert.equal(
    (await lookUp(gapped, "Ticket", "abc")).outcome,
    "SERIAL_UNPARSEABLE",
  );
});

test("resolves a tiered item without a serial at its highest serial", async () => {
  const lookup = await lookUp(
    repository([item("Ticket", [tier(1, 1, 5), tier(1000, 4999, 50)])]),
    "Ticket",
    null,
  );

  assert.equal(lookup.outcome, "RESOLVED");
  assert.equal(lookup.outcome === "RESOLVED" && lookup.resolved.serial, 4999);
});

function repositoryOf(known: ItemWithValues[]): ItemRepository {
  return stub(
    async (query) =>
      known.filter((entry) => entry.name.toLowerCase() === query.toLowerCase()),
    known.map(({ name, slug }) => ({ name, slug, aliases: [] })),
  );
}

test("reads a serial typed into the item name", async () => {
  const items = repositoryOf([
    item("Paterson Navy", [tier(1, 49_999, 90), tier(50_000, 99_999, 40)]),
  ]);
  const lookup = await lookUp(items, "Paterson navy 32193", null);

  assert.equal(lookup.outcome, "RESOLVED");
  assert.equal(lookup.outcome === "RESOLVED" && lookup.resolved.serial, 32_193);
});

test("prefers the serial option over a number in the item name", async () => {
  const items = repositoryOf([item("Paterson Navy", [tier(1, 99_999, 90)])]);
  const lookup = await lookUp(items, "Paterson navy 32193", "500");

  assert.equal(lookup.outcome === "RESOLVED" && lookup.resolved.serial, 500);
});

test("keeps a name that ends in a number when it matches as typed", async () => {
  const items = repositoryOf([item("Model 3", [unranged])]);
  const lookup = await lookUp(items, "Model 3", null);

  assert.equal(lookup.outcome === "RESOLVED" && lookup.item.name, "Model 3");
});

test("suggests similar items for an unknown name", async () => {
  const items = repositoryOf([
    item("Extractor", [unranged]),
    item("Accordion", [unranged]),
  ]);
  const lookup = await lookUp(items, "extracter", null);

  assert.equal(lookup.outcome, "UNKNOWN_ITEM");
  assert.deepEqual(
    lookup.outcome === "UNKNOWN_ITEM" &&
      lookup.suggestions.map((entry) => entry.name),
    ["Extractor"],
  );
});

test("carries a serial typed after an unknown name into the suggestions", async () => {
  const items = repositoryOf([
    item("Guycot Chain Carbine", [unranged]),
    item("Guycot Chain Pistol", [unranged]),
  ]);
  const lookup = await lookUp(items, "guycot 78785", null);

  assert.equal(lookup.outcome, "UNKNOWN_ITEM");
  assert.equal(lookup.outcome === "UNKNOWN_ITEM" && lookup.serial, "78785");
  assert.equal(
    lookup.outcome === "UNKNOWN_ITEM" && lookup.suggestions.length,
    2,
  );
});

test("still reports an unknown item when the catalogue cannot load", async () => {
  const items: ItemRepository = {
    ...repository([]),
    catalogue: async () => {
      throw new Error("connection refused");
    },
  };
  const lookup = await lookUp(items, "extracter", null);

  assert.equal(lookup.outcome, "UNKNOWN_ITEM");
  assert.deepEqual(lookup.outcome === "UNKNOWN_ITEM" && lookup.suggestions, []);
});

test("reports an item that carries no value", async () => {
  const lookup = await lookUp(repository([item("Cactus", [])]), "Cactus", "1");
  assert.equal(lookup.outcome, "ITEM_UNPRICED");
});

test("survives a database failure, so the user still hears back", async () => {
  const lookup = await lookUp(
    failing("connection refused"),
    "Accordion",
    "150",
  );

  assert.equal(lookup.outcome, "FAILED");
  assert.equal(lookup.outcome === "FAILED" && lookup.item, undefined);
});
