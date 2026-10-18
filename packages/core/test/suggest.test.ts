import { test } from "node:test";
import assert from "node:assert/strict";
import { similarity, suggest } from "../src/index.ts";

const catalogue = [
  "Extractor",
  "Model 3 Lightning",
  "Guycot Chain Carbine",
  "Guycot Chain Pistol",
  "Skinwalker Bone",
  "Paterson Navy",
  "Trade Ticket",
  "Accordion",
].map((name) => ({ name, aliases: [] as string[] }));

const names = (query: string) =>
  suggest(query, catalogue).map((entry) => entry.name);

test("ignores case, spacing and punctuation", () => {
  assert.equal(similarity("model3 lightning", "Model 3 Lightning"), 1);
  assert.equal(similarity("skin-walker bone", "Skinwalker Bone"), 1);
});

test("forgives typos", () => {
  assert.deepEqual(names("extracter"), ["Extractor"]);
  assert.deepEqual(names("patterson navy"), ["Paterson Navy"]);
  assert.deepEqual(names("trade tiket"), ["Trade Ticket"]);
});

test("offers every item a partial name fits", () => {
  assert.deepEqual(names("guycot"), [
    "Guycot Chain Carbine",
    "Guycot Chain Pistol",
  ]);
});

test("matches aliases as well as names", () => {
  const withAlias = [{ name: "Kukri Machete Ivory", aliases: ["ivory kuk"] }];
  assert.equal(suggest("ivory kukk", withAlias).length, 1);
});

test("suggests nothing for unrelated input", () => {
  for (const query of ["xyz", "a", "19347", ""]) {
    assert.deepEqual(names(query), [], query);
  }
});
