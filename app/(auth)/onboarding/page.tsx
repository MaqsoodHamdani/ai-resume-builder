"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, FilePlus2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAREER_STAGES, INDUSTRIES } from "@/lib/config";
import { useHydrated, useStore } from "@/lib/store";
import type { CareerStage } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_SUGGESTIONS = ["Software Engineer", "Product Manager", "Data Analyst", "Product Designer", "Marketing Manager", "Account Executive", "Financial Analyst", "Nurse"];

function Choice({ selected, onClick, title, hint }: { selected: boolean; onClick: () => void; title: string; hint?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex w-full flex-col rounded-lg border bg-card px-4 py-3 text-left transition-[border-color,box-shadow] active:scale-[0.99]",
        selected ? "border-primary ring-3 ring-primary/15" : "hover:border-[#cbd5e1]",
      )}
    >
      <span className="text-sm font-medium">{title}</span>
      {hint && <span className="mt-0.5 text-[13px] text-muted-foreground">{hint}</span>}
    </button>
  );
}

export default function OnboardingPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [stage, setStage] = useState<CareerStage | null>(null);
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");

  const finish = (path: string) => {
    updateUser({ onboarded: true, careerStage: stage ?? user.careerStage, targetRole: role.trim() || user.targetRole, industry: industry || user.industry });
    router.push(path);
  };
  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const steps = [
    {
      title: "What is your current career stage?",
      hint: "We use this to set expectations for length and which sections to lead with.",
      body: (
        <div role="radiogroup" aria-label="Career stage" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CAREER_STAGES.map((c) => (
            <Choice key={c.id} selected={stage === c.id} onClick={() => setStage(c.id)} title={c.label} hint={c.hint} />
          ))}
        </div>
      ),
      ready: !!stage,
    },
    {
      title: "What type of job are you targeting?",
      hint: "Your analysis checks for the skills this role usually asks for. You can change it per resume.",
      body: (
        <div>
          <label htmlFor="role" className="sr-only">
            Target job title
          </label>
          <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="For example, Senior Frontend Engineer" autoFocus />
          <div className="mt-3 flex flex-wrap gap-2">
            {ROLE_SUGGESTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn("rounded-full border px-3 py-1 text-[13px] transition-colors", role === r ? "border-primary bg-brand-tint text-[#1e40af]" : "hover:bg-subtle")}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      ),
      ready: role.trim().length > 1,
    },
    {
      title: "Which industry interests you?",
      hint: "Pick the closest match.",
      body: (
        <div role="radiogroup" aria-label="Industry" className="grid grid-cols-2 gap-2">
          {INDUSTRIES.map((i) => (
            <Choice key={i} selected={industry === i} onClick={() => setIndustry(i)} title={i} />
          ))}
        </div>
      ),
      ready: !!industry,
    },
    {
      title: "Do you already have a resume?",
      hint: "Either way, you can do the other later.",
      body: (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => finish("/dashboard/analyzer/upload")}
            className="flex flex-col items-start rounded-xl border bg-card p-5 text-left transition-[border-color] hover:border-primary active:scale-[0.99]"
          >
            <FileUp className="size-5 text-primary" strokeWidth={1.75} />
            <span className="mt-3 text-[15px] font-semibold">Yes, upload it</span>
            <span className="mt-1 text-[13px] text-muted-foreground">Get a score and a ranked list of fixes for your PDF or DOCX.</span>
          </button>
          <button
            type="button"
            onClick={() => finish("/dashboard/builder")}
            className="flex flex-col items-start rounded-xl border bg-card p-5 text-left transition-[border-color] hover:border-primary active:scale-[0.99]"
          >
            <FilePlus2 className="size-5 text-primary" strokeWidth={1.75} />
            <span className="mt-3 text-[15px] font-semibold">No, start from scratch</span>
            <span className="mt-1 text-[13px] text-muted-foreground">Build one step by step with templates and writing help.</span>
          </button>
        </div>
      ),
      ready: true,
    },
  ];
  const s = steps[step]!;

  if (!hydrated) return null;

  return (
    <div className="w-full max-w-[560px]">
      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
        <span>
          Question {step + 1} of {steps.length}
        </span>
        <button onClick={() => finish("/dashboard")} className="font-medium hover:text-foreground">
          Skip for now
        </button>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={cn("h-1 rounded-full transition-colors duration-300", i <= step ? "bg-primary" : "bg-[#e2e8f0]")} />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -24 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="mt-8"
        >
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{s.title}</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">{s.hint}</p>
          <div className="mt-6">{s.body}</div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0} className={cn(step === 0 && "invisible")}>
          <ArrowLeft /> Back
        </Button>
        {step < steps.length - 1 && (
          <Button onClick={() => go(step + 1)} disabled={!s.ready}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
