const ESCAPE = String.fromCharCode(27);

export const ANSI_LABEL = "1;37";
export const ANSI_AMOUNT = "2;32";

export function paint(code: string, text: string): string {
  return `${ESCAPE}[${code}m${text}${ESCAPE}[0m`;
}

export function ansiBlock(lines: string[]): string {
  return ["```ansi", ...lines, "```"].join("\n");
}

export function labelledRow(label: string, value: string): string {
  return `${paint(ANSI_LABEL, `${label}:`)} ${value}`;
}
