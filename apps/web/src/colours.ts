import { ItemColour } from "@tvc/db/types";

const SWATCHES: Record<ItemColour, string> = {
  [ItemColour.PURPLE]: "#a855f7",
  [ItemColour.ORANGE]: "#f97316",
  [ItemColour.RED]: "#ef4444",
  [ItemColour.BLUE]: "#3b82f6",
  [ItemColour.GREEN]: "#22c55e",
  [ItemColour.YELLOW]: "#eab308",
  [ItemColour.WHITE]: "#d1d5db",
  [ItemColour.PINK]: "#ec4899",
  [ItemColour.CYAN]: "#06b6d4",
};

const UNSET = "#3f3f46";

export function swatch(colour: ItemColour | null): string {
  return colour ? SWATCHES[colour] : UNSET;
}
