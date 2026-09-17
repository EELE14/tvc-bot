import type { ItemModel, ItemValueModel } from "@tvc/db";

export type DiscordConfig = {
  token: string;
  clientId: string;
  guildId: string | undefined;
};

export type BotConfig = DiscordConfig & {
  databaseUrl: string;
  itemCacheTtlMs: number;
};

export type ItemWithValues = ItemModel & { values: ItemValueModel[] };

export type ItemRepository = {
  names: () => Promise<string[]>;
  find: (query: string) => Promise<ItemWithValues[]>;
};
