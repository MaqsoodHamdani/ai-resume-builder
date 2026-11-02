"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function L({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium">
      {children}
    </label>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  error?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <L htmlFor={id}>{label}</L>
      <Input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function AreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
  rows = 3,
  extra,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  extra?: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <L htmlFor={id}>{label}</L>
        {extra}
      </div>
      <Textarea id={id} value={value} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="min-h-0" />
    </div>
  );
}

/** Month picker using the native control. Value "YYYY-MM". */
export function MonthField({ id, label, value, onChange, disabled }: { id: string; label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <L htmlFor={id}>{label}</L>
      <Input id={id} type="month" value={/^\d{4}-\d{2}$/.test(value) ? value : ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </div>
  );
}

export function TagInput({ id, value, onChange, placeholder }: { id: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const items = draft
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !value.some((v) => v.toLowerCase() === s.toLowerCase()));
    if (items.length) onChange([...value, ...items]);
    setDraft("");
  };
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input px-1.5 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      {value.map((t) => (
        <span key={t} className="inline-flex h-6 items-center gap-1 rounded-md bg-secondary pr-1 pl-2 text-[13px]">
          {t}
          <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} className="grid size-4 place-items-center rounded text-muted-foreground hover:text-foreground" aria-label={`Remove ${t}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder={value.length ? "Add more" : placeholder}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
      />
    </div>
  );
}

export function MoveButtons({ onUp, onDown, onRemove, label }: { onUp?: () => void; onDown?: () => void; onRemove?: () => void; label: string }) {
  return (
    <div className="flex items-center">
      <Button type="button" variant="ghost" size="icon-xs" onClick={onUp} disabled={!onUp} aria-label={`Move ${label} up`}>
        <ArrowUp />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" onClick={onDown} disabled={!onDown} aria-label={`Move ${label} down`}>
        <ArrowDown />
      </Button>
      {onRemove && (
        <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove} aria-label={`Remove ${label}`} className="hover:text-destructive">
          <Trash2 />
        </Button>
      )}
    </div>
  );
}

/** A collapsible entry inside a section (one job, one degree). */
export function EntryCard({
  title,
  subtitle,
  open,
  onToggle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center gap-2 pr-2">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left">
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", !open && "-rotate-90")} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{title}</span>
            {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
          </span>
        </button>
        {actions}
      </div>
      {open && <div className="flex flex-col gap-3 border-t px-3 pt-3 pb-4">{children}</div>}
    </div>
  );
}

export function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}
