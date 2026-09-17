import type { EditorModel } from "@tvc/db";

export type SignedInEditor = {
  discordId: string;
  name: string;
  avatarUrl: string | null;
  role: EditorModel["role"];
};
