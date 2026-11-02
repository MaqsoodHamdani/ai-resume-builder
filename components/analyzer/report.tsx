"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, CircleAlert, Expand, Info, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bar, BandLabel, Panel, Pill, ScoreRing } from "@/components/app/ui";
import { ScaledPaper } from "@/components/resume/scaled-paper";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AnalysisReport, Finding, Resume } from "@/lib/types";
import { cn, formatDate, pluralize } from "@/lib/utils";

const SEVERITY = { high: { tone: "destructive", label: "High priority" }, medium: { tone: "warning", label: "Medium priority" }, low: { tone: "neutral", label: "Low priority" } } as const;

function Delta({ now, before }: { now: number; before?: number }) {
  if (before == null) return null;
  const d = now - before;
  if (d === 0) return <span className="text-xs text-muted-foreground">no change</span>;
  return <span className={cn("tabular text-xs font-medium", d > 0 ? "text-success" : "text-destructive")}>{d > 0 ? `+${d}` : d}</span>;
}

function FindingCard({ f, resumeId, n }: { f: Finding; resumeId: string; n?: number }) {
  const sev = SEVERITY[f.severity];
  return (
    <article className="border-t px-5 py-5 first:border-t-0">
      <div className="flex flex-wrap items-center gap-2">
        {n != null && <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-semibold text-white">{n}</span>}
        <h3 className="text-[15px] font-semibold">{f.title}</h3>
        <Pill tone={sev.tone}>{sev.label}</Pill>
      </div>
      <p className="mt-2 text-sm text-ink-2">{f.explanation}</p>
      <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Why it matters</dt>
          <dd className="mt-0.5 text-ink-2">{f.why}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Suggested improvement</dt>
          <dd className="mt-0.5 text-ink-2">{f.suggestion}</dd>
        </div>
      </dl>
      {f.before && f.after && f.after !== f.before && (
        <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg bg-subtle p-3 text-[13px] sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Now</div>
            <p className="mt-0.5 text-ink-2">{f.before}</p>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Could read</div>
            <p className="mt-0.5">{f.after}</p>
          </div>
        </div>
      )}
      <Link
        href={`/dashboard/resumes/${resumeId}/edit?section=${f.section === "contact" ? "contact" : f.section}&finding=${f.id}`}
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "mt-4")}
      >
        Fix this <ArrowRight />
      </Link>
    </article>
  );
}

function CheckList({ items }: { items: { label: string; pass: boolean; detail: string }[] }) {
  return (
    <ul>
      {items.map((a) => (
        <li key={a.label} className="flex gap-3 border-t py-2.5 first:border-t-0">
          {a.pass ? <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} /> : <X className="mt-0.5 size-4 shrink-0 text-destructive" strokeWidth={2.5} />}
          <div className="min-w-0 text-sm">
            <div className="font-medium">{a.label}</div>
            <div className="text-muted-foreground [overflow-wrap:anywhere]">{a.detail}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Chips({ items, tone, empty }: { items: string[]; tone: "success" | "warning" | "neutral" | "primary"; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((k) => (
        <Pill key={k} tone={tone}>
          {k}
        </Pill>
      ))}
    </div>
  );
}

export function ReportView({ resume, report }: { resume: Resume; report: AnalysisReport }) {
  const prev = report.previous;
  const annotated = report.findings.filter((f) => f.before && f.section !== "contact");
  const marks = annotated.map((f, i) => ({ text: f.before!, n: i + 1 }));
  const numberOf = (f: Finding) => {
    const i = annotated.indexOf(f);
    return i >= 0 ? i + 1 : undefined;
  };
  const exp = report.experience;
  const [zoom, setZoom] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {prev && (
        <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-5 py-3 text-sm", report.score >= prev.score ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-[#fed7aa] bg-[#fff7ed]")}>
          <span className="font-medium">
            Score {report.score >= prev.score ? "up" : "down"} from {prev.score} to {report.score}
          </span>
          <span className="text-ink-2">
            compared with the analysis on {formatDate(prev.createdAt)}.{" "}
            {report.categories.filter((c) => prev.categories[c.key] != null && c.score > prev.categories[c.key]!).length} categories improved.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-1">
          <div className="flex items-center gap-5 lg:flex-col lg:items-start">
            <ScoreRing score={report.score} size={128} stroke={10} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {report.score}/100
                </span>
                <BandLabel score={report.score} />
              </div>
              {prev && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Previously {prev.score} <Delta now={report.score} before={prev.score} />
                </p>
              )}
              <p className="mt-3 flex gap-1.5 text-[13px] text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                This score is an internal guide to improving your resume. It does not predict how any employer’s applicant tracking system will rank you.
              </p>
            </div>
          </div>
        </Panel>
        <Panel title="Score breakdown" className="lg:col-span-2" description={`Scored for ${report.targetRole || "a general role"}`}>
          <ul className="flex flex-col gap-3.5">
            {report.categories.map((c) => (
              <li key={c.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[180px_minmax(0,1fr)_64px]">
                <span className="text-sm font-medium">{c.label}</span>
                <span className="flex items-center justify-end gap-2 sm:order-3">
                  <Delta now={c.score} before={prev?.categories[c.key]} />
                  <span className="tabular w-7 text-right text-sm font-semibold">{c.score}</span>
                </span>
                <div className="col-span-2 sm:order-2 sm:col-span-1">
                  <Bar value={c.score} />
                  <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Panel title="Strengths">
              {report.strengths.length ? (
                <ul className="flex flex-col gap-2.5">
                  {report.strengths.map((s) => (
                    <li key={s} className="flex gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Strengths will appear as the resume improves.</p>
              )}
            </Panel>
            <Panel title="Areas to improve">
              {report.findings.length ? (
                <ul className="flex flex-col gap-2.5">
                  {report.findings.slice(0, 6).map((f) => (
                    <li key={f.id} className="flex gap-2.5 text-sm">
                      <CircleAlert className={cn("mt-0.5 size-4 shrink-0", f.severity === "high" ? "text-destructive" : f.severity === "medium" ? "text-warning" : "text-muted-foreground")} />
                      {f.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing major to fix.</p>
              )}
            </Panel>
          </div>

          <Panel title={`Recommendations (${report.findings.length})`} description="Ranked by how much each fix should help." bodyClassName="px-0 pb-0">
            {report.findings.length ? (
              report.findings.map((f) => <FindingCard key={f.id} f={f} resumeId={resume.id} n={numberOf(f)} />)
            ) : (
              <p className="px-5 pb-5 text-sm text-muted-foreground">No recommendations. This resume covers the basics well.</p>
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Panel title="ATS compatibility" description="What tracking systems read first">
              <CheckList items={report.ats} />
            </Panel>
            <Panel title="Keyword analysis" description={`Terms common in ${report.targetRole || "your field"} roles`}>
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Found in your resume ({report.keywords.found.length})</h3>
                  <Chips items={report.keywords.found} tone="success" empty="None of the common terms appear yet." />
                </div>
                <div>
                  <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Missing ({report.keywords.missing.length})</h3>
                  <Chips items={report.keywords.missing} tone="warning" empty="Nothing missing." />
                </div>
                <div>
                  <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Repeated</h3>
                  {report.keywords.repeated.length ? (
                    <Chips items={report.keywords.repeated.map((r) => `${r.term} ×${r.count}`)} tone="neutral" empty="" />
                  ) : (
                    <p className="text-sm text-muted-foreground">No verb opens more than two bullets.</p>
                  )}
                </div>
                <div className="rounded-lg bg-subtle p-3 text-[13px] text-ink-2">
                  <span className="font-medium text-foreground">Recommended additions: </span>
                  {report.keywords.missing.length
                    ? `${report.keywords.missing.slice(0, 4).join(", ")}, but only where you have real experience with them.`
                    : "Your resume already covers the common terms."}
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Panel title="Experience analysis">
              <dl className="grid grid-cols-3 gap-3 border-b pb-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Bullets</dt>
                  <dd className="tabular text-xl font-semibold">{exp.bulletCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">With metrics</dt>
                  <dd className="tabular text-xl font-semibold">
                    {exp.withMetrics}
                    <span className="text-sm font-normal text-muted-foreground"> /{exp.bulletCount}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Strong verbs</dt>
                  <dd className="tabular text-xl font-semibold">
                    {exp.strongVerbs}
                    <span className="text-sm font-normal text-muted-foreground"> /{exp.bulletCount}</span>
                  </dd>
                </div>
              </dl>
              <h3 className="mt-4 text-xs font-medium text-muted-foreground">Bullets to strengthen</h3>
              {exp.weakBullets.length ? (
                <ul className="mt-1">
                  {exp.weakBullets.map((b) => (
                    <li key={b.text} className="border-t py-2.5 first:border-t-0">
                      <p className="text-sm">{b.text}</p>
                      <p className="mt-1 flex flex-wrap gap-1.5">
                        {b.reasons.map((r) => (
                          <Pill key={r} tone="neutral">
                            {r}
                          </Pill>
                        ))}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Every bullet opens with an action and shows a result.</p>
              )}
            </Panel>
            <Panel title="Education and certifications">
              <CheckList items={report.education} />
            </Panel>
          </div>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-20">
          <Panel
            title="Annotated resume"
            description={marks.length ? `${pluralize(marks.length, "line")} marked to match the recommendations` : "No lines need attention"}
            actions={
              <Tooltip>
                <TooltipTrigger render={<button type="button" onClick={() => setZoom(true)} aria-label="Open annotated resume full size" className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-subtle hover:text-foreground" />}>
                  <Expand className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Open full size</TooltipContent>
              </Tooltip>
            }
          >
            <button type="button" onClick={() => setZoom(true)} className="scroll-quiet block max-h-[70vh] w-full cursor-zoom-in overflow-y-auto rounded-md bg-[#eef2f7] p-3 text-left">
              <ScaledPaper content={resume.content} order={resume.sectionOrder} design={resume.design} marks={marks} />
            </button>
          </Panel>
          <Dialog open={zoom} onOpenChange={setZoom}>
            <DialogContent className="max-h-[92dvh] gap-0 overflow-hidden p-0 sm:max-w-[960px]">
              <DialogHeader className="border-b px-5 py-3.5">
                <DialogTitle>Annotated resume</DialogTitle>
                <DialogDescription>Highlighted lines are numbered to match the recommendations.</DialogDescription>
              </DialogHeader>
              <div className="scroll-quiet grid grid-cols-1 max-h-[calc(92dvh-80px)] gap-6 overflow-y-auto bg-[#eef2f7] p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_240px]">
                <ScaledPaper content={resume.content} order={resume.sectionOrder} design={resume.design} marks={marks} />
                <ol className="flex flex-col gap-3">
                  {annotated.map((f, i) => (
                    <li key={f.id} className="rounded-lg border bg-white p-3 text-[13px]">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-white">{i + 1}</span>
                        {f.title}
                      </div>
                      <p className="mt-1 text-muted-foreground">{f.suggestion}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </DialogContent>
          </Dialog>
        </aside>
      </div>
    </div>
  );
}
