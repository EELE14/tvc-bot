"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { swatch } from "@/colours.ts";
import type { ItemSummary } from "@/types.ts";

export function ItemList({ items }: { items: ItemSummary[] }) {
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const needle = query.toLowerCase();
  const visible = items.filter((item) =>
    item.name.toLowerCase().includes(needle),
  );

  return (
    <>
      <div className="flex gap-2 border-b border-line p-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="search…"
          aria-label="search items"
          className="w-full border border-line bg-[#0f0f0f] px-2 py-1 text-ink outline-none focus:border-line-strong"
        />
        <Link
          href="/items/new"
          aria-label="new item"
          className="border border-line px-2.5 py-1 text-muted hover:border-line-strong hover:text-ink"
        >
          +
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        {visible.map((item) => {
          const href = `/items/${encodeURIComponent(item.slug)}`;
          const active = pathname === href;
          return (
            <Link
              key={item.slug}
              href={href}
              className={`flex min-h-10 items-center gap-2 overflow-hidden border-b border-[#141414] px-2.5 py-2.5 hover:bg-[#141414] ${active ? "bg-[#161616]" : ""}`}
            >
              <span
                aria-hidden
                className="size-[7px] shrink-0 rounded-full"
                style={{ background: swatch(item.colour) }}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
        {visible.length === 0 && <p className="p-2.5 text-muted">no match</p>}
      </div>
    </>
  );
}
