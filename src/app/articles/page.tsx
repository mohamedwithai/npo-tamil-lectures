import type { Metadata } from "next";
import { getPublishedArticles } from "@/lib/queries";
import { ArticleCard } from "@/components/lecture/article-card";

export const metadata: Metadata = {
  title: "கட்டுரைகள் | Articles",
  description: "Short written pieces on Islam, Fiqh, history and more.",
};

export const revalidate = 1800;

export default async function ArticlesPage() {
  const articles = await getPublishedArticles().catch(() => []);

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="font-tamil text-3xl font-bold">கட்டுரைகள்</h1>
        <p className="mt-1 text-muted-foreground">
          சிறு கட்டுரைகள் — Short written pieces beyond the lectures
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center font-tamil text-muted-foreground">
          கட்டுரைகள் விரைவில் வெளியிடப்படும்.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
