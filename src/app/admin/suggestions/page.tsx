import Link from "next/link";
import { Inbox } from "lucide-react";
import { getSuggestions } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { SuggestionReview } from "@/components/admin/suggestion-review";

export default async function AdminSuggestionsPage() {
  const suggestions = await getSuggestions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Correction suggestions</h1>
        <p className="text-sm text-muted-foreground">
          Reader-submitted corrections. Edit the wording if needed, then “Apply
          to lecture” to accept (updates the page and removes it), or Delete.
        </p>
      </div>

      {suggestions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <Inbox className="h-8 w-8" />
          <p>No suggestions yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {suggestions.map((s) => (
            <li key={s.id} className="rounded-xl border p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <Link
                  href={`/lectures/${s.lecture.slug}`}
                  className="font-tamil font-medium text-foreground hover:underline"
                >
                  {s.lecture.titleTa}
                </Link>
                <span>
                  {s.user?.name || s.user?.email || "Anonymous"} · {formatDate(s.createdAt)}
                </span>
              </div>

              <SuggestionReview
                id={s.id}
                originalText={s.originalText}
                suggestedText={s.suggestedText}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
