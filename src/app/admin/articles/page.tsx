import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminArticles } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { getCategory } from "@/lib/categories";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";

export default async function AdminArticlesPage() {
  const articles = await getAdminArticles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Button asChild>
          <Link href="/admin/articles/new">
            <Plus className="h-4 w-4" /> New article
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3">Updated</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No articles yet.
                </td>
              </tr>
            ) : (
              articles.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="font-tamil font-medium">{a.titleTa}</div>
                    <div className="text-xs text-muted-foreground">/{a.slug}</div>
                  </td>
                  <td className="p-3 font-tamil text-muted-foreground">
                    {getCategory(a.category)?.nameTa ?? "—"}
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        a.status === "PUBLISHED"
                          ? "success"
                          : a.status === "DRAFT"
                            ? "secondary"
                            : "muted"
                      }
                    >
                      {a.status}
                    </Badge>
                    {a.featured && (
                      <Badge variant="outline" className="ml-1">
                        Featured
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDate(a.updatedAt)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/articles/${a.id}/edit`}>Edit</Link>
                      </Button>
                      <DeleteEntityButton kind="article" id={a.id} title={a.titleTa} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
