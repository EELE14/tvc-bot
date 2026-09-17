import {
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { resolveValue } from "@tvc/core";
import { buildErrorEmbed, buildValueEmbed } from "../render/embeds.ts";
import type { ItemRepository } from "../types.ts";
import { EASTER_EGGS } from "./easter-eggs.ts";
import { ambiguousItem, describeFailure, unknownItem } from "../messages.ts";

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

export async function handleValue(
  interaction: ChatInputCommandInteraction,
  items: ItemRepository,
): Promise<void> {
  await interaction.deferReply();

  const query = interaction.options.getString("item", true);
  const serial = interaction.options.getString("serial");

  const egg = EASTER_EGGS[query.toLowerCase()];
  if (egg) {
    await interaction.followUp(egg);
    return;
  }

  try {
    const candidates = await items.find(query);
    const [item] = candidates;

    if (!item) {
      await interaction.followUp({
        embeds: [buildErrorEmbed(unknownItem(query))],
      });
      return;
    }
    if (candidates.length > 1) {
      await interaction.followUp({
        embeds: [buildErrorEmbed(ambiguousItem(query, candidates))],
      });
      return;
    }

    const resolved = resolveValue(item.values, serial);
    await interaction.followUp({ embeds: [buildValueEmbed(item, resolved)] });
  } catch (error) {
    await interaction.followUp({
      embeds: [buildErrorEmbed(describeFailure(error))],
    });
  }
}
