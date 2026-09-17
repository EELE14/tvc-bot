import { Client, Events, GatewayIntentBits } from "discord.js";
import { registerCommands } from "../src/commands.ts";
import { loadDiscordConfig } from "../src/config.ts";

const config = loadDiscordConfig();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (ready) => {
  await registerCommands(ready, config.guildId);
  console.log(
    config.guildId
      ? `registered to guild ${config.guildId} for application ${ready.application.id}`
      : `registered globally for application ${ready.application.id}`,
  );
  await client.destroy();
});

await client.login(config.token);
