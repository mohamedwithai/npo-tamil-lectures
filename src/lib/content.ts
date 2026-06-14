import { htmlToText } from "@/lib/utils";

/**
 * Split lecture HTML into a free preview (~first 30% by text length) and the
 * gated remainder, WITHOUT breaking HTML tags. We split on top-level block
 * boundaries (closing </p>, </h2>, </ul>, etc.) and accumulate whole blocks
 * until ~30% of the total visible text has been included.
 *
 * Gating is enforced server-side: for guests the `rest` is never sent to the
 * browser, so it cannot be revealed via devtools.
 */
const BLOCK_CLOSE = /<\/(p|h[1-6]|ul|ol|blockquote|pre|figure|table)>/gi;

export function splitContentForGate(
  html: string,
  fraction = 0.3
): { preview: string; rest: string; hasMore: boolean } {
  const totalTextLen = htmlToText(html).length;
  if (totalTextLen === 0) return { preview: html, rest: "", hasMore: false };

  const target = Math.floor(totalTextLen * fraction);

  let splitIndex = -1;
  let acc = 0;
  let match: RegExpExecArray | null;
  BLOCK_CLOSE.lastIndex = 0;

  while ((match = BLOCK_CLOSE.exec(html)) !== null) {
    const end = match.index + match[0].length;
    acc = htmlToText(html.slice(0, end)).length;
    if (acc >= target) {
      splitIndex = end;
      break;
    }
  }

  // No clean block boundary found, or content is short: show everything.
  if (splitIndex === -1 || splitIndex >= html.length) {
    return { preview: html, rest: "", hasMore: false };
  }

  return {
    preview: html.slice(0, splitIndex),
    rest: html.slice(splitIndex),
    hasMore: true,
  };
}
