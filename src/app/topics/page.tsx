import type { Metadata } from "next";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts } from "@/lib/queries";
import { CategoryCard } from "@/components/lecture/category-card";

export const metadata: Metadata = {
  title: "பிரிவுகள் | Topics",
  description: "Browse all Tamil Islamic content by topic.",
};

// ISR: counts change slowly; revalidate periodically.
export const revalidate = 1800;

export default async function TopicsPage() {
  const counts = await getCategoryCounts().catch(() => ({} as Record<string, number>));

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="font-tamil text-3xl font-bold">பிரிவுகள்</h1>
        <p className="mt-1 text-muted-foreground">
          தலைப்பு வாரியாக உலாவுங்கள் — Browse all content by topic
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <CategoryCard key={c.slug} category={c} count={counts[c.slug] ?? 0} />
        ))}
      </div>
    </div>
  );
}
