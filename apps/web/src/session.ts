import { redirect } from "next/navigation";
import { auth } from "./auth.ts";
import { findEditor, isAdmin } from "./editors.ts";
import type { SignedInEditor } from "./types.ts";

export async function currentEditor(): Promise<SignedInEditor | null> {
  const session = await auth();
  const discordId = session?.user?.discordId;
  if (!discordId) return null;

  const editor = await findEditor(discordId);
  if (!editor) return null;

  return {
    discordId,
    name: session.user.name ?? discordId,
    avatarUrl: session.user.image ?? null,
    role: editor.role,
  };
}

export async function requireEditor(): Promise<SignedInEditor> {
  const editor = await currentEditor();
  if (!editor) redirect("/forbidden");

  return editor;
}

export async function requireAdmin(): Promise<SignedInEditor> {
  const editor = await requireEditor();
  if (!isAdmin(editor)) redirect("/forbidden");

  return editor;
}
