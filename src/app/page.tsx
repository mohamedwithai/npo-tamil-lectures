import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LectureCard } from "@/components/lecture/lecture-card";
import { FeaturedLecture } from "@/components/lecture/featured-lecture";
import { CategoryCard } from "@/components/lecture/category-card";
import { ArticleCard } from "@/components/lecture/article-card";
import { BookCard } from "@/components/lecture/book-card";
import { Hero } from "@/components/layout/hero";
import { CATEGORIES } from "@/lib/categories";
import {
  getLatestLectures,
  getFeaturedLecture,
  getCategoryCounts,
  getPublishedArticles,
  getPublishedBooks,
} from "@/lib/queries";

// ISR: the homepage is statically generated and revalidated periodically so it
// stays cheap and fast while reflecting the ~3 new lectures published per week.
export const revalidate = 1800; // 30 minutes

export default async function HomePage() {
  // Resilient to a transient DB outage at build time: render an empty state and
  // let ISR revalidate once the database is reachable again.
  const [featured, latest, counts, articles, books] = await Promise.all([
    getFeaturedLecture().catch(() => null),
    getLatestLectures(9).catch(() => []),
    getCategoryCounts().catch(() => ({} as Record<string, number>)),
    getPublishedArticles(3).catch(() => []),
    getPublishedBooks(4).catch(() => []),
  ]);

  // Avoid showing the featured lecture twice in the grid.
  const grid = latest.filter((l) => l.slug !== featured?.slug);

  return (
    <>
      <Hero />

      <div className="container space-y-16 py-12">
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-tamil text-2xl font-bold">பிரிவுகள்</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/topics">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => (
              <CategoryCard key={c.slug} category={c} count={counts[c.slug] ?? 0} />
            ))}
          </div>
        </section>

        {featured && (
          <section>
            <h2 className="mb-6 font-tamil text-2xl font-bold">சிறப்பு சொற்பொழிவு</h2>
            <FeaturedLecture lecture={featured} />
          </section>
        )}

        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-tamil text-2xl font-bold">சமீபத்திய சொற்பொழிவுகள்</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/lectures">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {grid.length === 0 ? (
            <p className="rounded-lg border border-dashed p-10 text-center font-tamil text-muted-foreground">
              சொற்பொழிவுகள் விரைவில் வெளியிடப்படும்.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((lecture, i) => (
                <LectureCard key={lecture.slug} lecture={lecture} index={i} />
              ))}
            </div>
          )}
        </section>

        {articles.length > 0 && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-tamil text-2xl font-bold">கட்டுரைகள்</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/articles">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        )}

        {books.length > 0 && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-tamil text-2xl font-bold">நூலகம்</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/library">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {books.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
