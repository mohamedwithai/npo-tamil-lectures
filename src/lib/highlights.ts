import type { Highlight } from "@prisma/client";
import type { HighlightData } from "@/components/annotation/highlight-utils";

/** Project a Prisma Highlight to the serializable client shape (drops dates). */
export function toHighlightData(h: Highlight): HighlightData {
  return {
    id: h.id,
    quote: h.quote,
    prefix: h.prefix,
    suffix: h.suffix,
    startOffset: h.startOffset,
    endOffset: h.endOffset,
    color: h.color,
    note: h.note,
  };
}
