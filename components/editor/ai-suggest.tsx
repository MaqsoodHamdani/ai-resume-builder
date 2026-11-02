"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { explainRewrite, rewrite, REWRITE_MODES, type RewriteMode } from "@/lib/services/writer";
import { cn } from "@/lib/utils";

export type SuggestRequest = { mode: RewriteMode | "custom"; label: string; generate?: (variant: number) => string };

export function AiMenu({ onPick, disabled, label = "AI assist", extra = [] }: { onPick: (r: SuggestRequest) => void; disabled?: boolean; label?: string; extra?: SuggestRequest[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={<Button type="button" variant="ghost" size={label ? "xs" : "icon-xs"} aria-label={label ? undefined : "AI writing suggestions"} className="text-primary hover:text-primary" />}
      >
        <Wand2 />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {extra.map((e) => (
          <DropdownMenuItem key={e.label} onClick={() => onPick(e)}>
            {e.label}
          </DropdownMenuItem>
        ))}
        {REWRITE_MODES.map((m) => (
          <DropdownMenuItem key={m.id} onClick={() => onPick({ mode: m.id, label: m.label })}>
            {m.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Shows original and suggestion side by side. Nothing changes until the user accepts. */
export function SuggestionPanel({
  original,
  request,
  onAccept,
  onClose,
  initial,
}: {
  original: string;
  request: SuggestRequest;
  onAccept: (text: string) => void;
  onClose: () => void;
  initial?: string;
}) {
  const [variant, setVariant] = useState(0);
  const [loading, setLoading] = useState(!initial);
  const [text, setText] = useState(initial ?? "");

  useEffect(() => {
    if (variant === 0 && initial) return;
    const t = setTimeout(() => {
      setText(request.generate ? request.generate(variant) : rewrite(original, request.mode as RewriteMode, variant));
      setLoading(false);
    }, 450);
    return () => clearTimeout(t);
  }, [variant, original, request, initial]);

  const same = !loading && text.trim() === original.trim();

  return (
    <div className="rounded-lg border border-[#c7d7fe] bg-[#f7f9ff] p-3" role="region" aria-label={`${request.label} suggestion`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#1e40af]">{request.label}</span>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onClose} aria-label="Close suggestion">
          <X />
        </Button>
      </div>
      {original.trim() && (
        <div className="mt-1.5">
          <div className="text-[11px] font-medium text-muted-foreground">Original</div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{original}</p>
        </div>
      )}
      <div className="mt-2.5">
        <div className="text-[11px] font-medium text-muted-foreground">Suggested</div>
        {loading ? (
          <div className="mt-1 flex h-14 items-center gap-2 rounded-md bg-white px-3 text-[13px] text-muted-foreground ring-1 ring-[#dbe4fb]">
            <Loader2 className="size-3.5 animate-spin" /> Writing a suggestion
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Suggested text, editable"
            rows={Math.min(8, Math.max(2, Math.ceil(text.length / 70)))}
            className="mt-1 w-full resize-none rounded-md bg-white px-3 py-2 text-[13px] leading-relaxed ring-1 ring-[#dbe4fb] outline-none focus:ring-2 focus:ring-primary/40"
          />
        )}
      </div>
      {!loading && (
        <p className={cn("mt-1.5 text-[11.5px]", same ? "text-warning" : "text-muted-foreground")}>
          {same ? "This already reads well. Try another option or regenerate." : request.generate ? "Bracketed text marks details only you know. Replace it before sending." : explainRewrite(original, text).join(" · ")}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={loading || !text.trim()} onClick={() => onAccept(text.trim())}>
          <Check /> Accept
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => {
            setLoading(true);
            setVariant((v) => v + 1);
          }}>
          <RefreshCw /> Regenerate
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Reject
        </Button>
      </div>
    </div>
  );
}
