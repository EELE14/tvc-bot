import {
  MessageFlags,
  SlashCommandBuilder,
  type InteractionEditReplyOptions,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { buildErrorEmbed, buildValueEmbed } from "../render/embeds.ts";
import {
  ONLY_ASKER_MAY_PICK,
  ambiguousItem,
  describeFailure,
  unknownItem,
} from "../messages.ts";
import type { ItemRepository } from "../types.ts";
import type { LookupRecorder } from "../analytics.ts";
import { lookUp, type Lookup } from "./lookup.ts";
import { pickRow, readPick, type PickInteraction } from "./pick.ts";

const AUTOCOMPLETE_LIMIT = 25;
const SERIAL_MAX_LENGTH = 20;

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
    option
      .setName("serial")
      .setDescription("Enter serial")
      .setMaxLength(SERIAL_MAX_LENGTH),
  );

export async function handleValueAutocomplete(
  interaction: AutocompleteInteraction,
  items: ItemRepository,
): Promise<void> {
  const typed = interaction.options.getFocused().toLowerCase();
  const names = await items.names().catch(() => [] as string[]);
  const matches = names
    .filter((name) => name.toLowerCase().includes(typed))
    .slice(0, AUTOCOMPLETE_LIMIT);

  await interaction.respond(matches.map((name) => ({ name, value: name })));
}

function present(query: string, lookup: Lookup): InteractionEditReplyOptions {
  const cleared = { content: "", embeds: [], components: [] };
  switch (lookup.outcome) {
    case "EASTER_EGG":
      return { ...cleared, content: lookup.reply };
    case "UNKNOWN_ITEM":
      return {
        ...cleared,
        embeds: [buildErrorEmbed(unknownItem(query, lookup.suggestions))],
        components: pickRow(lookup.suggestions, lookup.serial),
      };
    case "AMBIGUOUS_QUERY":
      return {
        ...cleared,
        embeds: [buildErrorEmbed(ambiguousItem(query))],
        components: pickRow(lookup.candidates, lookup.serial),
      };
    case "RESOLVED":
      return {
        ...cleared,
        embeds: [buildValueEmbed(lookup.item, lookup.resolved)],
      };
    default:
      return {
        ...cleared,
        embeds: [buildErrorEmbed(describeFailure(lookup.error))],
      };
  }
}

export async function handleValuePick(
  interaction: PickInteraction,
  items: ItemRepository,
): Promise<void> {
  if (
    interaction.user.id !== interaction.message.interactionMetadata?.user.id
  ) {
    await interaction.reply({
      content: ONLY_ASKER_MAY_PICK,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const pick = readPick(interaction);
  if (!pick) return;

  await interaction.deferUpdate();
  const lookup = await lookUp(items, pick.slug, pick.serial);
  await interaction.editReply(present(pick.slug, lookup));
}

export async function handleValue(
  interaction: ChatInputCommandInteraction,
  items: ItemRepository,
  record: LookupRecorder,
): Promise<void> {
  const received = Date.now();
  await interaction.deferReply();
  const acknowledged = Date.now();

  const query = interaction.options.getString("item", true);
  const serial = interaction.options.getString("serial");

  const lookup = await lookUp(items, query, serial);
  const resolved = Date.now();

  await interaction.editReply(present(query, lookup));

  await record(lookup, {
    query,
    serialInput: serial,
    userId: interaction.user.id,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    ackMs: acknowledged - received,
    lookupMs: resolved - acknowledged,
    durationMs: Date.now() - acknowledged,
  });
}
