"use client";

import * as React from "react";
import Image from "next/image";
import * as d3 from "d3";
import {
  ZoomIn,
  Maximize2,
  Crosshair,
  Loader2,
  LayoutGrid,
  Rows3,
  Columns3,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { MindMapNode } from "@/lib/mindmap";

// Branch palette (per main branch) — colourful like NotebookLM, readable on
// light and dark backgrounds.
const PALETTE = [
  "#2563eb",
  "#16a34a",
  "#db2777",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#dc2626",
];

type Orientation = "horizontal" | "vertical";

// d3.hierarchy node augmented with collapse state + layout coords.
type PNode = d3.HierarchyNode<MindMapNode> & {
  x: number;
  y: number;
  _children?: PNode[] | null;
};

function truncate(s: string, n = 30): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

/**
 * Custom D3 "tidy tree" mind map. Keeps the flowing NotebookLM aesthetic
 * (curved, colour-coded branches) while supporting BOTH a horizontal
 * (left→right) and vertical (top→down) layout. Nodes are collapsible; the
 * canvas supports pan + zoom (mouse and touch).
 */
function D3MindMap({
  data,
  orientation,
  className,
  expandDepth = 2,
}: {
  data: MindMapNode;
  orientation: Orientation;
  className?: string;
  expandDepth?: number;
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const rootRef = React.useRef<PNode | null>(null);
  const dataRef = React.useRef<MindMapNode | null>(null);
  const zoomRef = React.useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const drawRef = React.useRef<(fit?: boolean) => void>(() => {});
  const [loading, setLoading] = React.useState(true);

  // Keep a stable draw routine in a ref so resize/redraw and React effects share it.
  React.useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);

    let g = svg.select<SVGGElement>("g.mm-canvas");
    if (g.empty()) g = svg.append("g").classed("mm-canvas", true);

    if (!zoomRef.current) {
      zoomRef.current = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 3])
        .on("zoom", (e) => g.attr("transform", e.transform.toString()));
      svg.call(zoomRef.current);
    }

    const branchColor = (d: PNode): string => {
      if (d.depth === 0) return "currentColor";
      const branch = d.ancestors().reverse()[1] as PNode | undefined;
      const root = rootRef.current;
      const idx =
        branch && root?.children ? root.children.indexOf(branch) : 0;
      return PALETTE[(idx < 0 ? 0 : idx) % PALETTE.length];
    };

    const px = (d: PNode) => (orientation === "vertical" ? d.x : d.y);
    const py = (d: PNode) => (orientation === "vertical" ? d.y : d.x);

    const linkPath = (s: PNode, t: PNode): string => {
      const sx = px(s);
      const sy = py(s);
      const tx = px(t);
      const ty = py(t);
      return orientation === "vertical"
        ? `M${sx},${sy}C${sx},${(sy + ty) / 2} ${tx},${(sy + ty) / 2} ${tx},${ty}`
        : `M${sx},${sy}C${(sx + tx) / 2},${sy} ${(sx + tx) / 2},${ty} ${tx},${ty}`;
    };

    const draw = (fit = false) => {
      const root = rootRef.current;
      if (!root) return;

      const dx = orientation === "vertical" ? 165 : 26;
      const dy = orientation === "vertical" ? 110 : 220;
      d3.tree<MindMapNode>().nodeSize([dx, dy])(root);

      const nodes = root.descendants() as PNode[];
      const links = root.links() as { source: PNode; target: PNode }[];

      g.selectAll("*").remove();

      // Links
      g.append("g")
        .attr("fill", "none")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("d", (l) => linkPath(l.source, l.target))
        .attr("stroke", (l) => branchColor(l.target))
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 1.6);

      // Nodes
      const node = g
        .append("g")
        .selectAll<SVGGElement, PNode>("g")
        .data(nodes)
        .join("g")
        .attr("transform", (d) => `translate(${px(d)},${py(d)})`)
        .style("cursor", (d) =>
          d.children || d._children ? "pointer" : "default"
        )
        .on("click", (_e, d) => {
          if (d.children) {
            d._children = d.children;
            d.children = undefined;
          } else if (d._children) {
            d.children = d._children;
            d._children = undefined;
          } else {
            return;
          }
          draw(false);
        });

      node
        .append("circle")
        .attr("r", (d) => (d.depth === 0 ? 6 : d.children || d._children ? 5 : 3.5))
        .attr("fill", (d) =>
          d._children ? branchColor(d) : d.children ? "var(--mm-bg)" : branchColor(d)
        )
        .attr("stroke", (d) => branchColor(d))
        .attr("stroke-width", 2);

      node
        .append("text")
        .attr("paint-order", "stroke")
        .attr("stroke", "var(--mm-bg)")
        .attr("stroke-width", 4)
        .attr("fill", "var(--mm-fg)")
        .attr("font-size", (d) => (d.depth === 0 ? 15 : 13))
        .attr("font-weight", (d) => (d.depth <= 1 ? 600 : 400))
        .each(function (d) {
          const el = d3.select(this);
          const hasKids = !!(d.children || d._children);
          if (orientation === "vertical") {
            el.attr("text-anchor", "middle").attr("dy", hasKids ? "-0.9em" : "1.6em");
          } else {
            el.attr("text-anchor", hasKids ? "end" : "start")
              .attr("dy", "0.32em")
              .attr("x", hasKids ? -9 : 9);
          }
        })
        .text((d) => truncate(d.data.label));

      node.append("title").text((d) => d.data.label);

      if (fit) fitView();
      setLoading(false);
    };

    // Fit using the REAL rendered bounds (includes text labels), so nothing
    // clips off-screen regardless of orientation or label length.
    const fitView = () => {
      const gn = g.node() as SVGGElement | null;
      if (!gn || !zoomRef.current) return;
      let bbox: DOMRect;
      try {
        bbox = gn.getBBox();
      } catch {
        return;
      }
      if (!bbox.width || !bbox.height) return;
      const w = svgEl.clientWidth || 600;
      const h = svgEl.clientHeight || 400;
      const m = 28;
      const scale = Math.min(w / (bbox.width + m * 2), h / (bbox.height + m * 2), 1.2);
      const tx = w / 2 - (bbox.x + bbox.width / 2) * scale;
      const ty = h / 2 - (bbox.y + bbox.height / 2) * scale;
      svg
        .transition()
        .duration(300)
        .call(
          zoomRef.current.transform,
          d3.zoomIdentity.translate(tx, ty).scale(scale)
        );
    };

    drawRef.current = draw;

    // (Re)build the hierarchy only when the data changes; preserve collapse
    // state across orientation toggles.
    if (dataRef.current !== data || !rootRef.current) {
      const root = d3.hierarchy<MindMapNode>(data) as PNode;
      root.descendants().forEach((d) => {
        const n = d as PNode;
        if (n.depth >= expandDepth && n.children) {
          n._children = n.children as PNode[];
          n.children = undefined;
        }
      });
      rootRef.current = root;
      dataRef.current = data;
    }

    draw(true);

    const ro = new ResizeObserver(() => draw(true));
    ro.observe(svgEl);
    return () => ro.disconnect();
  }, [data, orientation, expandDepth]);

  return (
    <div className={`relative ${className ?? ""}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      <svg
        ref={svgRef}
        className="mm-svg h-full w-full"
        style={
          {
            "--mm-bg": "hsl(var(--background))",
            "--mm-fg": "hsl(var(--foreground))",
          } as React.CSSProperties
        }
      />
      <button
        type="button"
        onClick={() => drawRef.current(true)}
        className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border bg-background/90 px-3 py-1 text-xs font-medium shadow hover:bg-background"
        aria-label="Re-center mind map"
      >
        <Crosshair className="h-3.5 w-3.5" /> Re-center
      </button>
    </div>
  );
}

/** Orientation toggle (segmented control), persisted to localStorage. */
function OrientationToggle({
  value,
  onChange,
}: {
  value: Orientation;
  onChange: (o: Orientation) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border text-xs">
      <button
        type="button"
        onClick={() => onChange("horizontal")}
        className={`flex items-center gap-1 px-3 py-1 font-medium ${
          value === "horizontal" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
        }`}
        aria-pressed={value === "horizontal"}
      >
        <Columns3 className="h-3.5 w-3.5" /> கிடைமட்டம்
      </button>
      <button
        type="button"
        onClick={() => onChange("vertical")}
        className={`flex items-center gap-1 px-3 py-1 font-medium ${
          value === "vertical" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
        }`}
        aria-pressed={value === "vertical"}
      >
        <Rows3 className="h-3.5 w-3.5" /> செங்குத்து
      </button>
    </div>
  );
}

/**
 * Mind-map section for a lecture. Renders the interactive auto-generated graph
 * (with vertical/horizontal toggle + fullscreen) when `data` is present;
 * otherwise falls back to a manually uploaded image (`src`).
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
  const [orientation, setOrientation] = React.useState<Orientation>("horizontal");

  React.useEffect(() => {
    const saved = localStorage.getItem("mindmap-orientation");
    if (saved === "vertical" || saved === "horizontal") setOrientation(saved);
  }, []);

  const changeOrientation = React.useCallback((o: Orientation) => {
    setOrientation(o);
    localStorage.setItem("mindmap-orientation", o);
  }, []);

  if (data) {
    return (
      <section className="my-12">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-tamil text-xl font-bold">மனவரைபடம் (Mind Map)</h2>
          <div className="flex items-center gap-2">
            <OrientationToggle value={orientation} onChange={changeOrientation} />
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs font-medium shadow-sm hover:bg-muted">
                  <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
                </button>
              </DialogTrigger>
              <DialogContent className="h-[92vh] max-h-[92vh] w-[96vw] max-w-[96vw] p-2">
                <DialogTitle className="sr-only">{alt} mind map</DialogTitle>
                <D3MindMap
                  data={data}
                  orientation={orientation}
                  className="h-full w-full"
                  expandDepth={3}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border bg-muted/30">
          <D3MindMap
            data={data}
            orientation={orientation}
            className="h-[60vh] min-h-[360px] w-full sm:h-[460px]"
          />
        </div>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <LayoutGrid className="h-3 w-3" /> இழுத்து நகர்த்தவும் · கிளைகளைத் தட்டி
          சுருக்கலாம்/விரிக்கலாம் (drag to pan, tap branches to expand)
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
