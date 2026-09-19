"use server";

import { revalidatePath } from "next/cache";
import { EditorRole } from "@tvc/db";
import { isDiscordId } from "./discord-id.ts";
import { mayModify } from "./access.ts";
import {
  addEditor,
  findEditor,
  removeEditor,
  setEditorRole,
} from "./editors.ts";
import { requireAdmin } from "./session.ts";
import type { FormState } from "./types.ts";

function toRole(raw: FormDataEntryValue | null): EditorRole {
  return raw === EditorRole.ADMIN ? EditorRole.ADMIN : EditorRole.EDITOR;
}

export async function inviteEditor(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const discordId = String(form.get("discordId") ?? "").trim();

  if (!isDiscordId(discordId)) {
    return { problems: ["a discord id is 17 to 20 digits"] };
  }
  if (await findEditor(discordId)) {
    return { problems: [`${discordId} already has access`] };
  }

  await addEditor(discordId, toRole(form.get("role")), admin.discordId);
  revalidatePath("/admin");
  return { problems: [] };
}

export async function changeRole(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const discordId = String(form.get("discordId") ?? "");
  if (!mayModify(admin.discordId, discordId)) return;

  await setEditorRole(discordId, toRole(form.get("role")));
  revalidatePath("/admin");
}

export async function revokeEditor(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const discordId = String(form.get("discordId") ?? "");
  if (!mayModify(admin.discordId, discordId)) return;

  await removeEditor(discordId);
  revalidatePath("/admin");
}
