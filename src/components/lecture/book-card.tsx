import Image from "next/image";
import { BookOpen } from "lucide-react";
import { getCategory } from "@/lib/categories";

export type BookCardData = {
  id: string;
  title: string;
  titleEn: string | null;
  author: string | null;
  coverImage: string | null;
  pdfUrl: string | null;
  category: string | null;
  pages: number | null;
};

export function BookCard({ book }: { book: BookCardData }) {
  const cat = getCategory(book.category);
  const color = cat?.color ?? "#4f46e5";

  const card = (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[3/4] overflow-hidden">
        {book.coverImage ? (
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center p-4 text-center"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          >
            <span className="font-tamil text-sm font-bold leading-snug text-white">
              {book.title}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-tamil text-sm font-bold leading-snug">{book.title}</h3>
        {book.author && (
          <p className="font-tamil text-xs text-muted-foreground">{book.author}</p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          {book.pages ? <span>{book.pages} பக்கம்</span> : null}
          {book.pdfUrl && (
            <span className="ml-auto inline-flex items-center gap-1 font-medium text-primary">
              <BookOpen className="h-3.5 w-3.5" /> படிக்க
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return book.pdfUrl ? (
    <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
      {card}
    </a>
  ) : (
    card
  );
}
