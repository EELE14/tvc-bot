import {
  Amount,
  DailyChart,
  Figure,
  ItemLink,
  Panel,
  Table,
} from "@/components/stats.tsx";
import { requireAdmin } from "@/session.ts";
import {
  dailyUses,
  failedQueries,
  outcomes,
  popularAmounts,
  popularItems,
  staleFavourites,
  totals,
} from "@/stats.ts";

const OUTCOME_LABELS: Record<string, string> = {
  resolved: "answered",
  unknown_item: "no such item",
  ambiguous_query: "ambiguous alias",
  serial_required: "serial missing",
  serial_out_of_range: "serial in a gap",
  serial_unparseable: "serial unreadable",
  item_unpriced: "item has no value",
  easter_egg: "easter egg",
  failed: "lookup failed",
};

function day(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export default async function StatsPage() {
  await requireAdmin();

  const [figures, breakdown, days, items, amounts, failures, stale] =
    await Promise.all([
      totals(),
      outcomes(),
      dailyUses(),
      popularItems(),
      popularAmounts(),
      failedQueries(),
      staleFavourites(),
    ]);

  return (
    <>
      <h1 className="mb-5 text-[15px] text-white">usage</h1>

      <div className="mb-8 grid grid-cols-2 gap-2 md:grid-cols-3">
        <Figure label="total uses" value={String(figures.uses)} />
        <Figure label="last 7 days" value={String(figures.usesLastWeek)} />
        <Figure label="last 24 hours" value={String(figures.usesLastDay)} />
        <Figure label="distinct users" value={String(figures.users)} />
        <Figure label="servers" value={String(figures.guilds)} />
        <Figure label="average lookup" value={`${figures.averageMs} ms`} />
      </div>

      <Panel title="uses per day" hint="last 30 days">
        <DailyChart days={days} />
      </Panel>

      <Panel title="outcomes">
        <Table
          columns={["outcome", "uses", "share"]}
          rows={breakdown.map((row) => [
            OUTCOME_LABELS[row.outcome] ?? row.outcome,
            row.uses,
            `${Math.round((row.uses / Math.max(1, figures.uses)) * 100)}%`,
          ])}
        />
      </Panel>

      <Panel title="most asked items">
        <Table
          columns={["item", "uses", "users"]}
          rows={items.map((row) => [
            <ItemLink key={row.slug} slug={row.slug} name={row.name} />,
            row.uses,
            row.users,
          ])}
        />
      </Panel>

      <Panel title="most asked values">
        <Table
          columns={["value", "uses"]}
          rows={amounts.map((row) => [
            <Amount key={row.amount} value={row.amount} />,
            row.uses,
          ])}
        />
      </Panel>

      <Panel
        title="what people asked for and did not get"
        hint="missing items, colliding aliases and serials that fall between tiers"
      >
        <Table
          columns={["query", "problem", "uses", "candidates"]}
          rows={failures.map((row) => [
            row.query,
            OUTCOME_LABELS[row.outcome] ?? row.outcome,
            row.uses,
            row.outcome === "ambiguous_query" ? row.candidates : "—",
          ])}
        />
      </Panel>

      <Panel
        title="asked often, valued long ago"
        hint="oldest valuation first, among the most requested items of the last 30 days"
      >
        <Table
          columns={["item", "uses", "last valued"]}
          rows={stale.map((row) => [
            <ItemLink key={row.slug} slug={row.slug} name={row.name} />,
            row.uses,
            day(row.valuedAt),
          ])}
        />
      </Panel>
    </>
  );
}
