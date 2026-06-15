"use client";

import * as React from "react";
import { Highlighter, StickyNote, Trash2 } from "lucide-react";
import {
  createHighlight,
  updateHighlight,
  deleteHighlight,
} from "@/server/actions/highlights";
import {
  CONTEXT_LEN,
  findOffsets,
  getRangeOffsets,
  rangeFromOffsets,
  recolorMark,
  unwrapMark,
  wrapRange,
  type HighlightData,
} from "./highlight-utils";

const COLORS = ["yellow", "green", "blue", "pink"] as const;

type Anchor = { quote: string; prefix: string; suffix: string; start: number; end: number };

/**
 * Adds text-selection highlighting + per-passage notes to a content container
 * referenced by `containerRef` (which must be a "frozen" element React never
 * reconciles). Highlights are applied incrementally — the live selection is
 * wrapped on create, a single mark is unwrapped on delete — so the DOM is never
 * reset and React never wipes the marks. Returns the floating UI to render.
 */
export function useHighlights({
  containerRef,
  target,
  contentId,
  enabled,
  initial,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  target: "lecture" | "article";
  contentId: string;
  enabled: boolean;
  initial: HighlightData[];
}): { overlay: React.ReactNode } {
  const [highlights, setHighlights] = React.useState<HighlightData[]>(initial);
  const [toolbar, setToolbar] = React.useState<{
    x: number;
    y: number;
    anchor: Anchor;
    range: Range;
  } | null>(null);
  const [editor, setEditor] = React.useState<{ id: string; x: number; y: number } | null>(null);
  const [draft, setDraft] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const highlightsRef = React.useRef(highlights);
  highlightsRef.current = highlights;
  const enabledRef = React.useRef(enabled);
  enabledRef.current = enabled;
  const appliedRef = React.useRef(false);

  // Apply the stored highlights to the DOM exactly once, after the container is
  // available. (No re-render reset — later changes are applied incrementally.)
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || appliedRef.current) return;
    appliedRef.current = true;
    const text = el.textContent ?? "";
    for (const h of initial) {
      const off = findOffsets(text, h);
      if (!off) continue;
      const range = rangeFromOffsets(el, off.start, off.end);
      if (range) wrapRange(el, range, { id: h.id, color: h.color });
    }
  }, [containerRef, initial]);

  // Selection → toolbar, and mark click → editor (only while enabled).
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMouseUp() {
      if (!enabledRef.current) return;
      const node = containerRef.current;
      const sel = window.getSelection();
      if (!node || !sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!node.contains(range.commonAncestorContainer)) return;
      const quote = range.toString();
      if (!quote.trim()) return;
      const { start, end } = getRangeOffsets(node, range);
      const text = node.textContent ?? "";
      const rect = range.getBoundingClientRect();
      setEditor(null);
      setToolbar({
        x: rect.left + rect.width / 2,
        y: Math.max(rect.top, 8),
        range: range.cloneRange(),
        anchor: {
          quote,
          prefix: text.slice(Math.max(0, start - CONTEXT_LEN), start),
          suffix: text.slice(end, end + CONTEXT_LEN),
          start,
          end,
        },
      });
    }

    function onClick(e: MouseEvent) {
      if (!enabledRef.current) return;
      const mark = (e.target as HTMLElement).closest("mark[data-hl-id]") as HTMLElement | null;
      if (!mark) return;
      e.stopPropagation();
      const id = mark.dataset.hlId!;
      const h = highlightsRef.current.find((x) => x.id === id);
      if (!h) return;
      const rect = mark.getBoundingClientRect();
      setToolbar(null);
      setDraft(h.note);
      setEditor({ id, x: rect.left, y: rect.bottom + 6 });
    }

    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("click", onClick);
    };
  }, [containerRef]);

  // Close popovers on outside click.
  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("[data-hl-ui]") || t.closest("mark[data-hl-id]")) return;
      setToolbar(null);
      setEditor(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function addHighlight(openNote: boolean) {
    if (!toolbar) return;
    const a = toolbar.anchor;
    const liveRange = toolbar.range;
    const pos = { x: toolbar.x, y: toolbar.y + 18 };
    setPending(true);
    const res = await createHighlight({
      target,
      id: contentId,
      quote: a.quote,
      prefix: a.prefix,
      suffix: a.suffix,
      startOffset: a.start,
      endOffset: a.end,
      color: "yellow",
      note: "",
    });
    setPending(false);
    setToolbar(null);

    if (res.ok && res.id) {
      const id = res.id;
      // Paint immediately by wrapping the captured selection range.
      const el = containerRef.current;
      if (el) {
        try {
          wrapRange(el, liveRange, { id, color: "yellow" });
        } catch {
          /* anchoring fallback happens on next reload */
        }
      }
      window.getSelection()?.removeAllRanges();
      const h: HighlightData = {
        id,
        quote: a.quote,
        prefix: a.prefix,
        suffix: a.suffix,
        startOffset: a.start,
        endOffset: a.end,
        color: "yellow",
        note: "",
      };
      setHighlights((hs) => [...hs, h]);
      if (openNote) {
        setDraft("");
        setEditor({ id, x: pos.x, y: pos.y });
      }
    } else {
      window.getSelection()?.removeAllRanges();
    }
  }

  async function saveNote() {
    if (!editor) return;
    const id = editor.id;
    setPending(true);
    const res = await updateHighlight({ id, note: draft });
    setPending(false);
    if (res.ok) {
      setHighlights((hs) => hs.map((h) => (h.id === id ? { ...h, note: draft } : h)));
      setEditor(null);
    }
  }

  async function changeColor(color: string) {
    if (!editor) return;
    const id = editor.id;
    const el = containerRef.current;
    if (el) recolorMark(el, id, color);
    setHighlights((hs) => hs.map((h) => (h.id === id ? { ...h, color } : h)));
    await updateHighlight({ id, color });
  }

  async function removeHighlight() {
    if (!editor) return;
    const id = editor.id;
    setPending(true);
    const res = await deleteHighlight(id);
    setPending(false);
    if (res.ok) {
      const el = containerRef.current;
      if (el) unwrapMark(el, id);
      setHighlights((hs) => hs.filter((h) => h.id !== id));
      setEditor(null);
    }
  }

  const overlay = (
    <>
      {toolbar && (
        <div
          data-hl-ui
          className="fixed z-50 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-lg border bg-popover p-1 shadow-lg"
          style={{ left: toolbar.x, top: toolbar.y - 6 }}
        >
          <button
            type="button"
            disabled={pending}
            onClick={() => addHighlight(false)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-accent"
          >
            <Highlighter className="h-3.5 w-3.5" /> Highlight
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => addHighlight(true)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-accent"
          >
            <StickyNote className="h-3.5 w-3.5" /> Note
          </button>
        </div>
      )}

      {editor && (
        <div
          data-hl-ui
          className="fixed z-50 w-72 rounded-lg border bg-popover p-3 shadow-xl"
          style={{
            left: Math.min(
              editor.x,
              (typeof window !== "undefined" ? window.innerWidth : 9999) - 300
            ),
            top: editor.y,
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a note for this passage…"
            rows={3}
            className="w-full resize-none rounded-md border bg-background p-2 text-sm font-tamil focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="mt-2 flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${c}`}
                onClick={() => changeColor(c)}
                className={`hl-swatch h-5 w-5 rounded-full border hl-${c}`}
              />
            ))}
            <button
              type="button"
              onClick={removeHighlight}
              disabled={pending}
              className="ml-auto rounded-md p-1.5 text-destructive hover:bg-destructive/10"
              aria-label="Delete highlight"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={saveNote}
              disabled={pending}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </>
  );

  return { overlay };
}
