import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArticleForm, type ArticleFormData } from "@/components/admin/article-form";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) notFound();

  const initial: ArticleFormData = {
    id: article.id,
    titleTa: article.titleTa,
    titleEn: article.titleEn ?? "",
    slug: article.slug,
    summary: article.summary,
    content: article.content,
    coverImage: article.coverImage ?? "",
    category: article.category ?? "",
    status: article.status,
    featured: article.featured,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit article</h1>
      <ArticleForm initial={initial} />
    </div>
  );
}
