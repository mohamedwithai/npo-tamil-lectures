import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LectureCard } from "@/components/lecture/lecture-card";
import { FeaturedLecture } from "@/components/lecture/featured-lecture";
import { Hero } from "@/components/layout/hero";
import { getLatestLectures, getFeaturedLecture } from "@/lib/queries";

// ISR: the homepage is statically generated and revalidated periodically so it
// stays cheap and fast while reflecting the ~3 new lectures published per week.
export const revalidate = 1800; // 30 minutes

export default async function HomePage() {
  // Resilient to a transient DB outage at build time: render an empty state and
  // let ISR revalidate once the database is reachable again.
  const [featured, latest] = await Promise.all([
    getFeaturedLecture().catch(() => null),
    getLatestLectures(9).catch(() => []),
  ]);

  // Avoid showing the featured lecture twice in the grid.
  const grid = latest.filter((l) => l.slug !== featured?.slug);

  return (
    <>
      <Hero />

      <div className="container space-y-16 py-12">
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
      </div>
    </>
  );
}
