import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn, scoreBand, scoreColor } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("rounded-xl border bg-card", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 px-5 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className={cn("px-5 pt-3 pb-5", !title && !actions && "pt-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function ScoreRing({ score, size = 112, stroke = 8, label = true }: { score: number; size?: number; stroke?: number; label?: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center leading-none">
            <span className="tabular font-semibold tracking-[-0.03em]" style={{ fontSize: size * 0.3 }}>
              {score}
            </span>
            <span className="block pt-1 text-[11px] text-muted-foreground" style={{ fontSize: Math.max(11, size * 0.1) }}>
              of 100
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const TONES = {
  success: "bg-[#ecfdf3] text-[#166534]",
  primary: "bg-brand-tint text-[#1e40af]",
  warning: "bg-[#fff7ed] text-[#9a3412]",
  destructive: "bg-[#fef2f2] text-[#991b1b]",
  neutral: "bg-secondary text-ink-2",
};

export function Pill({ tone = "neutral", children, className }: { tone?: keyof typeof TONES; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-[22px] flex-none items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function ScorePill({ score }: { score: number | undefined }) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="tabular w-7 text-right font-medium">{score}</span>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-[#eef2f7]">
        <span className="block h-full rounded-full" style={{ width: `${score}%`, background: scoreColor(score) }} />
      </span>
    </span>
  );
}

export function BandLabel({ score }: { score: number }) {
  const b = scoreBand(score);
  return <Pill tone={b.tone}>{b.label}</Pill>;
}

export function Bar({ value, className, color }: { value: number; className?: string; color?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-[#eef2f7]", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color ?? scoreColor(value) }}
      />
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      {icon && <div className="mb-4 grid size-11 place-items-center rounded-full border bg-subtle text-muted-foreground [&_svg]:size-5">{icon}</div>}
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
  optional,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground">
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        {...props}
        className="h-9 w-full appearance-none rounded-lg border border-input bg-background pr-8 pl-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border bg-subtle px-1.5 font-sans text-[11px] text-muted-foreground">{children}</kbd>;
}
