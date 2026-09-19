import { createHmac } from "node:crypto";
import { rangedEntries, resolveValue, unrangedEntry } from "@tvc/core";
import { createPrismaClient, LookupOutcome } from "../src/index.ts";

const DAYS = 30;
const ROWS = 2000;
const USERS = 14;
const GUILD = "1073630201084379196";
const CHANNELS = ["1326289714231115918", "1352921204612141067"];

const MISSING = [
  "Volcanic Pistol",
  "Bolt Action Rifle",
  "rare horse",
  "navy revolver",
  "gold bar",
];
const COLLIDING = ["kukri", "bb", "skull", "blunderbuss", "doubloons"];
const EGGS = ["hydrogen", "tvc", "ethan"];

function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)]!;
}

function zipf(size: number): number {
  return Math.min(size - 1, Math.floor(Math.abs(Math.random() ** 3) * size));
}

function userHash(index: number): string {
  return createHmac("sha256", "seed")
    .update(`user-${index}`)
    .digest("base64url");
}

function momentWithin(days: number): Date {
  const dayOffset = Math.floor(Math.random() ** 1.4 * days);
  const hour = pick([
    14, 15, 16, 17, 18, 19, 19, 20, 20, 21, 21, 22, 23, 9, 11,
  ]);
  const at = new Date();
  at.setDate(at.getDate() - dayOffset);
  at.setHours(
    hour,
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60),
    0,
  );
  return at;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const db = createPrismaClient(connectionString);

  if (process.argv.includes("--clear")) {
    const { count } = await db.lookup.deleteMany({});
    console.log(`removed ${count} lookups`);
    await db.$disconnect();
    return;
  }

  const items = await db.item.findMany({
    where: { deletedAt: null },
    include: { values: true },
  });
  if (items.length === 0)
    throw new Error("no items, run the legacy import first");

  const popular = [...items].sort(() => Math.random() - 0.5);
  const rows = [];

  for (let index = 0; index < ROWS; index += 1) {
    const roll = Math.random();
    const base = {
      createdAt: momentWithin(DAYS),
      userHash: userHash(Math.floor(Math.random() ** 2 * USERS)),
      guildId: GUILD,
      channelId: pick(CHANNELS),
      ackMs: 20 + Math.floor(Math.random() ** 3 * 900),
      lookupMs: 3 + Math.floor(Math.random() ** 2 * 120),
      durationMs: 120 + Math.floor(Math.random() ** 2 * 900),
      serialInput: null as string | null,
      serial: null as number | null,
      amount: null as number | null,
      itemId: null as string | null,
      candidates: 0,
    };

    if (roll < 0.04) {
      rows.push({
        ...base,
        outcome: LookupOutcome.UNKNOWN_ITEM,
        query: pick(MISSING),
      });
      continue;
    }
    if (roll < 0.09) {
      rows.push({
        ...base,
        outcome: LookupOutcome.AMBIGUOUS_QUERY,
        query: pick(COLLIDING),
        candidates: 2 + Math.floor(Math.random() * 7),
      });
      continue;
    }
    if (roll < 0.11) {
      rows.push({
        ...base,
        outcome: LookupOutcome.EASTER_EGG,
        query: pick(EGGS),
      });
      continue;
    }

    const item = popular[zipf(popular.length)]!;
    const tiers = rangedEntries(item.values);
    const single = unrangedEntry(item.values);

    if (!single && tiers.length === 0) {
      rows.push({
        ...base,
        outcome: LookupOutcome.ITEM_UNPRICED,
        query: item.name,
        itemId: item.id,
        candidates: 1,
      });
      continue;
    }

    if (tiers.length > 0 && roll < 0.16) {
      rows.push({
        ...base,
        outcome: LookupOutcome.SERIAL_REQUIRED,
        query: item.name,
        itemId: item.id,
        candidates: 1,
      });
      continue;
    }

    const serial =
      tiers.length > 0 ? String(pick(tiers).serialMin + zipf(40)) : null;
    try {
      const resolved = resolveValue(item.values, serial);
      rows.push({
        ...base,
        outcome: LookupOutcome.RESOLVED,
        query: item.name,
        itemId: item.id,
        serialInput: serial,
        serial: resolved.serial,
        amount: resolved.entry.amount,
        candidates: 1,
      });
    } catch {
      rows.push({
        ...base,
        outcome: LookupOutcome.SERIAL_OUT_OF_RANGE,
        query: item.name,
        itemId: item.id,
        serialInput: serial,
        candidates: 1,
      });
    }
  }

  await db.lookup.createMany({ data: rows });
  console.log(`seeded ${rows.length} lookups across ${DAYS} days`);
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
