import "server-only";
import { prisma } from "@/lib/prisma";

export type SearchResult = {
  id: string;
  slug: string;
  titleTa: string;
  titleEn: string | null;
  snippet: string; // ts_headline output with <mark> tags
  publishedAt: Date | null;
  rank: number;
};

/**
 * Full-text search over published lectures using the `searchVector` tsvector
 * column. We build a prefix tsquery so partial words match (good for live
 * search-as-you-type) and use ts_headline for highlighted snippets.
 *
 * Uses the 'simple' config to match the trigger in prisma/fts.sql (Tamil-safe).
 */
export async function searchLectures(
  query: string,
  limit = 8
): Promise<SearchResult[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];

  // Turn "tawheed iman" into "tawheed:* & iman:*" (prefix + AND).
  const tsquery = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[:&|!()'"\\]/g, "")) // strip tsquery operators
    .filter(Boolean)
    .map((t) => `${t}:*`)
    .join(" & ");

  if (!tsquery) return [];

  const rows = await prisma.$queryRaw<SearchResult[]>`
    SELECT
      "id",
      "slug",
      "titleTa",
      "titleEn",
      ts_headline(
        'simple',
        coalesce("summary", '') || ' ' || coalesce("contentText", ''),
        to_tsquery('simple', ${tsquery}),
        'StartSel=<mark>, StopSel=</mark>, MaxFragments=2, MaxWords=18, MinWords=6'
      ) AS "snippet",
      "publishedAt",
      ts_rank("searchVector", to_tsquery('simple', ${tsquery})) AS "rank"
    FROM "Lecture"
    WHERE "status" = 'PUBLISHED'
      AND "searchVector" @@ to_tsquery('simple', ${tsquery})
    ORDER BY "rank" DESC, "publishedAt" DESC NULLS LAST
    LIMIT ${limit};
  `;

  return rows;
}
