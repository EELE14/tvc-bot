import {
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { buildErrorEmbed, buildValueEmbed } from "../render/embeds.ts";
import { ambiguousItem, describeFailure, unknownItem } from "../messages.ts";
import type { ItemRepository } from "../types.ts";
import type { LookupRecorder } from "../analytics.ts";
import { lookUp, type Lookup } from "./lookup.ts";

const AUTOCOMPLETE_LIMIT = 25;

export const valueCommand = new SlashCommandBuilder()
  .setName("value")
  .setDescription("Retrieve an item's value")
  .addStringOption((option) =>
    option
      .setName("item")
      .setDescription("Select an Item")
      .setRequired(true)
      .setAutocomplete(true),
  )
  .addStringOption((option) =>
    option.setName("serial").setDescription("Enter serial"),
  );

export async function handleValueAutocomplete(
  interaction: AutocompleteInteraction,
  items: ItemRepository,
): Promise<void> {
  const typed = interaction.options.getFocused().toLowerCase();
  const names = await items.names();
  const matches = names
    .filter((name) => name.toLowerCase().includes(typed))
    .slice(0, AUTOCOMPLETE_LIMIT);

  await interaction.respond(matches.map((name) => ({ name, value: name })));
}

async function reply(
  interaction: ChatInputCommandInteraction,
  query: string,
  lookup: Lookup,
): Promise<void> {
  switch (lookup.outcome) {
    case "EASTER_EGG":
      await interaction.followUp(lookup.reply);
      return;
    case "UNKNOWN_ITEM":
      await interaction.followUp({
        embeds: [buildErrorEmbed(unknownItem(query))],
      });
      return;
    case "AMBIGUOUS_QUERY":
      await interaction.followUp({
        embeds: [buildErrorEmbed(ambiguousItem(query, lookup.candidates))],
      });
      return;
    case "RESOLVED":
      await interaction.followUp({
        embeds: [buildValueEmbed(lookup.item, lookup.resolved)],
      });
      return;
    default:
      await interaction.followUp({
        embeds: [buildErrorEmbed(describeFailure(lookup.error))],
      });
  }
}

export async function handleValue(
  interaction: ChatInputCommandInteraction,
  items: ItemRepository,
  record: LookupRecorder,
): Promise<void> {
  await interaction.deferReply();

  const query = interaction.options.getString("item", true);
  const serial = interaction.options.getString("serial");
  const started = Date.now();

  const lookup = await lookUp(items, query, serial);
  await reply(interaction, query, lookup);

  await record(lookup, {
    query,
    serialInput: serial,
    userId: interaction.user.id,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    durationMs: Date.now() - started,
  });
}
