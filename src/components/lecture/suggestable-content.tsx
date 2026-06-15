"use client";

import * as React from "react";
import { Pencil, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createSuggestion } from "@/server/actions/suggestions";
import { cn } from "@/lib/utils";
import { useHighlights } from "@/components/annotation/use-highlights";
import type { HighlightData } from "@/components/annotation/highlight-utils";

const BLOCK_SELECTOR = "p,li,h1,h2,h3,h4,h5,h6,blockquote";

/**
 * Renders the lecture body and (for members) lets a reader propose a correction:
 * toggle "suggest" mode, click a paragraph to edit its text, submit, and get a
 * thank-you confirmation. The suggestion is sent to the admin inbox.
 */
export function SuggestableContent({
  html,
  lectureId,
  canSuggest,
  highlights = [],
}: {
  html: string;
  lectureId: string;
  canSuggest: boolean;
  highlights?: HighlightData[];
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(false);
  const [original, setOriginal] = React.useState<string | null>(null);
  const [suggested, setSuggested] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [thanks, setThanks] = React.useState(false);

  // Selection-highlighting + notes, suppressed while "suggest a correction"
  // mode is active to avoid conflicting click/selection behaviour.
  const { overlay } = useHighlights({
    containerRef: ref,
    target: "lecture",
    contentId: lectureId,
    enabled: canSuggest && !active,
    initial: highlights,
  });

  const onContentClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!active) return;
      const el = (e.target as HTMLElement).closest(BLOCK_SELECTOR);
      if (!el || !ref.current?.contains(el)) return;
      const text = (el.textContent ?? "").trim();
      if (!text) return;
      setError(null);
      setOriginal(text);
      setSuggested(text);
    },
    [active]
  );

  async function submit() {
    if (original == null) return;
    setSubmitting(true);
    setError(null);
    const res = await createSuggestion({
      lectureId,
      originalText: original,
      suggestedText: suggested.trim(),
    });
    setSubmitting(false);
    if (res.ok) {
      setOriginal(null);
      setActive(false);
      // Defer so the editor dialog fully closes before the thank-you opens
      // (avoids a Radix focus-scope conflict between two simultaneous dialogs).
      setTimeout(() => setThanks(true), 180);
    } else {
      setError(res.error ?? "Could not submit your suggestion.");
    }
  }

  return (
    <>
      {canSuggest && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {active ? (
              <span className="font-tamil">
                சரிசெய்ய வேண்டிய பத்தியைத் தட்டுங்கள் (tap a paragraph to edit)
              </span>
            ) : (
              <span className="font-tamil">தவறு கண்டீர்களா? திருத்தம் பரிந்துரைக்கலாம்</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setActive((a) => !a)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              active
                ? "bg-muted text-foreground hover:bg-muted/70"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {active ? (
              <>
                <X className="h-3.5 w-3.5" /> ரத்து
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5" /> திருத்தம் பரிந்துரை
              </>
            )}
          </button>
        </div>
      )}

      <div
        ref={ref}
        onClick={onContentClick}
        className={cn("prose-lecture", active && "suggest-active")}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {overlay}

      {/* Editor dialog */}
      <Dialog open={original != null} onOpenChange={(o) => !o && setOriginal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-tamil">திருத்தம் பரிந்துரைக்கவும்</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Original
              </p>
              <p className="rounded-md bg-muted/50 p-2 font-tamil text-sm">
                {original}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Your correction
              </p>
              <Textarea
                value={suggested}
                onChange={(e) => setSuggested(e.target.value)}
                rows={4}
                className="font-tamil"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOriginal(null)} disabled={submitting}>
              ரத்து
            </Button>
            <Button onClick={submit} disabled={submitting || !suggested.trim()}>
              {submitting ? "அனுப்புகிறது…" : "அனுப்பு (Send)"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thank-you dialog */}
      <Dialog open={thanks} onOpenChange={setThanks}>
        <DialogContent>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <DialogTitle className="font-tamil text-lg">
              உங்கள் மதிப்புமிக்க கருத்துக்கு நன்றி!
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Thank you for your valuable feedback. Our team will review it.
            </p>
            <Button className="mt-2" onClick={() => setThanks(false)}>
              சரி (OK)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
