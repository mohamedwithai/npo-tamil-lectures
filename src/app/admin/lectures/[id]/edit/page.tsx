import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LectureForm, type LectureFormData } from "@/components/admin/lecture-form";

export default async function EditLecturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [lecture, verses] = await Promise.all([
    prisma.lecture.findUnique({
      where: { id },
      include: { verses: { select: { verseId: true } } },
    }),
    prisma.quranVerse.findMany({
      orderBy: [{ surahNumber: "asc" }, { verseNumber: "asc" }],
      select: { id: true, surahName: true, verseNumber: true },
    }),
  ]);

  if (!lecture) notFound();

  const initial: LectureFormData = {
    id: lecture.id,
    titleTa: lecture.titleTa,
    titleEn: lecture.titleEn ?? "",
    slug: lecture.slug,
    summary: lecture.summary,
    content: lecture.content,
    featuredImage: lecture.featuredImage ?? "",
    youtubeUrl: lecture.youtubeUrl ?? "",
    mindMapImage: lecture.mindMapImage ?? "",
    category: lecture.category ?? "",
    status: lecture.status,
    featured: lecture.featured,
    verseIds: lecture.verses.map((v) => v.verseId),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit lecture</h1>
      <LectureForm initial={initial} verses={verses} />
    </div>
  );
}
