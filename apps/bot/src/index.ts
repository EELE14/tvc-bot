import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
  type PresenceStatusData,
} from "discord.js";
import { createPrismaClient } from "@tvc/db";
import { loadBotConfig } from "./config.ts";
import { createItemRepository } from "./items.ts";
import { registerCommands } from "./commands.ts";
import {
  handleValue,
  handleValueAutocomplete,
  valueCommand,
} from "./value/command.ts";

const config = loadBotConfig();
const db = createPrismaClient(config.databaseUrl);
const items = createItemRepository(db, config.itemCacheTtlMs);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function setPresence(status: PresenceStatusData, state: string): void {
  client.user?.setPresence({
    status,
    activities: [{ name: state, state, type: ActivityType.Custom }],
  });
}

client.once(Events.ClientReady, async (ready) => {
  setPresence("dnd", "Starting (Syncing)");

  try {
    await registerCommands(config);
    await items.names();
    setPresence("online", "Trading with eele14 & ethachu21");
    console.log(`logged in as ${ready.user.tag}`);
  } catch (error) {
    setPresence("dnd", "Startup failed");
    console.error("startup failed", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (
      interaction.isAutocomplete() &&
      interaction.commandName === valueCommand.name
    ) {
      await handleValueAutocomplete(interaction, items);
      return;
    }
    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === valueCommand.name
    ) {
      await handleValue(interaction, items);
    }
  } catch (error) {
    console.error("interaction failed", error);
  }
});

async function shutdown(): Promise<void> {
  await client.destroy();
  await db.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await client.login(config.token);
