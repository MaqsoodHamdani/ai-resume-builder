"use client";

import { Check, X } from "lucide-react";
import { Bar, Pill, ScoreRing } from "@/components/app/ui";
import { ScaledPaper } from "@/components/resume/scaled-paper";
import { designFor } from "@/lib/config";
import { createSeed, SAMPLE_JOB } from "@/lib/data/seed";
import { analyzeResume } from "@/lib/services/analyzer";
import { matchJob } from "@/lib/services/matcher";
import { rewrite } from "@/lib/services/writer";
import { cn, scoreBand } from "@/lib/utils";

// Sample workspace data, computed by the same services the app uses.
const seed = createSeed();
const draft = seed.resumes[2]!;
// Larger type and tight margins so the scaled page stays legible in the hero.
const heroDesign = { ...designFor("meridian"), fontSize: 17, margins: "compact" as const };
const draftReport = analyzeResume(draft);
const main = seed.resumes[0]!;
const job = matchJob(main, SAMPLE_JOB.jobTitle, SAMPLE_JOB.company, SAMPLE_JOB.description);

const notes = draftReport.findings.filter((f) => f.before).slice(0, 3);

/** Hero: the annotated page. */
export function HeroPreview() {
  const band = scoreBand(draftReport.score);
  return (
    <div data-ui className="relative">
      <div className="relative overflow-hidden rounded-2xl bg-[#eef2f7] px-5 pt-6 sm:px-8 sm:pt-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_200px]">
          <div className="h-[340px] overflow-hidden sm:h-[460px]">
            <ScaledPaper content={draft.content} order={draft.sectionOrder} design={heroDesign} marks={notes.map((n, i) => ({ text: n.before!, n: i + 1 }))} />
          </div>
          <ol className="hidden flex-col gap-3 pt-2 md:flex" aria-label="Margin notes">
            {notes.map((n, i) => (
              <li key={n.id} className="rounded-lg border bg-white p-3 text-[12.5px] leading-snug shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="grid size-[18px] place-items-center rounded-full bg-primary text-[10.5px] text-white">{i + 1}</span>
                  {n.title}
                </div>
                <p className="mt-1 text-muted-foreground">{n.suggestion.split(". ")[0]}.</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="absolute -bottom-6 left-4 flex w-[260px] items-center gap-4 rounded-xl border bg-white p-4 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.25)] sm:left-8">
        <ScoreRing score={draftReport.score} size={68} stroke={6} />
        <div className="min-w-0">
          <div className="text-sm font-semibold">{band.label}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{draftReport.findings.length} findings to review</div>
          <div className="mt-2 text-xs font-medium text-primary">Fix the top three</div>
        </div>
      </div>
    </div>
  );
}

export function CategoryPreview() {
  const rep = seed.reports[0]!;
  return (
    <div data-ui className="rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-4 border-b pb-4">
        <ScoreRing score={rep.score} size={64} stroke={6} />
        <div>
          <div className="text-sm font-semibold">{main.name}</div>
          <div className="text-xs text-muted-foreground">
            Up {rep.score - (rep.previous?.score ?? rep.score)} points since the original upload
          </div>
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {rep.categories.map((c) => (
          <li key={c.key} className="grid grid-cols-[1fr_120px_28px] items-center gap-3 text-[13px]">
            <span className="truncate">{c.label}</span>
            <Bar value={c.score} className="h-1.5" />
            <span className="tabular text-right font-medium">{c.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AtsPreview() {
  const rep = seed.reports[3]!;
  return (
    <div data-ui className="rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="text-sm font-semibold">ATS compatibility</div>
      <div className="text-xs text-muted-foreground">{seed.resumes[3]!.fileName}</div>
      <ul className="mt-3">
        {rep.ats.map((a) => (
          <li key={a.label} className="flex gap-3 border-t py-2.5 text-[13px] first:border-t-0">
            {a.pass ? <Check className="mt-0.5 size-4 shrink-0 text-success" /> : <X className="mt-0.5 size-4 shrink-0 text-destructive" />}
            <span className="min-w-0">
              <span className="font-medium">{a.label}</span>
              <span className="block truncate text-muted-foreground">{a.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RewritePreview() {
  const before = "Responsible for maintaining the CI pipeline and release process";
  const after = rewrite(before, "impact");
  return (
    <div data-ui className="rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Improve impact</div>
        <Pill tone="primary">Suggestion</Pill>
      </div>
      <div className="mt-4 text-xs font-medium text-muted-foreground">Original</div>
      <p className="mt-1 text-[13.5px] text-muted-foreground line-through decoration-[#cbd5e1]">{before}</p>
      <div className="mt-4 text-xs font-medium text-muted-foreground">Suggested</div>
      <p className="mt-1 rounded-md bg-brand-tint px-3 py-2 text-[13.5px]">{after}</p>
      <p className="mt-2 text-xs text-muted-foreground">Bracketed text marks a result only you can fill in.</p>
      <div className="mt-4 flex gap-2">
        <span className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-[13px] font-medium text-white">Accept</span>
        <span className="inline-flex h-8 items-center rounded-lg border border-input px-3 text-[13px] font-medium">Regenerate</span>
        <span className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-muted-foreground">Reject</span>
      </div>
    </div>
  );
}

export function MatchPreview() {
  return (
    <div data-ui className="rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{job.jobTitle}</div>
          <div className="text-xs text-muted-foreground">{job.company}</div>
        </div>
        <div className="tabular text-2xl font-semibold tracking-[-0.02em]">{job.score}%</div>
      </div>
      <Bar value={job.score} className="mt-3 h-1.5" />
      <div className="mt-4 text-xs font-medium text-muted-foreground">Matched keywords</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {job.keywords.matched.slice(0, 8).map((k) => (
          <Pill key={k} tone="success">
            {k}
          </Pill>
        ))}
      </div>
      <div className="mt-3 text-xs font-medium text-muted-foreground">Missing from your resume</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {job.keywords.missing.slice(0, 5).map((k) => (
          <Pill key={k} tone="warning">
            {k}
          </Pill>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Add a missing skill only if you have used it.</p>
    </div>
  );
}

export function TemplateThumb({ templateId, className }: { templateId: string; className?: string }) {
  const r = seed.resumes[0]!;
  return (
    <div className={cn("overflow-hidden rounded-md bg-white", className)}>
      <ScaledPaper content={r.content} order={r.sectionOrder} design={designFor(templateId)} />
    </div>
  );
}
