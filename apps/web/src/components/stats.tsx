import Link from "next/link";
import { formatAmount } from "@tvc/core";
import type { DailyUse } from "@/types.ts";

export function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-[11px] tracking-[0.08em] text-muted uppercase">
        {title}
      </h2>
      {hint && <p className="mb-2 text-xs text-muted">{hint}</p>}
      {children}
    </section>
  );
}

export function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-3 py-2">
      <div className="text-[11px] tracking-[0.06em] text-muted uppercase">
        {label}
      </div>
      <div className="text-lg text-white">{value}</div>
    </div>
  );
}

export function Table({
  columns,
  rows,
}: {
  columns: string[];
  rows: React.ReactNode[][];
}) {
  if (rows.length === 0) {
    return <p className="text-muted">nothing recorded yet</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] border-collapse">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column}
                className={`border-b border-line px-2 py-1 text-[11px] font-normal tracking-[0.06em] whitespace-nowrap text-muted uppercase ${index === 0 ? "text-left" : "text-right"}`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, rowIndex) => (
            <tr key={rowIndex} className="border-b border-[#141414]">
              {cells.map((cell, index) => (
                <td
                  key={index}
                  className={`px-2 py-1.5 ${index === 0 ? "" : "text-right whitespace-nowrap"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ItemLink({ slug, name }: { slug: string; name: string }) {
  return (
    <Link
      href={`/items/${encodeURIComponent(slug)}`}
      className="hover:text-white"
    >
      {name}
    </Link>
  );
}

export function Amount({ value }: { value: number }) {
  return <span>${formatAmount(value)}</span>;
}

export function DailyChart({ days }: { days: DailyUse[] }) {
  const peak = Math.max(1, ...days.map((day) => day.uses));

  return (
    <div className="flex h-28 items-end gap-[3px]">
      {days.map((day) => (
        <div
          key={day.day.toISOString()}
          title={`${day.day.toISOString().slice(0, 10)}: ${day.uses} uses, ${day.users} users`}
          className="flex-1 bg-[#3f3f46] hover:bg-[#71717a]"
          style={{ height: `${Math.max(3, (day.uses / peak) * 100)}%` }}
        />
      ))}
    </div>
  );
}
