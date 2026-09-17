import { createHmac } from "node:crypto";
import type { PrismaClient } from "@tvc/db";
import { type Lookup, outcomeCode } from "./value/lookup.ts";

export type LookupContext = {
  query: string;
  serialInput: string | null;
  userId: string;
  guildId: string | null;
  channelId: string | null;
  durationMs: number;
};

export type LookupRecorder = (
  lookup: Lookup,
  context: LookupContext,
) => Promise<void>;

function pseudonym(salt: string, userId: string): string {
  return createHmac("sha256", salt).update(userId).digest("base64url");
}

function measurements(lookup: Lookup) {
  if (lookup.outcome === "RESOLVED") {
    return {
      itemId: lookup.item.id,
      serial: lookup.resolved.serial,
      amount: lookup.resolved.entry.amount,
      candidates: 1,
    };
  }
  if (lookup.outcome === "AMBIGUOUS_QUERY") {
    return {
      itemId: null,
      serial: null,
      amount: null,
      candidates: lookup.candidates.length,
    };
  }
  if (lookup.outcome === "UNKNOWN_ITEM" || lookup.outcome === "EASTER_EGG") {
    return { itemId: null, serial: null, amount: null, candidates: 0 };
  }
  return {
    itemId: lookup.item?.id ?? null,
    serial: null,
    amount: null,
    candidates: lookup.item ? 1 : 0,
  };
}

export function createLookupRecorder(
  db: PrismaClient,
  salt: string | undefined,
): LookupRecorder {
  if (!salt) {
    console.warn("ANALYTICS_SALT is not set, lookups are not recorded");
    return async () => {};
  }

  return async (lookup, context) => {
    try {
      await db.lookup.create({
        data: {
          outcome: outcomeCode(lookup),
          query: context.query,
          serialInput: context.serialInput,
          userHash: pseudonym(salt, context.userId),
          guildId: context.guildId,
          channelId: context.channelId,
          durationMs: context.durationMs,
          ...measurements(lookup),
        },
      });
    } catch (error) {
      console.error("recording the lookup failed", error);
    }
  };
}
