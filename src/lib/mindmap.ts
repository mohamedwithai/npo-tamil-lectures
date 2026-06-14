// ─────────────────────────────────────────────────────────────────────────────
// Mind-map model + heading-based generator.
//
// A mind map is a small hierarchical tree of short labels, rendered as an
// interactive NotebookLM-style graph (see components/lecture/mind-map.tsx).
// The PRIMARY generator is Gemini (see lib/gemini.ts); this module provides the
// shared type plus a deterministic, zero-cost FALLBACK that derives the tree
// from the lecture's heading structure (h1–h6) and key sentences. The fallback
// is used whenever Gemini is unavailable (no API key, quota, or error), so the
// feature always works.
// ─────────────────────────────────────────────────────────────────────────────

export type MindMapNode = {
  label: string;
  children?: MindMapNode[];
};

const MAX_LABEL = 80;
const MAX_LEAVES_PER_SECTION = 3;
const MAX_TOTAL_NODES = 60;

/** Collapse whitespace and trim a label to a sane length. */
function clean(text: string): string {
  const t = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > MAX_LABEL ? t.slice(0, MAX_LABEL - 1).trimEnd() + "…" : t;
}

/** First sentence (or clause) of a block of text, for use as a leaf label. */
function firstSentence(text: string): string {
  const t = clean(text);
  // Split on Tamil danda/full-stop/question/exclamation, keep the first chunk.
  const m = t.split(/(?<=[.!?。।])\s|(?<=…)\s/)[0] ?? t;
  return clean(m);
}

type Block = { tag: string; level: number; text: string };

/** Extract an ordered list of heading/paragraph/list blocks from Tiptap HTML. */
function extractBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const re = /<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    const text = clean(m[2]);
    if (!text) continue;
    const level = tag[0] === "h" ? Number(tag[1]) : 99; // p/li are "content"
    blocks.push({ tag, level, text });
  }
  return blocks;
}

/**
 * Build a mind-map tree from lecture HTML using its heading hierarchy.
 * Root = the lecture title; headings become branches by their level; the first
 * one or two key sentences under each heading become leaves.
 */
export function buildMindMapFromHtml(html: string, rootLabel: string): MindMapNode {
  const root: MindMapNode = { label: clean(rootLabel) || "Mind Map", children: [] };
  const blocks = extractBlocks(html);

  // Stack of open heading nodes with their levels. Root sits at level 0.
  const stack: { level: number; node: MindMapNode }[] = [{ level: 0, node: root }];
  let nodeCount = 1;
  let leavesInCurrent = 0;

  for (const b of blocks) {
    if (nodeCount >= MAX_TOTAL_NODES) break;

    if (b.level <= 6) {
      // Heading: pop until we find a strictly-shallower parent, then attach.
      while (stack.length > 1 && stack[stack.length - 1].level >= b.level) {
        stack.pop();
      }
      const parent = stack[stack.length - 1].node;
      const node: MindMapNode = { label: b.text, children: [] };
      (parent.children ??= []).push(node);
      stack.push({ level: b.level, node });
      nodeCount++;
      leavesInCurrent = 0;
    } else {
      // Content block: attach a key sentence as a leaf of the current heading.
      const current = stack[stack.length - 1].node;
      if (current === root && stack.length === 1) {
        // No heading seen yet: collect a few top-level key points directly.
        if (leavesInCurrent >= MAX_LEAVES_PER_SECTION + 2) continue;
      } else if (leavesInCurrent >= MAX_LEAVES_PER_SECTION) {
        continue;
      }
      const leaf = firstSentence(b.text);
      if (leaf.length < 4) continue;
      (current.children ??= []).push({ label: leaf });
      nodeCount++;
      leavesInCurrent++;
    }
  }

  pruneEmptyChildren(root);
  return root;
}

/** Remove empty `children: []` arrays so leaf nodes are clean. */
function pruneEmptyChildren(node: MindMapNode): void {
  if (node.children) {
    if (node.children.length === 0) {
      delete node.children;
    } else {
      node.children.forEach(pruneEmptyChildren);
    }
  }
}

/**
 * Validate and normalize an arbitrary parsed object into a MindMapNode tree
 * (used to sanitize Gemini output). Returns null if it isn't a usable tree.
 */
export function normalizeMindMap(input: unknown, depth = 0): MindMapNode | null {
  if (depth > 5 || input == null || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  const rawLabel =
    typeof obj.label === "string"
      ? obj.label
      : typeof obj.name === "string"
        ? obj.name
        : typeof obj.title === "string"
          ? obj.title
          : "";
  const label = clean(rawLabel);
  if (!label) return null;

  const rawChildren = Array.isArray(obj.children)
    ? obj.children
    : Array.isArray(obj.nodes)
      ? obj.nodes
      : [];
  const children = rawChildren
    .map((c) => normalizeMindMap(c, depth + 1))
    .filter((c): c is MindMapNode => c !== null)
    .slice(0, 8);

  return children.length ? { label, children } : { label };
}

/** Count nodes (used to decide whether a generated tree is worth showing). */
export function countNodes(node: MindMapNode): number {
  return 1 + (node.children?.reduce((n, c) => n + countNodes(c), 0) ?? 0);
}
