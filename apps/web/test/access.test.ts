import { test } from "node:test";
import assert from "node:assert/strict";
import { mayModify } from "../src/access.ts";

test("an admin cannot change their own access", () => {
  assert.equal(mayModify("1263756486660587543", "1263756486660587543"), false);
});

test("an admin can change everyone else", () => {
  assert.equal(mayModify("1263756486660587543", "876778861881327616"), true);
});
