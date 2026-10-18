import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type ButtonInteraction,
  type StringSelectMenuInteraction,
} from "discord.js";

const PICK_PREFIX = "value-pick:";
const SELECT_LIMIT = 25;

export type PickOption = { name: string; slug: string };

export type PickInteraction = ButtonInteraction | StringSelectMenuInteraction;

export type Pick = { slug: string; serial: string | null };

export function isPick(customId: string): boolean {
  return customId.startsWith(PICK_PREFIX);
}

function pickId(...payload: (string | null)[]): string {
  return PICK_PREFIX + JSON.stringify(payload);
}

export function pickRow(
  options: PickOption[],
  serial: string | null,
): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] {
  const [only] = options;
  if (!only) return [];

  if (options.length === 1) {
    const button = new ButtonBuilder()
      .setCustomId(pickId(serial, only.slug))
      .setStyle(ButtonStyle.Primary)
      .setLabel(only.name);
    return [new ActionRowBuilder<ButtonBuilder>().addComponents(button)];
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(pickId(serial))
    .setPlaceholder("Pick an item")
    .addOptions(
      options
        .slice(0, SELECT_LIMIT)
        .map((option) => ({ label: option.name, value: option.slug })),
    );
  return [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)];
}

export function readPick(interaction: PickInteraction): Pick | undefined {
  const [serial = null, slug] = JSON.parse(
    interaction.customId.slice(PICK_PREFIX.length),
  ) as (string | null)[];
  const picked = interaction.isStringSelectMenu()
    ? interaction.values[0]
    : slug;
  return picked ? { slug: picked, serial } : undefined;
}
