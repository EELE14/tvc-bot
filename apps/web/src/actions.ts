"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { itemProblems } from "@tvc/core";
import { parseItemForm } from "./form.ts";
import {
  insertItem,
  slugTaken,
  softDeleteItem,
  updateItem,
} from "./item-writes.ts";
import { requireEditor } from "./session.ts";
import { toSlug } from "./slug.ts";
import type { FormState } from "./types.ts";

function itemPath(slug: string): string {
  return `/items/${encodeURIComponent(slug)}`;
}

export async function saveItem(
  slug: string,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const editor = await requireEditor();
  const input = parseItemForm(form);
  const problems = itemProblems(input);
  if (problems.length > 0) return { problems };

  await updateItem(slug, input, editor);
  revalidatePath("/", "layout");
  redirect(itemPath(slug));
}

export async function createItem(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const editor = await requireEditor();
  const input = parseItemForm(form);
  const slug = toSlug(input.name);
  const problems = itemProblems(input);
  if (slug === "") problems.push("name produces an empty slug");
  if (problems.length === 0 && (await slugTaken(slug))) {
    problems.push(`an item with slug \`${slug}\` already exists`);
  }
  if (problems.length > 0) return { problems };

  await insertItem(slug, input, editor);
  revalidatePath("/", "layout");
  redirect(itemPath(slug));
}

export async function deleteItem(slug: string): Promise<void> {
  const editor = await requireEditor();

  await softDeleteItem(slug, editor);
  revalidatePath("/", "layout");
  redirect("/");
}
