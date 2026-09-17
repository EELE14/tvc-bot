import { cache } from "react";
import { db } from "./db.ts";
import type {
  DailyUse,
  FailedQuery,
  PopularAmount,
  PopularItem,
  StaleFavourite,
  Totals,
} from "./types.ts";

const TREND_DAYS = 30;

function since(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

export const totals = cache(async (): Promise<Totals> => {
  const [uses, day, week, users, guilds, duration] = await Promise.all([
    db.lookup.count(),
    db.lookup.count({ where: { createdAt: { gte: since(1) } } }),
    db.lookup.count({ where: { createdAt: { gte: since(7) } } }),
    db.lookup.findMany({ distinct: ["userHash"], select: { userHash: true } }),
    db.lookup.findMany({ distinct: ["guildId"], select: { guildId: true } }),
    db.lookup.aggregate({ _avg: { durationMs: true } }),
  ]);

  return {
    uses,
    usesLastDay: day,
    usesLastWeek: week,
    users: users.length,
    guilds: guilds.length,
    averageMs: Math.round(duration._avg.durationMs ?? 0),
  };
});

export const outcomes = cache(async () => {
  const groups = await db.lookup.groupBy({
    by: ["outcome"],
    _count: true,
    orderBy: { _count: { outcome: "desc" } },
  });
  return groups.map((group) => ({
    outcome: group.outcome.toLowerCase(),
    uses: group._count,
  }));
});

export const dailyUses = cache(async (): Promise<DailyUse[]> => {
  const rows = await db.$queryRaw<
    Array<{ day: Date; uses: bigint; users: bigint }>
  >`
    select date_trunc('day', created_at) as day,
           count(*) as uses,
           count(distinct user_hash) as users
    from lookup
    where created_at >= now() - make_interval(days => ${TREND_DAYS})
    group by 1
    order by 1
  `;
  return rows.map((row) => ({
    day: row.day,
    uses: Number(row.uses),
    users: Number(row.users),
  }));
});

export const popularItems = cache(async (): Promise<PopularItem[]> => {
  const rows = await db.$queryRaw<
    Array<{ slug: string; name: string; uses: bigint; users: bigint }>
  >`
    select i.slug, i.name, count(*) as uses, count(distinct l.user_hash) as users
    from lookup l join item i on i.id = l.item_id
    group by i.slug, i.name
    order by uses desc
    limit 10
  `;
  return rows.map((row) => ({
    ...row,
    uses: Number(row.uses),
    users: Number(row.users),
  }));
});

export const popularAmounts = cache(async (): Promise<PopularAmount[]> => {
  const groups = await db.lookup.groupBy({
    by: ["amount"],
    _count: true,
    where: { amount: { not: null } },
    orderBy: { _count: { amount: "desc" } },
    take: 10,
  });
  return groups.map((group) => ({
    amount: group.amount ?? 0,
    uses: group._count,
  }));
});

export const failedQueries = cache(async (): Promise<FailedQuery[]> => {
  const rows = await db.$queryRaw<
    Array<{ query: string; outcome: string; uses: bigint; candidates: number }>
  >`
    select query, outcome::text as outcome, count(*) as uses, max(candidates) as candidates
    from lookup
    where outcome in ('unknown_item', 'ambiguous_query', 'serial_out_of_range')
    group by query, outcome
    order by uses desc
    limit 15
  `;
  return rows.map((row) => ({ ...row, uses: Number(row.uses) }));
});

export const staleFavourites = cache(async (): Promise<StaleFavourite[]> => {
  const rows = await db.$queryRaw<
    Array<{ slug: string; name: string; uses: bigint; valuedAt: Date }>
  >`
    select i.slug, i.name, count(*) as uses, i.valued_at as "valuedAt"
    from lookup l join item i on i.id = l.item_id
    where l.created_at >= now() - make_interval(days => ${TREND_DAYS})
    group by i.slug, i.name, i.valued_at
    order by count(*) desc, i.valued_at asc
    limit 10
  `;
  return rows
    .map((row) => ({ ...row, uses: Number(row.uses) }))
    .sort((a, b) => a.valuedAt.getTime() - b.valuedAt.getTime());
});
