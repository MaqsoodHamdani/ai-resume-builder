"use client";

import { Check, Lock } from "lucide-react";
import { NativeSelect } from "@/components/app/ui";
import { Slider } from "@/components/ui/slider";
import { ACCENTS, FONTS, TEMPLATES } from "@/lib/config";
import type { Density, FontKey, Plan, ResumeDesign } from "@/lib/types";
import { cn } from "@/lib/utils";

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-secondary p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn("h-7 rounded-md px-2.5 text-[13px] transition-colors", value === o.id ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const DENSITY: { id: Density; label: string }[] = [
  { id: "compact", label: "Compact" },
  { id: "normal", label: "Normal" },
  { id: "relaxed", label: "Relaxed" },
];

export function DesignControls({ design, onChange }: { design: ResumeDesign; onChange: (d: Partial<ResumeDesign>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="d-font" className="text-[13px] font-medium">
          Font
        </label>
        <NativeSelect id="d-font" value={design.font} onChange={(e) => onChange({ font: e.target.value as FontKey })}>
          {Object.entries(FONTS).map(([k, f]) => (
            <option key={k} value={k}>
              {f.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between text-[13px]">
          <span className="font-medium" id="d-size">
            Font size
          </span>
          <span className="tabular text-muted-foreground">{(design.fontSize * 0.75).toFixed(1)} pt</span>
        </div>
        <Slider aria-labelledby="d-size" min={11} max={15} step={0.5} value={[design.fontSize]} onValueChange={(v) => onChange({ fontSize: Array.isArray(v) ? v[0]! : (v as number) })} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium">Accent color</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent color">
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={design.accent === c}
              aria-label={c}
              onClick={() => onChange({ accent: c })}
              className={cn("grid size-7 place-items-center rounded-full ring-offset-2 transition-shadow", design.accent === c && "ring-2 ring-foreground/70")}
              style={{ background: c }}
            >
              {design.accent === c && <Check className="size-3.5 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium">Spacing</span>
        <Segmented label="Spacing" value={design.spacing} options={DENSITY} onChange={(v) => onChange({ spacing: v })} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium">Margins</span>
        <Segmented
          label="Margins"
          value={design.margins}
          options={[
            { id: "compact", label: "Narrow" },
            { id: "normal", label: "Normal" },
            { id: "relaxed", label: "Wide" },
          ]}
          onChange={(v) => onChange({ margins: v })}
        />
      </div>
    </div>
  );
}

export function TemplateList({ value, onPick, plan }: { value: string; onPick: (id: string) => void; plan: Plan }) {
  return (
    <ul className="flex flex-col gap-1" role="listbox" aria-label="Templates">
      {TEMPLATES.map((t) => {
        const locked = plan === "free" && !t.free;
        return (
          <li key={t.id}>
            <button
              type="button"
              role="option"
              aria-selected={value === t.id}
              disabled={locked}
              onClick={() => onPick(t.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors disabled:opacity-60",
                value === t.id ? "bg-secondary" : "hover:bg-subtle",
              )}
            >
              <span className="size-3 shrink-0 rounded-full" style={{ background: t.defaults.accent }} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{t.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t.category}
                  {t.ats ? " · ATS-friendly" : ""}
                </span>
              </span>
              {locked ? <Lock className="size-3.5 text-muted-foreground" /> : value === t.id && <Check className="size-4 text-primary" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export { Segmented };
