import { ArticleForm, type ArticleFormData } from "@/components/admin/article-form";

const empty: ArticleFormData = {
  titleTa: "",
  titleEn: "",
  slug: "",
  summary: "",
  content: "",
  coverImage: "",
  category: "",
  status: "DRAFT",
  featured: false,
};

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New article</h1>
      <ArticleForm initial={empty} />
    </div>
  );
}
