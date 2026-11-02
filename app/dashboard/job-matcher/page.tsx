"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight, Bookmark, BookmarkCheck, Check, CircleAlert, PenLine, RefreshCw, Scissors, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProcessingStages } from "@/components/analyzer/processing";
import { Bar, EmptyState, Field, NativeSelect, PageHeader, Panel, Pill } from "@/components/app/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SAMPLE_JOB } from "@/lib/data/seed";
import { matchJob } from "@/lib/services/matcher";
import { useResumeLimit } from "@/lib/limits";
import { hasTerm } from "@/lib/services/text";
import { useStore } from "@/lib/store";
import type { JobMatch } from "@/lib/types";
import { cn, scoreColor, sleep, timeAgo } from "@/lib/utils";

function band(score: number) {
  if (score >= 80) return "Strong match";
  if (score >= 65) return "Good match";
  if (score >= 45) return "Partial match";
  return "Low match";
}

function Chips({ items, tone, empty }: { items: string[]; tone: "success" | "warning" | "neutral" | "primary"; empty: string }) {
  return items.length ? (
    <div className="flex flex-wrap gap-1.5">
      {items.map((k) => (
        <Pill key={k} tone={tone}>
          {k}
        </Pill>
      ))}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">{empty}</p>
  );
}

function Results({ match, onRerun }: { match: JobMatch; onRerun: () => void }) {
  const router = useRouter();
  const resume = useStore((s) => s.resumes.find((r) => r.id === match.resumeId));
  const updateMatch = useStore((s) => s.updateMatch);
  const createResume = useStore((s) => s.createResume);
  const limit = useResumeLimit();

  const tailor = () => {
    if (!resume) return;
    if (limit.reached) {
      toast.error(`Your plan includes ${limit.limit} active ${limit.limit === 1 ? "resume" : "resumes"}`, { description: "Upgrade in Billing to keep tailored copies." });
      return;
    }
    const imp = match.keywords.important;
    // Reorder only: put the posting's required skills you already have first. Nothing is added.
    const skills = resume.content.skills.map((g) => ({
      ...g,
      skills: [...g.skills].sort((a, b) => Number(imp.some((k) => hasTerm(b, k))) - Number(imp.some((k) => hasTerm(a, k)))),
    }));
    const id = createResume({
      name: `${resume.name.split(",")[0]}, ${match.company || match.jobTitle}`,
      targetRole: match.jobTitle || resume.targetRole,
      content: { ...JSON.parse(JSON.stringify(resume.content)), skills },
      sectionOrder: resume.sectionOrder,
      templateId: resume.design.templateId,
      source: "tailored",
    });
    toast.success("Tailored copy created", { description: "Your original resume is unchanged. Start with the summary." });
    router.push(`/dashboard/resumes/${id}/edit?section=summary`);
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel bodyClassName="p-0">
        <div className="px-5 pt-5 pb-5">
          <div className="min-w-0">
            <p className="text-[13px] text-muted-foreground">
              {resume?.name ?? "Deleted resume"} compared with
            </p>
            <h2 className="mt-0.5 truncate text-xl font-semibold tracking-[-0.015em]">
              {match.jobTitle}
              {match.company && <span className="font-normal text-muted-foreground"> at {match.company}</span>}
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="tabular text-4xl font-semibold tracking-[-0.03em]" style={{ color: scoreColor(match.score) }}>
                {match.score}%
              </span>
              <span className="text-sm font-medium">{band(match.score)}</span>
            </div>
            <Bar value={match.score} className="mt-3 h-1.5 max-w-sm" />
            <p className="mt-2 text-xs text-muted-foreground">Required skills count double. A guide to tailoring, not a prediction of the hiring decision.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t px-5 py-3">
            <Button onClick={tailor} disabled={!resume}>
              <Scissors /> Tailor my resume
            </Button>
            <Link href={`/dashboard/resumes/${match.resumeId}/edit`} className={buttonVariants({ variant: "outline" })}>
              <PenLine /> Open resume editor
            </Link>
            <Button variant="outline" onClick={onRerun} disabled={!resume}>
              <RefreshCw /> Run analysis again
            </Button>
            <Button
              className="sm:ml-auto"
              variant={match.saved ? "secondary" : "outline"}
              onClick={() => {
                updateMatch(match.id, { saved: !match.saved });
                toast.success(match.saved ? "Removed from saved matches" : "Job match saved");
              }}
            >
              {match.saved ? <BookmarkCheck /> : <Bookmark />} {match.saved ? "Saved" : "Save job match"}
            </Button>
        </div>
      </Panel>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Panel title="Keyword breakdown" description="Terms from the posting and whether your resume shows them">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Matched ({match.keywords.matched.length})</h3>
              <Chips items={match.keywords.matched} tone="success" empty="No overlap yet." />
            </div>
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Missing ({match.keywords.missing.length})</h3>
              <Chips items={match.keywords.missing} tone="warning" empty="Your resume covers every term we found." />
            </div>
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Important skills (listed as required)</h3>
              <Chips items={match.keywords.important} tone="primary" empty="The posting does not single out required skills." />
            </div>
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Additional relevant terms</h3>
              <Chips items={match.keywords.additional} tone="neutral" empty="None found." />
            </div>
          </div>
        </Panel>
        <Panel title="Skills alignment">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Required skills found</h3>
              <Chips items={match.skills.found} tone="success" empty="None of the required skills appear yet." />
            </div>
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Required skills missing</h3>
              <Chips items={match.skills.missing} tone="warning" empty="You show every required skill." />
              {match.skills.missing.length > 0 && (
                <p className="mt-2 text-[13px] text-ink-2">Add one only if you have genuinely used it, ideally inside a bullet that shows where. Leave the rest out.</p>
              )}
            </div>
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Recommended to highlight</h3>
              <Chips items={match.skills.highlight} tone="primary" empty={match.skills.found.length ? "Your matching skills are already listed where recruiters look." : "Nothing to highlight until your resume shows some of the required skills."} />
              {match.skills.highlight.length > 0 && <p className="mt-2 text-[13px] text-ink-2">These appear in your experience but not in your skills list.</p>}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Panel title="Experience alignment">
          <h3 className="text-xs font-medium text-muted-foreground">Relevant experience</h3>
          {match.experience.relevant.length ? (
            <ul className="mt-1">
              {match.experience.relevant.map((r) => (
                <li key={r} className="flex gap-2.5 border-t py-2.5 text-sm first:border-t-0">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} />
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No bullets mention the posting’s terms yet.</p>
          )}
          <h3 className="mt-4 text-xs font-medium text-muted-foreground">Experience gaps</h3>
          {match.experience.gaps.length ? (
            <ul className="mt-1">
              {match.experience.gaps.map((g) => (
                <li key={g} className="flex gap-2.5 border-t py-2.5 text-sm first:border-t-0">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                  {g}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No clear gaps against the requirements.</p>
          )}
          <h3 className="mt-4 text-xs font-medium text-muted-foreground">Suggested improvements</h3>
          <ul className="mt-1">
            {match.experience.suggestions.map((s) => (
              <li key={s} className="border-t py-2.5 text-sm first:border-t-0">
                {s}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Optimization suggestions" bodyClassName="px-0 pb-2">
          <ul>
            {match.suggestions.map((s) => (
              <li key={s.title} className="border-t first:border-t-0">
                <Link href={`/dashboard/resumes/${match.resumeId}/edit?section=${s.section}`} className="group flex items-start justify-between gap-4 px-5 py-3.5 hover:bg-subtle">
                  <span>
                    <span className="block text-sm font-medium">{s.title}</span>
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">{s.detail}</span>
                  </span>
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

const STAGES = ["Reading the job description", "Extracting required skills", "Comparing with your resume"];

function Matcher() {
  const params = useSearchParams();
  const router = useRouter();
  const resumes = useStore((s) => s.resumes);
  const reports = useStore((s) => s.reports);
  const matches = useStore((s) => s.matches);
  // Default to the strongest analyzed resume, not whichever draft was created last.
  const best = [...reports].sort((a, b) => b.score - a.score).find((r) => resumes.some((x) => x.id === r.resumeId))?.resumeId ?? resumes[0]?.id ?? "";
  const addMatch = useStore((s) => s.addMatch);
  const deleteMatch = useStore((s) => s.deleteMatch);

  // The open match lives in the URL; the form starts from it when there is one.
  const activeId = params.get("match");
  const active = matches.find((m) => m.id === activeId);
  const [resumeId, setResumeId] = useState(active?.resumeId ?? params.get("resume") ?? best);
  const [title, setTitle] = useState(active?.jobTitle ?? "");
  const [company, setCompany] = useState(active?.company ?? "");
  const [jd, setJd] = useState(active?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState(-1);
  const setActiveId = (id: string | null) => router.replace(id ? `/dashboard/job-matcher?match=${id}` : "/dashboard/job-matcher", { scroll: false });
  const openMatch = (m: JobMatch) => {
    setResumeId(m.resumeId);
    setTitle(m.jobTitle);
    setCompany(m.company);
    setJd(m.description);
    setActiveId(m.id);
  };

  const run = async () => {
    const e: Record<string, string> = {};
    if (!resumeId) e.resume = "Choose a resume to compare.";
    if (!title.trim()) e.title = "Enter the job title.";
    if (jd.trim().split(/\s+/).length < 40) e.jd = "Paste the full job description, including responsibilities and requirements (at least 40 words).";
    setErrors(e);
    if (Object.keys(e).length) return;
    const resume = resumes.find((r) => r.id === resumeId)!;
    setStage(0);
    await sleep(500);
    setStage(1);
    await sleep(600);
    setStage(2);
    const m = matchJob(resume, title, company, jd);
    await sleep(500);
    addMatch(m);
    setActiveId(m.id);
    setStage(-1);
    requestAnimationFrame(() => document.getElementById("match-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  if (!resumes.length)
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Job Matcher" description="Compare a resume with a job description." />
        <div className="rounded-xl border bg-card">
          <EmptyState
            title="Add a resume first"
            description="Job matching compares one of your resumes with a posting."
            action={
              <Link href="/dashboard/analyzer/upload" className={buttonVariants()}>
                Upload resume
              </Link>
            }
          />
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Job Matcher" description="See how a resume lines up with a specific job, and what to change before you apply." />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel title="Job details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Resume" htmlFor="m-resume" error={errors.resume} className="sm:col-span-2">
              <NativeSelect id="m-resume" value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Job title" htmlFor="m-title" error={errors.title}>
              <Input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Frontend Engineer" aria-invalid={!!errors.title} />
            </Field>
            <Field label="Company" htmlFor="m-company" optional>
              <Input id="m-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Fieldnote" />
            </Field>
            <Field
              label="Job description"
              htmlFor="m-jd"
              error={errors.jd}
              className="sm:col-span-2"
              hint={
                <span className="flex flex-wrap justify-between gap-2">
                  <span>{jd.trim() ? jd.trim().split(/\s+/).length : 0} words</span>
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => {
                      setTitle(SAMPLE_JOB.jobTitle);
                      setCompany(SAMPLE_JOB.company);
                      setJd(SAMPLE_JOB.description);
                    }}
                  >
                    Use an example posting
                  </button>
                </span>
              }
            >
              <Textarea
                id="m-jd"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                aria-invalid={!!errors.jd}
                placeholder="Paste the complete job description: responsibilities, requirements and nice-to-haves."
                className="min-h-56 field-sizing-fixed"
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <Button size="lg" onClick={run} disabled={stage >= 0}>
              Analyze match
            </Button>
          </div>
        </Panel>

        <Panel title="Recent matches" bodyClassName="px-0 pb-2">
          {matches.length ? (
            <ul>
              {matches.slice(0, 8).map((m) => (
                <li key={m.id} className={cn("group flex items-center border-t first:border-t-0", m.id === activeId && "bg-secondary")}>
                  <button
                    type="button"
                    onClick={() => openMatch(m)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 py-2.5 pr-2 pl-5 text-left"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {m.saved && <BookmarkCheck className="size-3.5 shrink-0 text-primary" />}
                        <span className="truncate">{m.jobTitle}</span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {m.company || "No company"} · {timeAgo(m.createdAt)}
                      </span>
                    </span>
                    <span className="tabular text-sm font-semibold">{m.score}%</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="mr-3 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`Delete match for ${m.jobTitle}`}
                    onClick={() => {
                      deleteMatch(m.id);
                      if (activeId === m.id) setActiveId(null);
                      toast.success("Match deleted");
                    }}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 pb-3 text-sm text-muted-foreground">Your matches will appear here.</p>
          )}
        </Panel>
      </div>

      <div id="match-results" className="scroll-mt-20">
        {stage >= 0 ? (
          <div className="py-6">
            <ProcessingStages stages={STAGES} current={stage} title="Matching your resume" />
          </div>
        ) : active ? (
          <Results key={active.id} match={active} onRerun={run} />
        ) : null}
      </div>
    </div>
  );
}

export default function JobMatcherPage() {
  return (
    <Suspense>
      <Matcher />
    </Suspense>
  );
}
