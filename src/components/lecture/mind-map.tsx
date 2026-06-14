"use client";

import * as React from "react";
import Image from "next/image";
import { ZoomIn, Maximize2, Crosshair, Loader2 } from "lucide-react";
import type { Markmap } from "markmap-view";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { MindMapNode } from "@/lib/mindmap";

// Branch palette (cycled by depth) — colourful like NotebookLM, readable on
// both light and dark backgrounds.
const PALETTE = [
  "#2563eb", // blue
  "#16a34a", // green
  "#db2777", // pink
  "#d97706", // amber
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#dc2626", // red
];

type PureNode = { content: string; children: PureNode[] };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toPureNode(n: MindMapNode): PureNode {
  return {
    content: escapeHtml(n.label),
    children: (n.children ?? []).map(toPureNode),
  };
}

/**
 * Interactive markmap graph. Loads markmap-view lazily in the browser (keeps it
 * out of SSR), renders into an <svg>, and supports pan + pinch/scroll zoom on
 * touch and desktop. Exposes a re-center control.
 */
function InteractiveMindMap({
  data,
  className,
  expandLevel = 2,
}: {
  data: MindMapNode;
  className?: string;
  expandLevel?: number;
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const mmRef = React.useRef<Markmap | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mm: Markmap | null = null;
    let disposed = false;
    let onResize: (() => void) | null = null;

    (async () => {
      const { Markmap } = await import("markmap-view");
      if (disposed || !svgRef.current) return;

      mm = Markmap.create(
        svgRef.current,
        {
          autoFit: true,
          pan: true,
          zoom: true,
          duration: 300,
          initialExpandLevel: expandLevel,
          maxWidth: 240,
          paddingX: 14,
          nodeMinHeight: 18,
          spacingHorizontal: 90,
          spacingVertical: 14,
          color: (node) => PALETTE[(node.state?.depth ?? 0) % PALETTE.length],
        },
        toPureNode(data) as never
      );
      mmRef.current = mm;
      setLoading(false);

      onResize = () => void mm?.fit();
      window.addEventListener("resize", onResize);
    })();

    return () => {
      disposed = true;
      if (onResize) window.removeEventListener("resize", onResize);
      mm?.destroy();
      mmRef.current = null;
    };
  }, [data, expandLevel]);

  return (
    <div className={`relative ${className ?? ""}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      <svg ref={svgRef} className="h-full w-full" />
      <button
        type="button"
        onClick={() => void mmRef.current?.fit()}
        className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border bg-background/90 px-3 py-1 text-xs font-medium shadow hover:bg-background"
        aria-label="Re-center mind map"
      >
        <Crosshair className="h-3.5 w-3.5" /> Re-center
      </button>
    </div>
  );
}

/**
 * Mind-map section for a lecture. Renders the interactive auto-generated graph
 * when `data` is present; otherwise falls back to a manually uploaded image
 * (`src`). Both offer a full-screen view for detail on mobile.
 */
export function MindMap({
  data,
  src,
  alt,
}: {
  data?: MindMapNode | null;
  src?: string | null;
  alt: string;
}) {
  if (data) {
    return (
      <section className="my-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-tamil text-xl font-bold">மனவரைபடம் (Mind Map)</h2>
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs font-medium shadow-sm hover:bg-muted">
                <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
              </button>
            </DialogTrigger>
            <DialogContent className="h-[92vh] max-h-[92vh] w-[96vw] max-w-[96vw] p-2">
              <DialogTitle className="sr-only">{alt} mind map</DialogTitle>
              <InteractiveMindMap data={data} className="h-full w-full" expandLevel={3} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="overflow-hidden rounded-xl border bg-muted/30">
          <InteractiveMindMap
            data={data}
            className="h-[60vh] min-h-[360px] w-full sm:h-[460px]"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          இழுத்து நகர்த்தவும் · சுருக்க/விரிக்க கிளைகளைத் தட்டவும் (drag to pan, tap
          branches to expand)
        </p>
      </section>
    );
  }

  if (src) {
    return (
      <section className="my-12">
        <h2 className="mb-3 font-tamil text-xl font-bold">மனவரைபடம் (Mind Map)</h2>
        <Dialog>
          <DialogTrigger asChild>
            <button className="group relative block w-full overflow-hidden rounded-xl border bg-muted">
              <Image
                src={src}
                alt={alt}
                width={1200}
                height={700}
                className="h-auto w-full object-contain"
              />
              <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-medium shadow">
                <ZoomIn className="h-3.5 w-3.5" /> Tap to zoom
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-h-[92vh] max-w-[96vw] overflow-auto p-2">
            <DialogTitle className="sr-only">{alt} mind map</DialogTitle>
            <div className="overflow-auto" style={{ touchAction: "pinch-zoom" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt} className="h-auto w-auto max-w-none" />
            </div>
          </DialogContent>
        </Dialog>
      </section>
    );
  }

  return null;
}
