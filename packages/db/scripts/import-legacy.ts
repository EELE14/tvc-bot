import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { itemProblems, normalizeAlias } from "@tvc/core";
import { createPrismaClient, ItemColour, EditorRole } from "../src/index.ts";

const IMPORT_ACTOR = "legacy-import";

type LegacyScale = {
  value: number;
  demand: number;
  stability: number;
  overpay: number;
};

type LegacyTier = LegacyScale & { min: number; max: number };

type LegacyItem = {
  name: string;
  aliases: string[];
  image: string;
  colour: string;
  usertag: string;
  unsure: boolean;
  nsv: LegacyScale | null;
  ddsrv: LegacyTier[];
  timestamp: number;
};

class ImportError extends Error {}
class DryRunRollback extends Error {}

function fail(source: string, message: string): never {
  throw new ImportError(`${source}: ${message}`);
}

function toColour(source: string, raw: string): ItemColour | null {
  if (raw === "") return null;
  const member = raw.toUpperCase();
  if (!(member in ItemColour))
    fail(source, `unknown colour ${JSON.stringify(raw)}`);
  return ItemColour[member as keyof typeof ItemColour];
}

function parseItem(source: string, raw: unknown): LegacyItem {
  if (typeof raw !== "object" || raw === null) fail(source, "not an object");
  const item = raw as LegacyItem;

  if (typeof item.name !== "string") fail(source, "missing name");
  if (!Array.isArray(item.aliases)) fail(source, "missing aliases");
  if (typeof item.timestamp !== "number") fail(source, "missing timestamp");

  const problems = itemProblems({
    name: item.name,
    aliases: item.aliases,
    values: valueRows(item),
  });
  if (problems.length > 0) fail(source, problems.join("; "));

  return item;
}

async function readLegacyItems(dir: string) {
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".json") && f !== "editors.json")
    .sort();
  return Promise.all(
    files.map(async (file) => {
      const slug = path.basename(file, ".json");
      const raw = JSON.parse(await readFile(path.join(dir, file), "utf8"));
      return { slug, raw, item: parseItem(file, raw) };
    }),
  );
}

async function readLegacyEditors(dir: string): Promise<string[]> {
  const raw = JSON.parse(
    await readFile(path.join(dir, "editors.json"), "utf8"),
  );
  if (!Array.isArray(raw.allowed)) fail("editors.json", "missing allowed");
  return raw.allowed;
}

function valueRows(item: LegacyItem) {
  if (item.nsv) {
    const { value, demand, stability, overpay } = item.nsv;
    return [
      {
        serialMin: null,
        serialMax: null,
        amount: value,
        demand,
        stability,
        overpay,
      },
    ];
  }
  return item.ddsrv.map(({ min, max, value, demand, stability, overpay }) => ({
    serialMin: min,
    serialMax: max,
    amount: value,
    demand,
    stability,
    overpay,
  }));
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) fail("env", "DATABASE_URL is not set");

  const here = path.dirname(fileURLToPath(import.meta.url));
  const dataDir =
    process.env.LEGACY_DATA_DIR ?? path.resolve(here, "../../../old/Data");
  const adminIds = new Set(
    (process.env.DISCORD_ADMIN_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
  const dryRun = process.argv.includes("--dry-run");

  const entries = await readLegacyItems(dataDir);
  const editorIds = await readLegacyEditors(dataDir);

  const expected = {
    items: entries.length,
    values: entries.reduce((n, e) => n + valueRows(e.item).length, 0),
    aliases: entries.reduce((n, e) => n + e.item.aliases.length, 0),
    editors: editorIds.length,
  };

  const db = createPrismaClient(connectionString);

  await db.$transaction(
    async (tx) => {
      for (const { slug, raw, item } of entries) {
        const data = {
          name: item.name,
          colour: toColour(slug, item.colour),
          unsure: item.unsure,
          imageSourceUrl: item.image || null,
          lastEditorTag: item.usertag || null,
          valuedAt: new Date(item.timestamp * 1000),
        };

        const stored = await tx.item.upsert({
          where: { slug },
          create: { slug, ...data },
          update: data,
        });

        await tx.itemAlias.deleteMany({ where: { itemId: stored.id } });
        await tx.itemValue.deleteMany({ where: { itemId: stored.id } });

        await tx.itemAlias.createMany({
          data: item.aliases.map((alias) => ({
            itemId: stored.id,
            alias,
            normalized: normalizeAlias(alias),
          })),
        });
        await tx.itemValue.createMany({
          data: valueRows(item).map((row) => ({ itemId: stored.id, ...row })),
        });

        const recorded = await tx.itemRevision.count({
          where: { itemId: stored.id, actor: IMPORT_ACTOR },
        });
        if (recorded === 0) {
          await tx.itemRevision.create({
            data: {
              itemId: stored.id,
              actor: IMPORT_ACTOR,
              reason: "verbatim from old/Data",
              snapshot: raw,
            },
          });
        }
      }

      for (const discordId of editorIds) {
        const role = adminIds.has(discordId)
          ? EditorRole.ADMIN
          : EditorRole.EDITOR;
        await tx.editor.upsert({
          where: { discordId },
          create: { discordId, role },
          update: { role },
        });
      }

      const actual = {
        items: await tx.item.count(),
        values: await tx.itemValue.count(),
        aliases: await tx.itemAlias.count(),
        editors: await tx.editor.count(),
      };

      for (const [key, count] of Object.entries(expected)) {
        const got = actual[key as keyof typeof actual];
        if (got !== count)
          fail(
            "reconciliation",
            `${key}: expected ${count}, database has ${got}`,
          );
      }

      console.log("reconciled:", actual);
      if (dryRun) throw new DryRunRollback();
    },
    { maxWait: 20_000, timeout: 180_000 },
  );

  await db.$disconnect();
  console.log("import complete.");
}

main().catch((error) => {
  if (error instanceof DryRunRollback) {
    console.log("dry run complete, nothing written.");
    return;
  }
  console.error(
    error instanceof ImportError ? `aborted — ${error.message}` : error,
  );
  process.exitCode = 1;
});
