import type { Metadata } from "next";
import { LectureCard } from "@/components/lecture/lecture-card";
import { getLatestLectures } from "@/lib/queries";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "All Lectures",
  description: "Browse every published Tamil lecture.",
};

export default async function LecturesPage() {
  const lectures = await getLatestLectures(60).catch(() => []);

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="font-tamil text-3xl font-bold">அனைத்து சொற்பொழிவுகள்</h1>
        <p className="mt-2 text-muted-foreground">{lectures.length} lectures published</p>
      </header>

      {lectures.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center font-tamil text-muted-foreground">
          சொற்பொழிவுகள் விரைவில் வெளியிடப்படும்.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lectures.map((lecture, i) => (
            <LectureCard key={lecture.slug} lecture={lecture} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
