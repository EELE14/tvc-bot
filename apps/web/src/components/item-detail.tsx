import { splitValues } from "@/items.ts";
import type { ItemDetail } from "@/types.ts";
import { ItemActions } from "./item-actions.tsx";
import { TierTable, UnrangedValue } from "./value-tables.tsx";

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span>
      {label}: {value || "—"}
    </span>
  );
}

export function ItemDetailView({ item }: { item: ItemDetail }) {
  const { unranged, tiers } = splitValues(item);
  const aliases = item.aliases.map((alias) => alias.alias).join(", ");

  return (
    <article>
      {item.imageSourceUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={item.imageSourceUrl}
          alt=""
          className="mb-4 block size-18 border border-line object-contain"
        />
      )}

      <h1 className="mb-3.5 flex flex-wrap items-center gap-2.5 text-[15px] text-white">
        {item.name}
        {item.unsure && (
          <span className="border border-orange-500 px-1.5 text-[11px] text-orange-500">
            unsure
          </span>
        )}
      </h1>

      <div className="mb-5 flex flex-wrap gap-3 text-xs text-muted">
        <Meta label="slug" value={item.slug} />
        <Meta label="colour" value={item.colour?.toLowerCase() ?? ""} />
        <Meta label="aliases" value={aliases} />
        <Meta label="last editor" value={item.lastEditorTag ?? ""} />
        <Meta
          label="updated"
          value={item.valuedAt.toISOString().slice(0, 10)}
        />
      </div>

      {unranged && <UnrangedValue value={unranged} />}
      {tiers.length > 0 && <TierTable tiers={tiers} />}
      {!unranged && tiers.length === 0 && (
        <p className="text-muted">no values recorded</p>
      )}

      <details className="mt-6">
        <summary className="cursor-pointer text-[11px] tracking-[0.08em] text-muted uppercase">
          raw
        </summary>
        <pre className="mt-2 overflow-x-auto border border-line bg-[#0f0f0f] p-4 text-xs break-all whitespace-pre-wrap text-zinc-400">
          {JSON.stringify(item, null, 2)}
        </pre>
      </details>

      <ItemActions slug={item.slug} name={item.name} />
    </article>
  );
}
