import type { EditorRole, EditorModel } from "@tvc/db";
import { db } from "./db.ts";

export function findEditor(discordId: string): Promise<EditorModel | null> {
  return db.editor.findUnique({ where: { discordId } });
}

export function listEditors(): Promise<EditorModel[]> {
  return db.editor.findMany({ orderBy: [{ role: "asc" }, { addedAt: "asc" }] });
}

export function addEditor(
  discordId: string,
  role: EditorRole,
  addedBy: string,
): Promise<EditorModel> {
  return db.editor.create({ data: { discordId, role, addedBy } });
}

export function setEditorRole(
  discordId: string,
  role: EditorRole,
): Promise<EditorModel> {
  return db.editor.update({ where: { discordId }, data: { role } });
}

export function removeEditor(discordId: string): Promise<EditorModel> {
  return db.editor.delete({ where: { discordId } });
}
