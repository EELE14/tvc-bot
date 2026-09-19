import type {
  EditorModel,
  ItemAliasModel,
  ItemColour,
  ItemModel,
  ItemValueModel,
} from "@tvc/db/types";

export type FormState = { problems: string[] };

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

export type Totals = {
  uses: number;
  usesLastDay: number;
  usesLastWeek: number;
  users: number;
  guilds: number;
};

export type Timings = {
  ackMs: number;
  lookupMs: number;
  replyMs: number;
  slowest: number;
  overBudget: number;
};

export type DailyUse = { day: Date; uses: number; users: number };

export type PopularItem = {
  slug: string;
  name: string;
  uses: number;
  users: number;
};

export type PopularAmount = { amount: number; uses: number };

export type FailedQuery = {
  query: string;
  outcome: string;
  uses: number;
  candidates: number;
};

export type StaleFavourite = {
  slug: string;
  name: string;
  uses: number;
  valuedAt: Date;
};
