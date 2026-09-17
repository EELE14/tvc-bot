import type { BotConfig, DiscordConfig } from "./types.ts";

const DEFAULT_ITEM_CACHE_TTL_MS = 30_000;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function loadDiscordConfig(): DiscordConfig {
  return {
    token: required("DISCORD_BOT_TOKEN"),
    guildId: process.env.DISCORD_GUILD_ID || undefined,
  };
}

export function loadBotConfig(): BotConfig {
  return {
    ...loadDiscordConfig(),
    databaseUrl: required("DATABASE_URL"),
    itemCacheTtlMs: Number(
      process.env.ITEM_CACHE_TTL_MS ?? DEFAULT_ITEM_CACHE_TTL_MS,
    ),
    analyticsSalt: process.env.ANALYTICS_SALT || undefined,
  };
}
