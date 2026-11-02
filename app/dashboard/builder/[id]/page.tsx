"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, Download, Gauge, LayoutTemplate, Palette, PenLine } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/ui";
import { DesignControls } from "@/components/editor/design-controls";
import { TextField } from "@/components/editor/fields";
import {
  ContactEditor,
  EducationEditor,
  ExperienceEditor,
  SimpleEditor,
  SkillsEditor,
  SummaryEditor,
  type AiState,
} from "@/components/editor/sections";
import { ScaledPaper } from "@/components/resume/scaled-paper";
import { TemplateThumbEmpty } from "@/components/templates/thumb";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getTemplate, SECTION_META, TEMPLATES } from "@/lib/config";
import { printResume } from "@/lib/print";
import { skillsForRole } from "@/lib/services/text";
import { useResume, useStore } from "@/lib/store";
import type { Resume, ResumeContent, SectionKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "method", label: "Creation method" },
  { id: "personal", label: "Personal information" },
  { id: "summary", label: "Professional summary" },
  { id: "experience", label: "Work experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "additional", label: "Additional sections" },
  { id: "template", label: "Template" },
  { id: "preview", label: "Final preview" },
] as const;
type StepId = (typeof STEPS)[number]["id"];

const EXTRA: SectionKey[] = ["certifications", "projects", "languages", "awards", "volunteer"];
const STEP_INTRO: Partial<Record<StepId, string>> = {
  personal: "How recruiters will reach you. Name and email are required.",
  summary: "Two to four sentences that say what role you want and why you fit.",
  experience: "Most recent first. Lead each bullet with a verb and end with a result.",
  education: "Your highest qualification first. Add expected dates if you are still studying.",
  skills: "Group skills so they are quick to scan. Only list what you can talk about in an interview.",
  additional: "Turn on the sections that strengthen this resume.",
  template: "Every template uses the same content, so you can switch any time.",
  preview: "Review the finished resume, then download it or run an analysis.",
};

function Steps({ current, onGo, done }: { current: number; onGo: (i: number) => void; done: (i: number) => boolean }) {
  return (
    <ol className="flex flex-col gap-0.5" aria-label="Builder steps">
      {STEPS.map((s, i) => {
        const active = i === current;
        return (
          <li key={s.id}>
            <button
              type="button"
              disabled={i === 0}
              onClick={() => onGo(i)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors disabled:cursor-default",
                active ? "bg-secondary font-medium text-foreground" : "text-ink-2 hover:bg-subtle",
              )}
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border text-[11px]",
                  active ? "border-primary bg-primary text-white" : done(i) ? "border-primary text-primary" : "text-muted-foreground",
                )}
              >
                {done(i) && !active ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              {s.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Builder({ resume }: { resume: Resume }) {
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const updateResume = useStore((s) => s.updateResume);
  const runAnalysis = useStore((s) => s.runAnalysis);
  const plan = useStore((s) => s.user.plan);
  const [ai, setAi] = useState<AiState>(null);
  const [showErrors, setShowErrors] = useState(false);
  const stepId = (params.get("step") as StepId) ?? "personal";
  const index = Math.max(1, STEPS.findIndex((s) => s.id === stepId));
  const [dir, setDir] = useState(1);

  const c = resume.content;
  const update = (fn: (c: ResumeContent) => ResumeContent) => updateResume(resume.id, (r) => ({ content: fn(r.content) }));
  const personalOk = c.contact.fullName.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.contact.email);

  const go = (i: number) => {
    if (i > 1 && index === 1 && !personalOk) {
      setShowErrors(true);
      toast.error("Add your full name and a valid email to continue.");
      return;
    }
    setAi(null);
    setShowErrors(false);
    setDir(i > index ? 1 : -1);
    router.push(`/dashboard/builder/${resume.id}?step=${STEPS[i]!.id}`, { scroll: false });
    window.scrollTo({ top: 0 });
  };
  const done = (i: number) => {
    const id = STEPS[i]!.id;
    if (id === "method") return true;
    if (id === "personal") return personalOk;
    if (id === "summary") return !!c.summary.trim();
    if (id === "experience") return c.experience.length > 0;
    if (id === "education") return c.education.length > 0;
    if (id === "skills") return c.skills.some((g) => g.skills.length);
    return i < index;
  };
  const ensure = (k: SectionKey, on: boolean) =>
    updateResume(resume.id, (r) => ({ sectionOrder: on ? (r.sectionOrder.includes(k) ? r.sectionOrder : [...r.sectionOrder, k]) : r.sectionOrder.filter((x) => x !== k) }));

  const editorProps = { content: c, update, ai, setAi, targetRole: resume.targetRole };

  let body: React.ReactNode = null;
  switch (STEPS[index]!.id) {
    case "personal":
      body = (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-3 rounded-lg bg-subtle p-4 sm:grid-cols-2">
            <TextField id="b-name" label="Resume name" value={resume.name} onChange={(v) => updateResume(resume.id, { name: v })} placeholder="Product Manager 2026" />
            <TextField id="b-role" label="Target role" value={resume.targetRole} onChange={(v) => updateResume(resume.id, { targetRole: v })} placeholder="Product Manager" />
          </div>
          <ContactEditor content={c} update={update} />
          {showErrors && !personalOk && (
            <p className="text-sm text-destructive" role="alert">
              {!c.contact.fullName.trim() ? "Enter your full name. " : ""}
              {!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.contact.email) ? "Enter a valid email address." : ""}
            </p>
          )}
        </div>
      );
      break;
    case "summary":
      body = <SummaryEditor {...editorProps} />;
      break;
    case "experience":
      body = <ExperienceEditor {...editorProps} />;
      break;
    case "education":
      body = <EducationEditor content={c} update={update} />;
      break;
    case "skills":
      body = <SkillsEditor content={c} update={update} targetRole={resume.targetRole} suggestions={skillsForRole(resume.targetRole)} />;
      break;
    case "additional":
      body = (
        <div className="flex flex-col gap-4">
          {EXTRA.map((k) => {
            const on = resume.sectionOrder.includes(k);
            return (
              <div key={k} className="rounded-xl border">
                <label className="flex cursor-pointer items-start gap-3 p-4">
                  <Checkbox checked={on} onCheckedChange={(v) => ensure(k, !!v)} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-medium">{SECTION_META[k].label}</span>
                    <span className="block text-[13px] text-muted-foreground">{SECTION_META[k].hint}</span>
                  </span>
                </label>
                {on && (
                  <div className="border-t p-4">
                    {k === "volunteer" ? <ExperienceEditor {...editorProps} field="volunteer" /> : <SimpleEditor content={c} update={update} field={k as "certifications" | "projects" | "languages" | "awards"} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
      break;
    case "template":
      body = (
        <div role="radiogroup" aria-label="Template" className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {TEMPLATES.map((t) => {
            const locked = plan === "free" && !t.free;
            const on = resume.design.templateId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={locked}
                onClick={() => updateResume(resume.id, (r) => ({ design: { ...r.design, templateId: t.id, ...t.defaults } }))}
                className={cn("rounded-xl border bg-card p-2 text-left transition-[border-color,box-shadow] disabled:opacity-50", on ? "border-primary ring-3 ring-primary/15" : "hover:border-[#cbd5e1]")}
              >
                <div className="aspect-[8.5/11] overflow-hidden rounded-md bg-[#eef2f7] p-2">
                  <TemplateThumbEmpty templateId={t.id} />
                </div>
                <div className="flex items-center justify-between px-1 pt-2">
                  <span className="text-sm font-medium">{t.name}</span>
                  {on && <Check className="size-4 text-primary" />}
                </div>
                <div className="px-1 pb-1 text-xs text-muted-foreground">
                  {locked ? "Included in Pro" : `${t.category}${t.ats ? " · ATS-friendly" : ""}`}
                </div>
              </button>
            );
          })}
        </div>
      );
      break;
    case "preview":
      body = (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                <PenLine /> Edit section
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {STEPS.slice(1, 7).map((s) => (
                  <DropdownMenuItem key={s.id} onClick={() => go(STEPS.findIndex((x) => x.id === s.id))}>
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => go(7)}>
              <LayoutTemplate /> Change template
            </Button>
            <Popover>
              <PopoverTrigger render={<Button variant="outline" />}>
                <Palette /> Customize design
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4">
                <DesignControls design={resume.design} onChange={(d) => updateResume(resume.id, (r) => ({ design: { ...r.design, ...d } }))} />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              onClick={() => {
                runAnalysis(resume.id);
                router.push(`/dashboard/analyzer/${resume.id}`);
              }}
            >
              <Gauge /> Analyze resume
            </Button>
            <Button onClick={() => printResume(resume)}>
              <Download /> Download PDF
            </Button>
          </div>
          <div className="rounded-xl bg-[#e9edf3] p-4 sm:p-8">
            <div className="mx-auto max-w-[760px]">
              <ScaledPaper content={c} order={resume.sectionOrder} design={resume.design} showBreaks />
            </div>
          </div>
        </div>
      );
      break;
  }

  const isLast = index === STEPS.length - 1;
  const wide = STEPS[index]!.id === "template" || STEPS[index]!.id === "preview";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-muted-foreground">
            Step {index + 1} of {STEPS.length} · Saved automatically
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-[-0.02em]">{STEPS[index]!.label}</h1>
        </div>
        <Link href={`/dashboard/resumes/${resume.id}/edit`} className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}>
          Open in full editor
        </Link>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-[#e2e8f0] lg:hidden" aria-hidden>
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
      </div>

      <div className={cn("grid items-start gap-6", wide ? "lg:grid-cols-[220px_minmax(0,1fr)]" : "lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]")}>
        <nav className="hidden lg:block lg:sticky lg:top-20">
          <Steps current={index} onGo={go} done={done} />
        </nav>

        <div className="min-w-0 rounded-xl border bg-card p-5 sm:p-6">
          {STEP_INTRO[STEPS[index]!.id] && <p className="mb-5 text-[15px] text-muted-foreground">{STEP_INTRO[STEPS[index]!.id]}</p>}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -16 }}
              transition={{ type: "spring", bounce: 0, duration: 0.28 }}
            >
              {body}
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 flex items-center justify-between border-t pt-5">
            <Button variant="ghost" onClick={() => (index <= 1 ? router.push("/dashboard/builder") : go(index - 1))}>
              <ArrowLeft /> Back
            </Button>
            {isLast ? (
              <Link href={`/dashboard/resumes/${resume.id}`} className={buttonVariants()}>
                Finish
              </Link>
            ) : (
              <Button onClick={() => go(index + 1)}>{index === STEPS.length - 2 ? "Preview resume" : "Continue"}</Button>
            )}
          </div>
        </div>

        {!wide && (
          <aside className="hidden xl:sticky xl:top-20 xl:block">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Live preview</span>
              <span>{getTemplate(resume.design.templateId).name}</span>
            </div>
            <div className="max-h-[calc(100dvh-140px)] overflow-hidden rounded-lg bg-[#e9edf3] p-3">
              <ScaledPaper content={c} order={resume.sectionOrder} design={resume.design} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function BuilderRoute() {
  const { id } = useParams<{ id: string }>();
  const resume = useResume(id);
  if (!resume)
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState
          title="Draft not found"
          description="This draft may have been deleted."
          action={
            <Link href="/dashboard/builder" className={buttonVariants()}>
              Start a new resume
            </Link>
          }
        />
      </div>
    );
  return <Builder resume={resume} />;
}

export default function BuilderStepPage() {
  return (
    <Suspense>
      <BuilderRoute />
    </Suspense>
  );
}
