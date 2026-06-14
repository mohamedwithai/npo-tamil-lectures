"use client";

import * as React from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Mind-map image. Shows a responsive thumbnail; tapping opens a full-screen,
 * scrollable/zoomable view. The dialog body allows native pinch-zoom on mobile
 * (touch-action: pinch-zoom) and pan via overflow scrolling.
 */
export function MindMap({ src, alt }: { src: string; alt: string }) {
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
          <div
            className="overflow-auto"
            style={{ touchAction: "pinch-zoom" }}
          >
            {/* Intrinsic-size image so users can scroll/zoom into detail. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="h-auto w-auto max-w-none" />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
