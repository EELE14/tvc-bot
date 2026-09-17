import { Colors, EmbedBuilder } from "discord.js";
import { formatAmount, type ResolvedValue } from "@tvc/core";
import { INCOMPLETE_VALUES } from "../messages.ts";
import type { ItemWithValues } from "../types.ts";
import { ANSI_AMOUNT, ansiBlock, labelledRow, paint } from "./ansi.ts";
import { embedColour, paintedScale } from "./colours.ts";

function serialSuffix(item: ItemWithValues, resolved: ResolvedValue): string {
  if (resolved.serial === null) return "";

  const highest = Math.max(...item.values.map((value) => value.serialMax ?? 0));
  return resolved.serial === highest ? " #HIGH" : ` #${resolved.serial}`;
}

function isIncomplete(item: ItemWithValues): boolean {
  return (
    item.values.length === 0 || item.values.some((value) => value.amount === 0)
  );
}

export function buildValueEmbed(
  item: ItemWithValues,
  resolved: ResolvedValue,
): EmbedBuilder {
  const { amount, demand, stability, overpay } = resolved.entry;
  const embed = new EmbedBuilder()
    .setColor(embedColour(item.colour))
    .setTitle(item.name + serialSuffix(item, resolved))
    .setDescription(
      ansiBlock([
        labelledRow("Value", paint(ANSI_AMOUNT, `$${formatAmount(amount)}`)),
        labelledRow("Demand", paintedScale(demand)),
        labelledRow("Stability", paintedScale(stability)),
        labelledRow("Overpay", paintedScale(overpay)),
      ]),
    );

  if (item.imageSourceUrl) embed.setThumbnail(item.imageSourceUrl);
  if (isIncomplete(item)) embed.setFooter({ text: INCOMPLETE_VALUES });

  return embed;
}

export function buildErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder().setColor(Colors.Red).setDescription(message);
}
