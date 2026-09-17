"use client";

import { SCALE_LABELS } from "@tvc/core";
import { ItemColour } from "@tvc/db/types";

export const inputClass =
  "w-full border border-line bg-[#0f0f0f] px-2 py-1 text-ink outline-none focus:border-line-strong";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-2 flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
      <span className="text-muted md:w-24 md:shrink-0">{label}</span>
      {children}
    </label>
  );
}

export function ScaleSelect({
  name,
  value,
  from = 1,
}: {
  name: string;
  value: number;
  from?: number;
}) {
  return (
    <select name={name} defaultValue={value} className={inputClass}>
      {SCALE_LABELS.slice(from).map((label, index) => (
        <option key={label} value={index + from}>
          {index + from} — {label}
        </option>
      ))}
    </select>
  );
}

export function ColourSelect({ value }: { value: ItemColour | null }) {
  return (
    <select name="colour" defaultValue={value ?? ""} className={inputClass}>
      <option value="">none</option>
      {Object.values(ItemColour).map((colour) => (
        <option key={colour} value={colour}>
          {colour.toLowerCase()}
        </option>
      ))}
    </select>
  );
}
