import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { getSuggestions } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { SuggestionActions } from "@/components/admin/suggestion-actions";

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-primary/15 text-primary",
  REVIEWED: "bg-green-500/15 text-green-600 dark:text-green-400",
  DISMISSED: "bg-muted text-muted-foreground",
};

export default async function AdminSuggestionsPage() {
  const suggestions = await getSuggestions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Correction suggestions</h1>
        <p className="text-sm text-muted-foreground">
          Reader-submitted corrections. Apply fixes in the lecture editor, then
          mark each as reviewed.
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
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${
                      STATUS_STYLES[s.status] ?? ""
                    }`}
                  >
                    {s.status}
                  </span>
                  <Link
                    href={`/lectures/${s.lecture.slug}`}
                    className="font-tamil font-medium text-foreground hover:underline"
                  >
                    {s.lecture.titleTa}
                  </Link>
                </div>
                <span>
                  {s.user?.name || s.user?.email || "Anonymous"} · {formatDate(s.createdAt)}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <p className="rounded-md bg-destructive/10 p-2 font-tamil text-sm line-through decoration-destructive/60">
                  {s.originalText}
                </p>
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                <p className="rounded-md bg-green-500/10 p-2 font-tamil text-sm">
                  {s.suggestedText}
                </p>
              </div>

              <div className="mt-3">
                <SuggestionActions id={s.id} status={s.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
