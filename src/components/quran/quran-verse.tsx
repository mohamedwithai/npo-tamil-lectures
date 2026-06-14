import { BookMarked } from "lucide-react";

export type QuranVerseData = {
  surahName: string;
  surahNumber?: number | null;
  verseNumber: number;
  arabicText: string;
  tamilText: string;
};

/**
 * Reusable Quran verse block. Arabic is right-aligned in a larger serif face;
 * the Tamil translation sits below in clean typography. Server component — no
 * client JS needed.
 */
export function QuranVerse({ verse }: { verse: QuranVerseData }) {
  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-primary/20 bg-accent/40">
      <div className="flex items-center gap-2 border-b border-primary/15 bg-primary/10 px-5 py-2 text-xs font-medium text-primary">
        <BookMarked className="h-3.5 w-3.5" />
        <span>
          {verse.surahName}
          {verse.surahNumber ? ` (${verse.surahNumber})` : ""} : {verse.verseNumber}
        </span>
      </div>
      <div className="space-y-4 p-6">
        <p className="arabic-text text-right text-3xl text-foreground sm:text-4xl">
          {verse.arabicText}
        </p>
        <figcaption className="font-tamil text-base leading-relaxed text-muted-foreground">
          {verse.tamilText}
        </figcaption>
      </div>
    </figure>
  );
}

export function QuranVerseList({ verses }: { verses: QuranVerseData[] }) {
  if (!verses.length) return null;
  return (
    <section aria-label="Quran references" className="mt-12">
      <h2 className="mb-2 font-tamil text-xl font-bold">குர்ஆன் வசனங்கள்</h2>
      {verses.map((v, i) => (
        <QuranVerse key={i} verse={v} />
      ))}
    </section>
  );
}
