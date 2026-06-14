import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminLectures } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { DeleteLectureButton } from "@/components/admin/delete-lecture-button";

export default async function AdminLecturesPage() {
  const lectures = await getAdminLectures();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lectures</h1>
        <Button asChild>
          <Link href="/admin/lectures/new">
            <Plus className="h-4 w-4" /> New lecture
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Status</th>
              <th className="p-3">Views</th>
              <th className="p-3">Quiz</th>
              <th className="p-3">Updated</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lectures.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No lectures yet.
                </td>
              </tr>
            ) : (
              lectures.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="font-tamil font-medium">{l.titleTa}</div>
                    <div className="text-xs text-muted-foreground">/{l.slug}</div>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        l.status === "PUBLISHED"
                          ? "success"
                          : l.status === "DRAFT"
                            ? "secondary"
                            : "muted"
                      }
                    >
                      {l.status}
                    </Badge>
                    {l.featured && (
                      <Badge variant="outline" className="ml-1">
                        Featured
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">{l.views}</td>
                  <td className="p-3">{l.quiz ? "✓" : "—"}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(l.updatedAt)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/lectures/${l.id}/edit`}>Edit</Link>
                      </Button>
                      <DeleteLectureButton id={l.id} title={l.titleTa} />
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
