import type { Metadata } from "next";
import Link from "next/link";
import { searchLectures } from "@/lib/search";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Search" };
export const dynamic = "force-dynamic"; // results depend on the query string

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await searchLectures(q.trim(), 30) : [];

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-tamil text-3xl font-bold">தேடல்</h1>

      <form action="/search" method="get" className="mt-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="தேடல் / Search lectures…"
          className="h-12 w-full rounded-lg border border-input bg-background px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          autoFocus
        />
      </form>

      <div className="mt-8 space-y-4">
        {q.trim() && results.length === 0 && (
          <p className="text-muted-foreground">
            No lectures matched “{q}”. Try a different word.
          </p>
        )}

        {results.map((r) => (
          <Link
            key={r.id}
            href={`/lectures/${r.slug}`}
            className="block rounded-xl border p-5 transition-colors hover:bg-accent/50"
          >
            <h2 className="font-tamil text-lg font-bold">{r.titleTa}</h2>
            {r.titleEn && (
              <p className="text-sm text-muted-foreground">{r.titleEn}</p>
            )}
            <p
              className="mt-1 text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: r.snippet }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {formatDate(r.publishedAt)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
