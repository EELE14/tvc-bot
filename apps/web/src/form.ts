import type { ItemInput } from "@tvc/core";
import { ItemColour } from "@tvc/db/types";

export type ItemFormInput = ItemInput & {
  colour: ItemColour | null;
  imageSourceUrl: string | null;
  unsure: boolean;
};

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function integer(form: FormData, field: string): number {
  return Number(text(form, field));
}

function toColour(raw: string): ItemColour | null {
  const member = raw.toUpperCase();
  return member in ItemColour
    ? ItemColour[member as keyof typeof ItemColour]
    : null;
}

export function parseItemForm(form: FormData): ItemFormInput {
  const ranged = text(form, "mode") === "tiers";
  const rows = ranged ? Number(text(form, "tierCount")) || 0 : 0;

  const values = ranged
    ? Array.from({ length: rows }, (_, index) => ({
        serialMin: integer(form, `tier.${index}.min`),
        serialMax: integer(form, `tier.${index}.max`),
        amount: integer(form, `tier.${index}.amount`),
        demand: integer(form, `tier.${index}.demand`),
        stability: integer(form, `tier.${index}.stability`),
        overpay: integer(form, `tier.${index}.overpay`),
      })).filter((_, index) => form.has(`tier.${index}.amount`))
    : [
        {
          serialMin: null,
          serialMax: null,
          amount: integer(form, "single.amount"),
          demand: integer(form, "single.demand"),
          stability: integer(form, "single.stability"),
          overpay: integer(form, "single.overpay"),
        },
      ];

  return {
    name: text(form, "name"),
    aliases: text(form, "aliases")
      .split(",")
      .map((alias) => alias.trim())
      .filter(Boolean),
    colour: toColour(text(form, "colour")),
    imageSourceUrl: text(form, "imageSourceUrl") || null,
    unsure: form.get("unsure") === "on",
    values,
  };
}
