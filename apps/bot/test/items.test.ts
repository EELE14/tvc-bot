import { test } from "node:test";
import assert from "node:assert/strict";
import type { PrismaClient } from "@tvc/db";
import { createItemRepository } from "../src/items.ts";

type Recorder = { db: PrismaClient; calls: () => number; release: () => void };

function countingDb(options: { blocking?: boolean } = {}): Recorder {
  let calls = 0;
  let unblock: (() => void) | undefined;

  const db = {
    item: {
      findMany: async () => {
        calls += 1;
        if (options.blocking) {
          await new Promise<void>((resolve) => {
            unblock = resolve;
          });
        }
        return [{ name: `Item ${calls}` }];
      },
    },
  } as unknown as PrismaClient;

  return { db, calls: () => calls, release: () => unblock?.() };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test("queries once and then serves from the cache", async () => {
  const { db, calls } = countingDb();
  const items = createItemRepository(db, 60_000);

  assert.deepEqual(await items.names(), ["Item 1"]);
  await items.names();
  await items.names();

  assert.equal(calls(), 1);
});

test("answers from a stale cache instead of waiting for the database", async () => {
  const { db, calls, release } = countingDb({ blocking: true });
  const items = createItemRepository(db, 0);

  const first = items.names();
  release();
  assert.deepEqual(await first, ["Item 1"]);

  const stale = await items.names();
  assert.deepEqual(
    stale,
    ["Item 1"],
    "served the stale entry without blocking",
  );
  assert.equal(calls(), 2, "and started a refresh in the background");

  release();
  await settle();
  assert.deepEqual(await items.names(), ["Item 2"]);
});

test("collapses concurrent refreshes into one query", async () => {
  const { db, calls, release } = countingDb({ blocking: true });
  const items = createItemRepository(db, 60_000);

  const waiting = [items.names(), items.names(), items.names()];
  release();
  await Promise.all(waiting);

  assert.equal(calls(), 1);
});

test("keeps serving the stale entry when a refresh fails", async () => {
  let calls = 0;
  const db = {
    item: {
      findMany: async () => {
        calls += 1;
        if (calls > 1) throw new Error("database is down");
        return [{ name: "Accordion" }];
      },
    },
  } as unknown as PrismaClient;

  const items = createItemRepository(db, 0);
  assert.deepEqual(await items.names(), ["Accordion"]);
  assert.deepEqual(await items.names(), ["Accordion"]);
  await settle();
  assert.deepEqual(await items.names(), ["Accordion"]);
});
