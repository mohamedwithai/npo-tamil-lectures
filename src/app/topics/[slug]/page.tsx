import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { getLecturesByCategory } from "@/lib/queries";
import { LectureCard } from "@/components/lecture/lecture-card";

export const revalidate = 1800;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getCategory(slug);
  return c
    ? { title: `${c.nameTa} | ${c.nameEn}`, description: c.descTa }
    : { title: "Topic" };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const lectures = await getLecturesByCategory(slug).catch(() => []);
  const Icon = category.icon;

  return (
    <div>
      <header className="border-b bg-accent/40">
        <div className="container py-10">
          <Link
            href="/topics"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> அனைத்துப் பிரிவுகள்
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: category.color }}
            >
              <Icon className="h-7 w-7" />
            </span>
            <div>
              <h1 className="font-tamil text-3xl font-bold leading-tight">
                {category.nameTa}
              </h1>
              <p className="font-tamil text-muted-foreground">
                {category.nameEn} · {category.descTa}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-10">
        {lectures.length === 0 ? (
          <p className="rounded-lg border border-dashed p-10 text-center font-tamil text-muted-foreground">
            இந்தப் பிரிவில் சொற்பொழிவுகள் விரைவில் சேர்க்கப்படும்.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lectures.map((lecture, i) => (
              <LectureCard key={lecture.slug} lecture={lecture} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
