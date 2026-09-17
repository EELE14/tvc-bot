export type ValueEntry = {
  serialMin: number | null;
  serialMax: number | null;
  amount: number;
  demand: number;
  stability: number;
  overpay: number;
};

export type RangedEntry = ValueEntry & { serialMin: number; serialMax: number };

export type ResolvedValue = {
  entry: ValueEntry;
  serial: number | null;
  clamped: boolean;
};
