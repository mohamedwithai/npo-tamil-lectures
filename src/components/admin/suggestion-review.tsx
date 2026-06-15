"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Wand2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  applySuggestion,
  deleteSuggestion,
} from "@/server/actions/suggestions";

/**
 * Admin review controls for one suggestion. The corrected text is editable, so
 * the admin can tweak the reader's wording before accepting it.
 *  - "Apply to lecture" writes the change to the real content AND removes the
 *    suggestion (accepted & done).
 *  - "Delete" removes the suggestion without touching the lecture (reject).
 */
export function SuggestionReview({
  id,
  originalText,
  suggestedText,
}: {
  id: string;
  originalText: string;
  suggestedText: string;
}) {
  const router = useRouter();
  const [finalText, setFinalText] = React.useState(suggestedText);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function apply() {
    setPending(true);
    setError(null);
    const res = await applySuggestion(id, finalText.trim());
    if (res.ok) {
      router.refresh();
    } else {
      setPending(false);
      setError(res.error ?? "Could not apply the correction.");
    }
  }

  async function remove() {
    if (!window.confirm("Delete this suggestion?")) return;
    setPending(true);
    setError(null);
    await deleteSuggestion(id);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Original
          </p>
          <p className="rounded-md bg-destructive/10 p-2 font-tamil text-sm line-through decoration-destructive/60">
            {originalText}
          </p>
        </div>
        <ArrowRight className="hidden h-4 w-4 shrink-0 translate-y-7 text-muted-foreground sm:block" />
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Correction (editable)
          </p>
          <Textarea
            value={finalText}
            onChange={(e) => setFinalText(e.target.value)}
            rows={3}
            className="font-tamil"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button onClick={apply} disabled={pending || !finalText.trim()}>
          <Wand2 className="h-4 w-4" />
          {pending ? "Applying…" : "Apply to lecture"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={remove}
          disabled={pending}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>
    </div>
  );
}
