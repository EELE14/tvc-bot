import { normalizeAlias } from "@tvc/core";
import type { PrismaClient } from "@tvc/db";
import { db } from "./db.ts";
import type { ItemFormInput } from "./form.ts";
import type { SignedInEditor } from "./types.ts";

type Transaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

function itemFields(input: ItemFormInput, editor: SignedInEditor) {
  return {
    name: input.name,
    colour: input.colour,
    imageSourceUrl: input.imageSourceUrl,
    unsure: input.unsure,
    lastEditorTag: editor.name,
    valuedAt: new Date(),
  };
}

async function replaceChildren(
  tx: Transaction,
  itemId: string,
  input: ItemFormInput,
) {
  await tx.itemAlias.deleteMany({ where: { itemId } });
  await tx.itemValue.deleteMany({ where: { itemId } });
  await tx.itemAlias.createMany({
    data: input.aliases.map((alias) => ({
      itemId,
      alias,
      normalized: normalizeAlias(alias),
    })),
  });
  await tx.itemValue.createMany({
    data: input.values.map((value) => ({ itemId, ...value })),
  });
}

async function recordRevision(
  tx: Transaction,
  itemId: string,
  editor: SignedInEditor,
  reason: string,
) {
  const snapshot = await tx.item.findUniqueOrThrow({
    where: { id: itemId },
    include: { aliases: true, values: true },
  });
  await tx.itemRevision.create({
    data: {
      itemId,
      actor: editor.discordId,
      reason,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
    },
  });
}

export function slugTaken(slug: string): Promise<boolean> {
  return db.item.findFirst({ where: { slug } }).then(Boolean);
}

export function updateItem(
  slug: string,
  input: ItemFormInput,
  editor: SignedInEditor,
): Promise<void> {
  return db.$transaction(async (tx) => {
    const item = await tx.item.update({
      where: { slug },
      data: itemFields(input, editor),
    });
    await replaceChildren(tx, item.id, input);
    await recordRevision(tx, item.id, editor, "edited in the web interface");
  });
}

export function insertItem(
  slug: string,
  input: ItemFormInput,
  editor: SignedInEditor,
): Promise<void> {
  return db.$transaction(async (tx) => {
    const item = await tx.item.create({
      data: { slug, ...itemFields(input, editor) },
    });
    await replaceChildren(tx, item.id, input);
    await recordRevision(tx, item.id, editor, "created in the web interface");
  });
}

export function softDeleteItem(
  slug: string,
  editor: SignedInEditor,
): Promise<void> {
  return db.$transaction(async (tx) => {
    const item = await tx.item.update({
      where: { slug },
      data: { deletedAt: new Date(), lastEditorTag: editor.name },
    });
    await recordRevision(tx, item.id, editor, "deleted in the web interface");
  });
}
