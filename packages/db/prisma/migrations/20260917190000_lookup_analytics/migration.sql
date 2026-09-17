CREATE TYPE "lookup_outcome" AS ENUM ('resolved', 'unknown_item', 'ambiguous_query', 'serial_required', 'serial_out_of_range', 'serial_unparseable', 'item_unpriced', 'easter_egg', 'failed');

CREATE TABLE "lookup" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" "lookup_outcome" NOT NULL,
    "query" TEXT NOT NULL,
    "item_id" TEXT,
    "serial_input" TEXT,
    "serial" INTEGER,
    "amount" INTEGER,
    "candidates" INTEGER NOT NULL DEFAULT 1,
    "user_hash" TEXT NOT NULL,
    "guild_id" TEXT,
    "channel_id" TEXT,
    "duration_ms" INTEGER NOT NULL,

    CONSTRAINT "lookup_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lookup_created_at_idx" ON "lookup"("created_at");

CREATE INDEX "lookup_item_id_created_at_idx" ON "lookup"("item_id", "created_at");

CREATE INDEX "lookup_outcome_created_at_idx" ON "lookup"("outcome", "created_at");

CREATE INDEX "lookup_user_hash_idx" ON "lookup"("user_hash");

ALTER TABLE "lookup" ADD CONSTRAINT "lookup_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

