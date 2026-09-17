import { REST, Routes } from "discord.js";
import { valueCommand } from "./value/command.ts";
import type { DiscordConfig } from "./types.ts";

export async function registerCommands({
  token,
  clientId,
  guildId,
}: DiscordConfig): Promise<void> {
  const body = [valueCommand.toJSON()];
  const rest = new REST().setToken(token);
  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);

  await rest.put(route, { body });
}
