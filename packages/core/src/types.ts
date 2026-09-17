export type ValueEntry = {
  serialMin: number | null;
  serialMax: number | null;
  amount: number;
  demand: number;
  stability: number;
  overpay: number;
};

export type RangedEntry = ValueEntry & { serialMin: number; serialMax: number };

export type Ranged<T extends ValueEntry> = T & RangedEntry;

export type ResolvedValue<T extends ValueEntry = ValueEntry> = {
  entry: T;
  serial: number | null;
  clamped: boolean;
};
