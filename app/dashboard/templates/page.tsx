"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import { NativeSelect, PageHeader, Pill } from "@/components/app/ui";
import { ScaledPaper } from "@/components/resume/scaled-paper";
import { SAMPLE_RESUME, TemplateThumbEmpty } from "@/components/templates/thumb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_ORDER, designFor, TEMPLATE_CATEGORIES, TEMPLATES, type TemplateMeta } from "@/lib/config";
import { emptyContent } from "@/lib/content";
import { useResumeLimit } from "@/lib/limits";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function TemplatesPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const resumes = useStore((s) => s.resumes);
  const updateResume = useStore((s) => s.updateResume);
  const createResume = useStore((s) => s.createResume);
  const limit = useResumeLimit();
  const [cat, setCat] = useState<string>("All");
  const [preview, setPreview] = useState<TemplateMeta | null>(null);
  const [using, setUsing] = useState<TemplateMeta | null>(null);
  const [target, setTarget] = useState<string>("new");

  const list = TEMPLATES.filter((t) => cat === "All" || t.category === cat);
  const locked = (t: TemplateMeta) => user.plan === "free" && !t.free;

  const apply = () => {
    if (!using) return;
    if (target === "new") {
      if (limit.reached) {
        toast.error("Your plan’s resume limit is reached", { description: "Apply the template to an existing resume, or upgrade." });
        return;
      }
      const id = createResume({ name: "Untitled resume", targetRole: user.targetRole, content: emptyContent(user.name, user.email), sectionOrder: DEFAULT_ORDER.slice(0, 4), templateId: using.id, source: "builder" });
      router.push(`/dashboard/builder/${id}?step=personal`);
    } else {
      updateResume(target, (r) => ({ design: { ...r.design, templateId: using.id, ...using.defaults } }), `Applied the ${using.name} template`);
      toast.success(`${using.name} applied`);
      router.push(`/dashboard/resumes/${target}/edit`);
    }
    setUsing(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Resume Templates" description="Eight layouts with different structures. Your content moves between them without retyping." />

      <div role="tablist" aria-label="Categories" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {["All", ...TEMPLATE_CATEGORIES].map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className={cn("h-8 shrink-0 rounded-full border px-3.5 text-[13px] transition-colors", cat === c ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-subtle")}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((t) => (
          <article key={t.id} className="group flex flex-col">
            <button type="button" onClick={() => setPreview(t)} className="relative block aspect-[8.5/11] overflow-hidden rounded-xl bg-[#e9edf3] p-4 text-left" aria-label={`Preview ${t.name}`}>
              <div className="h-full transition-transform duration-300 ease-out group-hover:-translate-y-1">
                <TemplateThumbEmpty templateId={t.id} />
              </div>
              <span className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[13px] font-medium text-white shadow-lg">
                  <Eye className="size-3.5" /> Preview
                </span>
              </span>
            </button>
            <div className="mt-3 flex items-center gap-2">
              <h2 className="text-[15px] font-semibold">{t.name}</h2>
              {t.ats && <Pill tone="success">ATS-friendly</Pill>}
              {locked(t) && (
                <Pill tone="neutral">
                  <Lock className="size-3" /> Pro
                </Pill>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t.category}</p>
            <p className="mt-1.5 flex-1 text-[13px] text-ink-2">{t.description}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreview(t)}>
                Preview
              </Button>
              <Button
                size="sm"
                disabled={locked(t)}
                onClick={() => {
                  setTarget(resumes[0]?.id ?? "new");
                  setUsing(t);
                }}
              >
                Use template
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-h-[92dvh] gap-0 overflow-hidden p-0 sm:max-w-[860px]">
          {preview && (
            <>
              <DialogHeader className="border-b px-5 py-3.5">
                <DialogTitle>{preview.name}</DialogTitle>
                <DialogDescription>
                  {preview.category} · {preview.description}
                </DialogDescription>
              </DialogHeader>
              <div className="scroll-quiet max-h-[calc(92dvh-140px)] overflow-y-auto bg-[#e9edf3] p-4 sm:p-8">
                <ScaledPaper content={SAMPLE_RESUME.content} order={SAMPLE_RESUME.sectionOrder} design={designFor(preview.id)} showBreaks />
              </div>
              <DialogFooter className="m-0 border-t px-5 py-3">
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Close
                </Button>
                <Button
                  disabled={locked(preview)}
                  onClick={() => {
                    setTarget(resumes[0]?.id ?? "new");
                    setUsing(preview);
                    setPreview(null);
                  }}
                >
                  Use template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!using} onOpenChange={(o) => !o && setUsing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Use {using?.name}</DialogTitle>
            <DialogDescription>Apply it to a resume you have, or start a new one with it.</DialogDescription>
          </DialogHeader>
          <label htmlFor="tpl-target" className="text-[13px] font-medium">
            Apply to
          </label>
          <NativeSelect id="tpl-target" value={target} onChange={(e) => setTarget(e.target.value)}>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
            <option value="new">A new resume</option>
          </NativeSelect>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsing(null)}>
              Cancel
            </Button>
            <Button onClick={apply}>{target === "new" ? "Start resume" : "Apply template"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
