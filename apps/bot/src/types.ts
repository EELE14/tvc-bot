import type { Suggestible } from "@tvc/core";
import type { ItemModel, ItemValueModel } from "@tvc/db";

export type DiscordConfig = {
  token: string;
  guildId: string | undefined;
};

export type BotConfig = DiscordConfig & {
  databaseUrl: string;
  itemCacheTtlMs: number;
  analyticsSalt: string | undefined;
};

export type ItemWithValues = ItemModel & { values: ItemValueModel[] };

export type CatalogueEntry = Suggestible & { slug: string };

export type ItemRepository = {
  names: () => Promise<string[]>;
  catalogue: () => Promise<CatalogueEntry[]>;
  find: (query: string) => Promise<ItemWithValues[]>;
};
