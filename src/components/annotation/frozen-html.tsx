"use client";

import * as React from "react";

/**
 * Renders server-authored HTML and then hands the subtree to imperative DOM code
 * (the highlight engine). Memoised with `() => true` so React commits the markup
 * once and NEVER reconciles it again — our injected <mark> elements are therefore
 * safe from React (no wipes on re-render). SSR output is preserved.
 *
 * Because React won't update this node, callers must change `className` and
 * attach content click/selection handlers imperatively via the forwarded ref.
 */
export const FrozenHtml = React.memo(
  React.forwardRef<HTMLDivElement, { html: string; className?: string }>(
    function FrozenHtml({ html, className }, ref) {
      return (
        <div
          ref={ref}
          className={className}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
  ),
  () => true
);
