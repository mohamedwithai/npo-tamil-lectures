import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getCategory } from "@/lib/categories";

export type ArticleCardData = {
  slug: string;
  titleTa: string;
  titleEn: string | null;
  summary: string;
  coverImage: string | null;
  category: string | null;
  publishedAt: Date | string | null;
  readTime: number;
};

export function ArticleCard({ article }: { article: ArticleCardData }) {
  const cat = getCategory(article.category);
  const color = cat?.color ?? "#4f46e5";

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.titleTa}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: `linear-gradient(135deg, ${color}22, ${color}0a)` }}
          />
        )}
        <span className="absolute left-0 top-0 h-1 w-full" style={{ backgroundColor: color }} />
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-5">
        {cat && (
          <span
            className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            <span className="font-tamil">{cat.nameTa}</span>
          </span>
        )}
        <h3 className="font-tamil text-lg font-bold leading-snug group-hover:text-primary">
          {article.titleTa}
        </h3>
        <p className="line-clamp-2 font-tamil text-sm text-muted-foreground">
          {article.summary}
        </p>
        <div className="mt-auto flex items-center gap-3 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {formatDate(article.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {article.readTime} min
          </span>
        </div>
      </div>
    </Link>
  );
}
