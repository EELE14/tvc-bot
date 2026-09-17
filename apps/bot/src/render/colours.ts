import { Colors, type ColorResolvable } from "discord.js";
import { scaleLabel } from "@tvc/core";
import { ItemColour } from "@tvc/db";
import { paint } from "./ansi.ts";

const EMBED_COLOURS: Record<ItemColour, ColorResolvable> = {
  [ItemColour.PURPLE]: Colors.Purple,
  [ItemColour.ORANGE]: Colors.Orange,
  [ItemColour.RED]: Colors.Red,
  [ItemColour.BLUE]: Colors.Blue,
  [ItemColour.GREEN]: Colors.Green,
  [ItemColour.YELLOW]: Colors.Yellow,
  [ItemColour.WHITE]: Colors.White,
  [ItemColour.PINK]: 0xec4899,
  [ItemColour.CYAN]: 0x06b6d4,
};

const SCALE_ANSI = ["2;30", "2;31", "2;33", "2;32", "2;36", "2;34"];

export function embedColour(colour: ItemColour | null): ColorResolvable {
  return colour ? EMBED_COLOURS[colour] : Colors.DarkGrey;
}

export function paintedScale(level: number): string {
  return paint(SCALE_ANSI[level] ?? "2;30", scaleLabel(level));
}
