"use client";

import { useEffect, useRef, useState } from "react";
import { MARGINS, PAGE } from "@/lib/config";
import { cn } from "@/lib/utils";
import { ResumeDocument, type DocProps } from "./document";

/**
 * Renders the Letter-size document scaled to its container's width, with page-break guides
 * where the printed pages will split.
 */
export function ScaledPaper({
  className,
  showBreaks = false,
  maxScale = 1,
  onPages,
  ...doc
}: DocProps & { className?: string; showBreaks?: boolean; maxScale?: number; onPages?: (n: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [height, setHeight] = useState(PAGE.height);

  useEffect(() => {
    const b = box.current;
    const p = paper.current;
    if (!b || !p) return;
    const ro = new ResizeObserver(() => {
      setScale(Math.min(maxScale, b.clientWidth / PAGE.width));
      setHeight(Math.max(PAGE.height, p.scrollHeight));
    });
    ro.observe(b);
    ro.observe(p);
    return () => ro.disconnect();
  }, [maxScale]);

  const margin = MARGINS[doc.design.margins];
  const perPage = PAGE.height - margin * 2;
  const pages = Math.max(1, Math.ceil((height - margin * 2) / perPage));
  useEffect(() => onPages?.(pages), [pages, onPages]);

  return (
    <div ref={box} className={cn("w-full", className)}>
      <div style={{ height: height * scale, width: PAGE.width * scale }} className="relative mx-auto">
        <div
          ref={paper}
          className="absolute top-0 left-0 origin-top-left shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_-6px_rgba(15,23,42,0.12)] ring-1 ring-black/5"
          style={{ transform: `scale(${scale})`, opacity: scale ? 1 : 0, transition: "opacity 150ms" }}
        >
          <ResumeDocument {...doc} />
          {showBreaks &&
            Array.from({ length: pages - 1 }, (_, i) => (
              <div
                key={i}
                aria-hidden
                className="pointer-events-none absolute inset-x-0 flex items-center"
                style={{ top: margin + perPage * (i + 1) }}
              >
                <div className="h-px flex-1 border-t border-dashed border-[#94a3b8]" />
                <span className="bg-white px-2 text-[11px] font-medium text-[#64748b]">Page {i + 2}</span>
                <div className="h-px w-6 border-t border-dashed border-[#94a3b8]" />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
