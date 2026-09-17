import { loadDiscordConfig } from "../src/config.ts";
import { registerCommands } from "../src/commands.ts";

const config = loadDiscordConfig();
await registerCommands(config);
console.log(
  config.guildId
    ? `registered to guild ${config.guildId}`
    : "registered globally",
);
