import { EditorRole, type EditorModel } from "@tvc/db";
import { db } from "./db.ts";

export function findEditor(discordId: string): Promise<EditorModel | null> {
  return db.editor.findUnique({ where: { discordId } });
}

export function isAdmin(editor: { role: EditorRole }): boolean {
  return editor.role === EditorRole.ADMIN;
}
