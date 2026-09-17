CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "item_colour" AS ENUM ('purple', 'orange', 'red', 'blue', 'green', 'yellow', 'white', 'pink', 'cyan');

CREATE TYPE "editor_role" AS ENUM ('admin', 'editor');

CREATE TABLE "item" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colour" "item_colour",
    "unsure" BOOLEAN NOT NULL DEFAULT false,
    "image_source_url" TEXT,
    "image_object_key" TEXT,
    "image_content_type" TEXT,
    "image_bytes" INTEGER,
    "last_editor_tag" TEXT,
    "valued_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "item_alias" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,

    CONSTRAINT "item_alias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "item_value" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "serial_min" INTEGER,
    "serial_max" INTEGER,
    "amount" INTEGER NOT NULL,
    "demand" INTEGER NOT NULL,
    "stability" INTEGER NOT NULL,
    "overpay" INTEGER NOT NULL,

    CONSTRAINT "item_value_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "item_revision" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "reason" TEXT,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_revision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "editor" (
    "id" TEXT NOT NULL,
    "discord_id" TEXT NOT NULL,
    "role" "editor_role" NOT NULL DEFAULT 'editor',
    "added_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by" TEXT,

    CONSTRAINT "editor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "item_slug_key" ON "item"("slug");

CREATE UNIQUE INDEX "item_name_key" ON "item"("name");

CREATE UNIQUE INDEX "item_image_object_key_key" ON "item"("image_object_key");

CREATE INDEX "item_alias_normalized_idx" ON "item_alias"("normalized");

CREATE UNIQUE INDEX "item_alias_item_id_normalized_key" ON "item_alias"("item_id", "normalized");

CREATE INDEX "item_value_item_id_serial_min_idx" ON "item_value"("item_id", "serial_min");

CREATE INDEX "item_revision_item_id_created_at_idx" ON "item_revision"("item_id", "created_at");

CREATE UNIQUE INDEX "editor_discord_id_key" ON "editor"("discord_id");

ALTER TABLE "item_alias" ADD CONSTRAINT "item_alias_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "item_value" ADD CONSTRAINT "item_value_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "item_revision" ADD CONSTRAINT "item_revision_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "item_value"
  ADD CONSTRAINT "item_value_serial_bounds_paired"
    CHECK (("serial_min" IS NULL) = ("serial_max" IS NULL)),
  ADD CONSTRAINT "item_value_serial_order"
    CHECK ("serial_min" IS NULL OR "serial_min" <= "serial_max"),
  ADD CONSTRAINT "item_value_amount_non_negative"
    CHECK ("amount" >= 0),
  ADD CONSTRAINT "item_value_demand_range"
    CHECK ("demand" BETWEEN 1 AND 5),
  ADD CONSTRAINT "item_value_stability_range"
    CHECK ("stability" BETWEEN 1 AND 5),
  ADD CONSTRAINT "item_value_overpay_range"
    CHECK ("overpay" BETWEEN 0 AND 5);

CREATE UNIQUE INDEX "item_value_single_unranged" ON "item_value" ("item_id")
  WHERE "serial_min" IS NULL;

CREATE FUNCTION "item_value_mode_guard"() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "item_value" v
    WHERE v."item_id" = NEW."item_id"
      AND v."id" <> NEW."id"
      AND (v."serial_min" IS NULL) <> (NEW."serial_min" IS NULL)
  ) THEN
    RAISE EXCEPTION 'item % mixes unranged and ranged values', NEW."item_id";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "item_value_mode_guard"
  AFTER INSERT OR UPDATE ON "item_value"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "item_value_mode_guard"();
