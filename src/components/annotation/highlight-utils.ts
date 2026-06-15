// Pure DOM helpers for anchoring text highlights inside a content container.
// Offsets index into the container's textContent (the concatenation of all its
// text nodes, in document order), which a SHOW_TEXT TreeWalker visits in the
// same order — keeping create-time and render-time offsets consistent.

export const CONTEXT_LEN = 40;

export type HighlightData = {
  id: string;
  quote: string;
  prefix: string;
  suffix: string;
  startOffset: number;
  endOffset: number;
  color: string;
  note: string;
};

/** Char offset of a (node, offset) boundary within container.textContent. */
function offsetInContainer(container: Node, node: Node, nodeOffset: number): number {
  // If the boundary is inside an element (not a text node), sum the text length
  // of its children before nodeOffset.
  if (node.nodeType !== Node.TEXT_NODE) {
    let total = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    const boundary = node.childNodes[nodeOffset] ?? null;
    while ((n = walker.nextNode())) {
      if (boundary && (n === boundary || boundary.contains(n))) break;
      const pos = n.compareDocumentPosition(node);
      // Stop once we've walked past the boundary element.
      if (boundary && pos & Node.DOCUMENT_POSITION_CONTAINED_BY) break;
      total += n.textContent?.length ?? 0;
    }
    return total;
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let total = 0;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n === node) return total + nodeOffset;
    total += n.textContent?.length ?? 0;
  }
  return total;
}

export function getRangeOffsets(
  container: Node,
  range: Range
): { start: number; end: number } {
  const a = offsetInContainer(container, range.startContainer, range.startOffset);
  const b = offsetInContainer(container, range.endContainer, range.endOffset);
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

/** Build a DOM Range spanning [start, end) char offsets over the text nodes. */
export function rangeFromOffsets(
  container: Node,
  start: number,
  end: number
): Range | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let total = 0;
  let startNode: Text | null = null;
  let startNodeOffset = 0;
  let endNode: Text | null = null;
  let endNodeOffset = 0;
  let n: Node | null;

  while ((n = walker.nextNode())) {
    const len = n.textContent?.length ?? 0;
    if (!startNode && start <= total + len) {
      startNode = n as Text;
      startNodeOffset = start - total;
    }
    if (startNode && end <= total + len) {
      endNode = n as Text;
      endNodeOffset = end - total;
      break;
    }
    total += len;
  }

  if (!startNode || !endNode) return null;
  try {
    const range = document.createRange();
    range.setStart(startNode, startNodeOffset);
    range.setEnd(endNode, endNodeOffset);
    return range;
  } catch {
    return null;
  }
}

/** Resolve where a stored highlight currently sits in `text`, with fallbacks. */
export function findOffsets(
  text: string,
  h: HighlightData
): { start: number; end: number } | null {
  // 1. Trust the stored offsets if the text there still matches the quote.
  if (
    h.endOffset <= text.length &&
    text.slice(h.startOffset, h.endOffset) === h.quote
  ) {
    return { start: h.startOffset, end: h.endOffset };
  }
  // 2. Search by prefix + quote + suffix (most robust against edits).
  const ctx = h.prefix + h.quote + h.suffix;
  let idx = ctx ? text.indexOf(ctx) : -1;
  if (idx >= 0) {
    const s = idx + h.prefix.length;
    return { start: s, end: s + h.quote.length };
  }
  // 3. Search by the quote alone.
  idx = h.quote ? text.indexOf(h.quote) : -1;
  if (idx >= 0) return { start: idx, end: idx + h.quote.length };
  return null;
}

/** Wrap a range in <mark> elements (one per intersected text node). */
export function wrapRange(
  container: Node,
  range: Range,
  attrs: { id: string; color: string }
): void {
  const texts: Text[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (range.intersectsNode(n)) texts.push(n as Text);
  }

  for (const t of texts) {
    const len = t.textContent?.length ?? 0;
    const s = t === range.startContainer ? range.startOffset : 0;
    const e = t === range.endContainer ? range.endOffset : len;
    if (e <= s) continue;
    try {
      const sub = document.createRange();
      sub.setStart(t, s);
      sub.setEnd(t, e);
      const mark = document.createElement("mark");
      mark.className = `hl hl-${attrs.color}`;
      mark.dataset.hlId = attrs.id;
      sub.surroundContents(mark);
    } catch {
      // Skip nodes that can't be cleanly wrapped (e.g. partial element spans).
    }
  }
}
