import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminBooks } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { getCategory } from "@/lib/categories";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";

export default async function AdminBooksPage() {
  const books = await getAdminBooks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Library</h1>
        <Button asChild>
          <Link href="/admin/books/new">
            <Plus className="h-4 w-4" /> New book
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
            {books.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No books yet.
                </td>
              </tr>
            ) : (
              books.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="font-tamil font-medium">{b.title}</div>
                    {b.author && (
                      <div className="font-tamil text-xs text-muted-foreground">{b.author}</div>
                    )}
                  </td>
                  <td className="p-3 font-tamil text-muted-foreground">
                    {getCategory(b.category)?.nameTa ?? "—"}
                  </td>
                  <td className="p-3">
                    <Badge variant={b.published ? "success" : "secondary"}>
                      {b.published ? "Published" : "Hidden"}
                    </Badge>
                    {b.featured && (
                      <Badge variant="outline" className="ml-1">
                        Featured
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDate(b.updatedAt)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/books/${b.id}/edit`}>Edit</Link>
                      </Button>
                      <DeleteEntityButton kind="book" id={b.id} title={b.title} />
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
