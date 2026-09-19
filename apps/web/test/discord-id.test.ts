import { test } from "node:test";
import assert from "node:assert/strict";
import { isDiscordId } from "../src/discord-id.ts";

test("accepts the snowflakes discord actually issues", () => {
  for (const id of [
    "1263756486660587543",
    "876778861881327616",
    "80351110224678912",
  ]) {
    assert.equal(isDiscordId(id), true, id);
  }
});

test("rejects anything that is not a bare snowflake", () => {
  for (const value of [
    "",
    "   ",
    "12345",
    "1263756486660587543 ",
    "<@1263756486660587543>",
    "tristann_1716",
    "126375648666058754312345",
    "1263756486660587543,876778861881327616",
  ]) {
    assert.equal(isDiscordId(value), false, JSON.stringify(value));
  }
});
