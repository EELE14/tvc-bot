import { EditorRole } from "@tvc/db/types";

export function isAdmin(editor: { role: EditorRole }): boolean {
  return editor.role === EditorRole.ADMIN;
}

export function mayModify(actorId: string, targetId: string): boolean {
  return actorId !== targetId;
}
