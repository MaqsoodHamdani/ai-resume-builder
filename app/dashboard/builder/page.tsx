"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, FilePlus2, LayoutTemplate } from "lucide-react";
import { LimitNotice } from "@/components/app/limit-notice";
import { NativeSelect, PageHeader } from "@/components/app/ui";
import { TemplateThumbEmpty } from "@/components/templates/thumb";
import { Button } from "@/components/ui/button";
import { DEFAULT_ORDER, TEMPLATES } from "@/lib/config";
import { useResumeLimit } from "@/lib/limits";
import { useStore } from "@/lib/store";
import { emptyContent } from "@/lib/content";
import type { ResumeContent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Method = "scratch" | "existing" | "template";

export default function BuilderStart() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const resumes = useStore((s) => s.resumes);
  const createResume = useStore((s) => s.createResume);
  const plan = user.plan;
  const limit = useResumeLimit();
  const [method, setMethod] = useState<Method>("scratch");
  const [source, setSource] = useState(resumes[0]?.id ?? "");
  const [template, setTemplate] = useState(user.preferences.defaultTemplate);

  const start = () => {
    const base = method === "existing" ? resumes.find((r) => r.id === source) : undefined;
    const id = createResume({
      name: base ? `${base.name} (new draft)` : "Untitled resume",
      targetRole: base?.targetRole ?? user.targetRole,
      content: base ? (JSON.parse(JSON.stringify(base.content)) as ResumeContent) : emptyContent(user.name, user.email),
      sectionOrder: base?.sectionOrder ?? DEFAULT_ORDER.slice(0, 4),
      templateId: method === "template" ? template : base?.design.templateId,
      source: "builder",
    });
    router.push(`/dashboard/builder/${id}?step=personal`);
  };

  const options = [
    { id: "scratch" as const, icon: FilePlus2, title: "Start from scratch", body: "Answer a few guided steps. Writing help is available at every step." },
    { id: "existing" as const, icon: Copy, title: "Use an existing resume", body: "Start from a copy of one of your resumes. The original stays untouched.", disabled: !resumes.length },
    { id: "template" as const, icon: LayoutTemplate, title: "Choose a template", body: "Pick the look first, then fill in your details." },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title="Resume Builder" description="Create a resume step by step. Your progress saves as you go." />
      {limit.reached ? (
        <LimitNotice limit={limit.limit} />
      ) : (
        <>
          <div role="radiogroup" aria-label="How do you want to start?" className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={method === o.id}
                disabled={o.disabled}
                onClick={() => setMethod(o.id)}
                className={cn(
                  "flex flex-col items-start rounded-xl border bg-card p-5 text-left transition-[border-color,box-shadow] disabled:opacity-50",
                  method === o.id ? "border-primary ring-3 ring-primary/15" : "hover:border-[#cbd5e1]",
                )}
              >
                <o.icon className="size-5 text-primary" strokeWidth={1.75} />
                <span className="mt-3 text-[15px] font-semibold">{o.title}</span>
                <span className="mt-1 text-[13px] text-muted-foreground">{o.disabled ? "You have no resumes yet." : o.body}</span>
              </button>
            ))}
          </div>

          {method === "existing" && (
            <div className="rounded-xl border bg-card p-5">
              <label htmlFor="src" className="text-[13px] font-medium">
                Start from
              </label>
              <NativeSelect id="src" value={source} onChange={(e) => setSource(e.target.value)} className="mt-1.5 max-w-md">
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          {method === "template" && (
            <div role="radiogroup" aria-label="Template" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {TEMPLATES.map((t) => {
                const locked = plan === "free" && !t.free;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={template === t.id}
                    disabled={locked}
                    onClick={() => setTemplate(t.id)}
                    className={cn("rounded-xl border bg-card p-2 text-left transition-[border-color,box-shadow] disabled:opacity-50", template === t.id ? "border-primary ring-3 ring-primary/15" : "hover:border-[#cbd5e1]")}
                  >
                    <div className="aspect-[8.5/11] overflow-hidden rounded-md bg-[#eef2f7] p-2">
                      <TemplateThumbEmpty templateId={t.id} />
                    </div>
                    <div className="px-1 pt-2 pb-1 text-sm font-medium">{t.name}</div>
                    <div className="px-1 pb-1 text-xs text-muted-foreground">{locked ? "Pro" : t.category}</div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-end">
            <Button size="lg" onClick={start}>
              Continue
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
