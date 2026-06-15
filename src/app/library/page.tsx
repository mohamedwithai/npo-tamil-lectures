import type { Metadata } from "next";
import { getPublishedBooks } from "@/lib/queries";
import { BookCard } from "@/components/lecture/book-card";

export const metadata: Metadata = {
  title: "நூலகம் | Library",
  description: "Read and download Tamil Islamic books.",
};

export const revalidate = 1800;

export default async function LibraryPage() {
  const books = await getPublishedBooks().catch(() => []);

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="font-tamil text-3xl font-bold">நூலகம்</h1>
        <p className="mt-1 text-muted-foreground">
          படிக்கவும் பதிவிறக்கவும் — Read online or download as PDF
        </p>
      </header>

      {books.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center font-tamil text-muted-foreground">
          நூல்கள் விரைவில் சேர்க்கப்படும்.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}
