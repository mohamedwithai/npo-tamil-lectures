import { prisma } from "@/lib/prisma";
import { QuranManager } from "@/components/admin/quran-manager";

export default async function AdminQuranPage() {
  const verses = await prisma.quranVerse.findMany({
    orderBy: [{ surahNumber: "asc" }, { verseNumber: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quran Verses</h1>
      <QuranManager verses={verses} />
    </div>
  );
}
