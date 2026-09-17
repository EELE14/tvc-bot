"use client";

import { useState } from "react";
import type { ValueEntry } from "@tvc/core";
import { ScaleSelect, inputClass } from "./fields.tsx";

const EMPTY = {
  serialMin: 0,
  serialMax: 0,
  amount: 0,
  demand: 1,
  stability: 1,
  overpay: 0,
} satisfies ValueEntry;

const HEADINGS = ["min", "max", "value", "demand", "stability", "overpay", ""];

export function TierRows({ tiers }: { tiers: ValueEntry[] }) {
  const [rows, setRows] = useState(tiers.length > 0 ? tiers : [EMPTY]);

  return (
    <>
      <input type="hidden" name="tierCount" value={rows.length} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr>
              {HEADINGS.map((heading) => (
                <th
                  key={heading}
                  className="border-b border-line px-2 py-1 text-left text-[11px] font-normal tracking-[0.06em] text-muted uppercase"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="px-1 py-1">
                  <input
                    name={`tier.${index}.min`}
                    defaultValue={row.serialMin ?? 0}
                    className={inputClass}
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    name={`tier.${index}.max`}
                    defaultValue={row.serialMax ?? 0}
                    className={inputClass}
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    name={`tier.${index}.amount`}
                    defaultValue={row.amount}
                    className={inputClass}
                  />
                </td>
                <td className="px-1 py-1">
                  <ScaleSelect
                    name={`tier.${index}.demand`}
                    value={row.demand}
                  />
                </td>
                <td className="px-1 py-1">
                  <ScaleSelect
                    name={`tier.${index}.stability`}
                    value={row.stability}
                  />
                </td>
                <td className="px-1 py-1">
                  <ScaleSelect
                    name={`tier.${index}.overpay`}
                    value={row.overpay}
                    from={0}
                  />
                </td>
                <td className="px-1 py-1">
                  <button
                    type="button"
                    aria-label={`remove tier ${index + 1}`}
                    onClick={() =>
                      setRows(rows.filter((_, other) => other !== index))
                    }
                    className="cursor-pointer border border-line px-2 hover:border-line-strong"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => setRows([...rows, EMPTY])}
        className="mt-2 cursor-pointer border border-line px-3 py-1 text-muted hover:border-line-strong hover:text-ink"
      >
        + row
      </button>
    </>
  );
}
