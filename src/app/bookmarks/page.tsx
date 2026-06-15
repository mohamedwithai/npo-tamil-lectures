import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { getUserBookmarks } from "@/lib/queries";
import { LectureCard } from "@/components/lecture/lecture-card";
import { ArticleCard } from "@/components/lecture/article-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Bookmarks" };

export default async function BookmarksPage() {
  const user = await requireUser("/bookmarks");
  const bookmarks = await getUserBookmarks(user.id);

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="font-tamil text-3xl font-bold">எனது புத்தகக்குறிகள்</h1>
        <p className="mt-1 text-muted-foreground">My Bookmarks — saved lectures & articles</p>
      </header>

      {bookmarks.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center font-tamil text-muted-foreground">
          இன்னும் எதையும் சேமிக்கவில்லை. ஒரு சொற்பொழிவு அல்லது கட்டுரையில்
          “Save” ஐ அழுத்தவும்.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((b) =>
            b.lecture ? (
              <LectureCard key={b.id} lecture={b.lecture} />
            ) : b.article ? (
              <ArticleCard key={b.id} article={b.article} />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
