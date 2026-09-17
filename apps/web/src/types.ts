import type {
  EditorModel,
  ItemAliasModel,
  ItemColour,
  ItemModel,
  ItemValueModel,
} from "@tvc/db/types";

export type SignedInEditor = {
  discordId: string;
  name: string;
  avatarUrl: string | null;
  role: EditorModel["role"];
};

export type ItemSummary = {
  slug: string;
  name: string;
  colour: ItemColour | null;
};

export type ItemDetail = ItemModel & {
  aliases: ItemAliasModel[];
  values: ItemValueModel[];
};
