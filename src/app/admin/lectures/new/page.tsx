import { prisma } from "@/lib/prisma";
import { LectureForm, type LectureFormData } from "@/components/admin/lecture-form";

const empty: LectureFormData = {
  titleTa: "",
  titleEn: "",
  slug: "",
  summary: "",
  content: "",
  featuredImage: "",
  youtubeUrl: "",
  mindMapImage: "",
  category: "",
  status: "DRAFT",
  featured: false,
  verseIds: [],
};

export default async function NewLecturePage() {
  const verses = await prisma.quranVerse.findMany({
    orderBy: [{ surahNumber: "asc" }, { verseNumber: "asc" }],
    select: { id: true, surahName: true, verseNumber: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New lecture</h1>
      <LectureForm initial={empty} verses={verses} />
    </div>
  );
}
