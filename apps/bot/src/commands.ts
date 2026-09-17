import type { Client } from "discord.js";
import { valueCommand } from "./value/command.ts";

export async function registerCommands(
  client: Client<true>,
  guildId: string | undefined,
): Promise<void> {
  const body = [valueCommand.toJSON()];

  if (guildId) {
    await client.application.commands.set(body, guildId);
    return;
  }
  await client.application.commands.set(body);
}
