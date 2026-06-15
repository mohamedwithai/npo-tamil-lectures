"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useHighlights } from "./use-highlights";
import { FrozenHtml } from "./frozen-html";
import type { HighlightData } from "./highlight-utils";

/** Renders article/content HTML with text-selection highlighting + notes. */
export function AnnotatableContent({
  html,
  target,
  contentId,
  isMember,
  highlights,
  className,
}: {
  html: string;
  target: "lecture" | "article";
  contentId: string;
  isMember: boolean;
  highlights: HighlightData[];
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { overlay } = useHighlights({
    containerRef: ref,
    target,
    contentId,
    enabled: isMember,
    initial: highlights,
  });

  return (
    <div className="relative">
      <FrozenHtml ref={ref} html={html} className={cn("prose-lecture", className)} />
      {overlay}
    </div>
  );
}
