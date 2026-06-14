-- ───────────────────────────────────────────────────────────────────────────
-- Full-text search setup for the Lecture table.
--
-- We use the 'simple' text search configuration on purpose. Postgres' language
-- configs (english, etc.) apply stemming + stop-word removal tuned for that
-- language; they do NOT understand Tamil. 'simple' just lowercases and splits
-- on Unicode word boundaries, which tokenizes Tamil words correctly and still
-- works fine for the English titles. Weights: title (A) > summary (B) > body (C).
--
-- Run this AFTER `prisma db push` / `prisma migrate` so the column + index that
-- Prisma manages already exist. It is idempotent. `npm run db:seed` also runs it.
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION lecture_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', coalesce(NEW."titleTa", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."titleEn", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."summary", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW."contentText", '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lecture_search_vector_trigger ON "Lecture";

CREATE TRIGGER lecture_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "titleTa", "titleEn", "summary", "contentText"
  ON "Lecture"
  FOR EACH ROW
  EXECUTE FUNCTION lecture_search_vector_update();

-- Backfill any existing rows.
UPDATE "Lecture" SET "contentText" = "contentText";
