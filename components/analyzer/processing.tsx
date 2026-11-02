"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProcessingStages({ stages, current, title, error }: { stages: string[]; current: number; title: string; error?: string }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border bg-card p-6" role="status" aria-live="polite">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <ol className="mt-5 flex flex-col gap-3.5">
        {stages.map((s, i) => {
          const done = i < current;
          const active = i === current && !error;
          const failed = i === current && !!error;
          return (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-xs transition-colors duration-300",
                  done && "border-primary bg-primary text-white",
                  active && "border-primary text-primary",
                  failed && "border-destructive text-destructive",
                  !done && !active && !failed && "text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : active ? <Loader2 className="size-3.5 animate-spin" /> : failed ? "!" : i + 1}
              </span>
              <span className={cn(done || active ? "text-foreground" : "text-muted-foreground", active && "font-medium")}>{s}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-6 h-1 overflow-hidden rounded-full bg-[#eef2f7]">
        <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${(Math.min(current, stages.length) / stages.length) * 100}%` }} />
      </div>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
  );
}
