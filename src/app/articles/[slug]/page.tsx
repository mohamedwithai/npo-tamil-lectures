import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Calendar } from "lucide-react";
import { getArticleBySlug, getAllPublishedArticleSlugs } from "@/lib/queries";
import { getCategory } from "@/lib/categories";
import { formatDate } from "@/lib/utils";

export const revalidate = 1800;

export async function generateStaticParams() {
  const slugs = await getAllPublishedArticleSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article" };
  return { title: article.titleTa, description: article.summary };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const cat = getCategory(article.category);
  const color = cat?.color ?? "#4f46e5";

  return (
    <article className="container max-w-3xl py-10">
      {cat && (
        <Link
          href={`/topics/${cat.slug}`}
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          <span className="font-tamil">{cat.nameTa}</span>
        </Link>
      )}

      <h1 className="mt-4 font-tamil text-3xl font-bold leading-tight sm:text-4xl">
        {article.titleTa}
      </h1>
      {article.titleEn && (
        <p className="mt-1 text-sm font-medium text-muted-foreground">{article.titleEn}</p>
      )}

      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" /> {formatDate(article.publishedAt)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" /> {article.readTime} min read
        </span>
      </div>

      <p className="mt-5 font-tamil text-lg text-muted-foreground">{article.summary}</p>

      {article.coverImage && (
        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-xl border">
          <Image
            src={article.coverImage}
            alt={article.titleTa}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      <div
        className="prose-lecture mt-8"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
