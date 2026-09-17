CREATE OR REPLACE FUNCTION "item_value_mode_guard"() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;
