"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Cloud,
  Download,
  Eye,
  Gauge,
  History,
  LayoutTemplate,
  Loader2,
  MoreHorizontal,
  Palette,
  Plus,
  Redo2,
  Save,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/ui";
import { DesignControls, Segmented, TemplateList } from "@/components/editor/design-controls";
import { MoveButtons } from "@/components/editor/fields";
import { useHistory } from "@/components/editor/history";
import { ContactEditor, SectionEditor, type AiState } from "@/components/editor/sections";
import { ScaledPaper } from "@/components/resume/scaled-paper";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ALL_SECTIONS, getTemplate, SECTION_META } from "@/lib/config";
import { printResume } from "@/lib/print";
import { skillsForRole } from "@/lib/services/text";
import { useResume, useStore } from "@/lib/store";
import type { Resume, ResumeContent, ResumeDesign, SectionKey } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type Draft = { content: ResumeContent; order: SectionKey[]; design: ResumeDesign };

function IconTip({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function SectionCard({
  id,
  title,
  hint,
  open,
  onToggle,
  actions,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  open: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4 rounded-xl border bg-card">
      <div className="flex items-center gap-2 pr-3">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-4 text-left">
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", !open && "-rotate-90")} />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{title}</span>
            {!open && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
          </span>
        </button>
        {actions}
      </div>
      {open && <div className="border-t px-4 pt-4 pb-5">{children}</div>}
    </section>
  );
}

function Editor({ resume }: { resume: Resume }) {
  const router = useRouter();
  const params = useSearchParams();
  const save = useStore((s) => s.updateResume);
  const saveVersion = useStore((s) => s.saveVersion);
  const plan = useStore((s) => s.user.plan);
  const report = useStore((s) => s.reports.find((r) => r.resumeId === resume.id));

  const h = useHistory<Draft>({ content: resume.content, order: resume.sectionOrder, design: resume.design });
  const { content, order, design } = h.value;
  const first = useRef(h.value);
  const latest = useRef(h.value);
  useEffect(() => {
    latest.current = h.value;
  }, [h.value]);
  const [status, setStatus] = useState<"saved" | "saving" | "dirty">("saved");
  const [open, setOpen] = useState<Set<string>>(() => new Set([params.get("section") ?? "contact"]));
  // "Fix this" from the report opens the matching field with the suggested fix already loaded.
  const [ai, setAi] = useState<AiState>(() => {
    const f = report?.findings.find((x) => x.id === params.get("finding"));
    if (!f?.before) return null;
    const request = { mode: "improve" as const, label: `Suggested fix: ${f.title}` };
    if (f.section === "summary") return { key: "summary", request, initial: f.after };
    for (const field of ["experience", "volunteer"] as const) {
      for (const e of resume.content[field]) {
        const i = e.bullets.findIndex((b) => b.trim() === f.before!.trim());
        if (i >= 0) return { key: `b:${e.id}:${i}`, request, initial: f.after };
      }
    }
    return null;
  });
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [pages, setPages] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [name, setName] = useState(resume.name);

  const update = useCallback((fn: (c: ResumeContent) => ResumeContent, group?: string) => h.set((d) => ({ ...d, content: fn(d.content) }), group), [h]);
  const setDesign = (p: Partial<ResumeDesign>) => h.set((d) => ({ ...d, design: { ...d.design, ...p } }), "design");
  const setOrder = (fn: (o: SectionKey[]) => SectionKey[]) => h.set((d) => ({ ...d, order: fn(d.order) }));

  // Autosave shortly after the last change.
  useEffect(() => {
    if (h.value === first.current) return;
    setStatus("dirty");
    const t = setTimeout(() => {
      setStatus("saving");
      save(resume.id, { content: latest.current.content, sectionOrder: latest.current.order, design: latest.current.design });
      setTimeout(() => setStatus("saved"), 350);
    }, 700);
    return () => clearTimeout(t);
  }, [h.value, resume.id, save]);

  // Never lose edits: flush on leave and warn while a save is pending.
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (status !== "saved") e.preventDefault();
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [status]);
  useEffect(
    () => () => {
      if (latest.current !== first.current) save(resume.id, { content: latest.current.content, sectionOrder: latest.current.order, design: latest.current.design });
    },
    [resume.id, save],
  );

  // Keyboard: undo, redo, save.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        h.undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        h.redo();
      } else if (k === "s") {
        e.preventDefault();
        save(resume.id, { content: latest.current.content, sectionOrder: latest.current.order, design: latest.current.design });
        setStatus("saved");
        toast.success("Saved");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [h, resume.id, save]);

  // Scroll to the section a deep link asked for.
  useEffect(() => {
    const section = params.get("section");
    const target = ai?.key.startsWith("b:") ? ai.key : section ? `sec-${section}` : null;
    if (target) setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (k: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const removeSection = (k: SectionKey) => {
    setOrder((o) => o.filter((x) => x !== k));
    toast(`${SECTION_META[k].label} removed`, { description: "Its content is kept if you add it back.", action: { label: "Undo", onClick: () => h.undo() } });
  };
  const hidden = ALL_SECTIONS.filter((k) => !order.includes(k));
  const t = getTemplate(design.templateId);

  const statusEl = (
    <span className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground" aria-live="polite">
      {status === "saved" ? <Cloud className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
      {status === "saved" ? "Saved" : status === "saving" ? "Saving" : "Unsaved changes"}
    </span>
  );

  const doDownload = () => {
    const current: Resume = { ...resume, name, content, sectionOrder: order, design };
    save(resume.id, { content, sectionOrder: order, design });
    setStatus("saved");
    printResume(current);
  };

  return (
    <div className="flex h-[calc(100dvh-56px)] flex-col">
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:px-4">
        <IconTip label="Back to resume">
          <Link href={`/dashboard/resumes/${resume.id}`} className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="Back to resume">
            <ArrowLeft className="size-4" />
          </Link>
        </IconTip>
        <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-3">
          <label htmlFor="res-title" className="sr-only">
            Resume name
          </label>
          <input
            id="res-title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              const n = name.trim() || resume.name;
              setName(n);
              if (n !== resume.name) save(resume.id, { name: n });
            }}
            className="h-8 w-full max-w-[280px] min-w-0 truncate rounded-md border border-transparent bg-transparent px-1.5 text-sm font-semibold outline-none hover:border-input focus:border-ring"
          />
          <span className="px-1.5 sm:px-0">{statusEl}</span>
        </div>

        <div className="flex items-center gap-0.5">
          <IconTip label="Undo (Ctrl+Z)">
            <Button variant="ghost" size="icon" onClick={h.undo} disabled={!h.canUndo} aria-label="Undo">
              <Undo2 className="size-4" />
            </Button>
          </IconTip>
          <IconTip label="Redo (Ctrl+Shift+Z)">
            <Button variant="ghost" size="icon" onClick={h.redo} disabled={!h.canRedo} aria-label="Redo">
              <Redo2 className="size-4" />
            </Button>
          </IconTip>
        </div>
        <span className="mx-1 hidden h-6 w-px bg-border md:block" />
        <div className="hidden items-center gap-1 md:flex">
          <Popover>
            <PopoverTrigger render={<Button variant="ghost" />}>
              <LayoutTemplate className="size-4" /> {t.name}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-1.5">
              <TemplateList value={design.templateId} plan={plan} onPick={(id) => setDesign({ templateId: id, ...getTemplate(id).defaults })} />
              {plan === "free" && <p className="px-2.5 pt-1.5 pb-1 text-xs text-muted-foreground">Locked templates are part of Pro.</p>}
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger render={<Button variant="ghost" />}>
              <Palette className="size-4" /> Design
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-4">
              <DesignControls design={design} onChange={setDesign} />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4" /> Preview
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="More actions" />}>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() => {
                setVersionName(`Version ${resume.versions.length + 1}`);
                setVersionOpen(true);
              }}
            >
              <Save /> Save as version
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
              <History /> Version history
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                save(resume.id, { content, sectionOrder: order, design });
                router.push(`/dashboard/analyzer/${resume.id}?run=1`);
              }}
            >
              <Gauge /> Analyze resume
            </DropdownMenuItem>
            <DropdownMenuItem className="md:hidden" onClick={() => setPreviewOpen(true)}>
              <Eye /> Full preview
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          className="hidden lg:inline-flex"
          onClick={() => {
            save(resume.id, { content, sectionOrder: order, design });
            router.push(`/dashboard/analyzer/${resume.id}?run=1`);
          }}
        >
          <Gauge className="size-4" /> Analyze
        </Button>
        <Button onClick={doDownload} aria-label="Download PDF">
          <Download className="size-4" />
          <span className="hidden sm:inline">Download PDF</span>
        </Button>
      </div>

      {/* Mobile switch */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-2 lg:hidden">
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          options={[
            { id: "edit", label: "Edit" },
            { id: "preview", label: "Preview" },
          ]}
        />
        <div className="flex gap-1 md:hidden">
          <Popover>
            <PopoverTrigger render={<Button variant="ghost" size="sm" />}>
              <LayoutTemplate className="size-4" /> Template
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-1.5">
              <TemplateList value={design.templateId} plan={plan} onPick={(id) => setDesign({ templateId: id, ...getTemplate(id).defaults })} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger render={<Button variant="ghost" size="sm" />}>
              <Palette className="size-4" /> Design
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-4">
              <DesignControls design={design} onChange={setDesign} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 min-h-0 flex-1 lg:grid-cols-[minmax(440px,540px)_1fr]">
        {/* Sections */}
        <div className={cn("scroll-quiet min-h-0 overflow-y-auto border-r bg-subtle", view === "preview" && "hidden lg:block")}>
          <div className="flex flex-col gap-3 p-3 sm:p-4">
            <SectionCard id="sec-contact" title="Personal Information" hint={[content.contact.fullName, content.contact.email].filter(Boolean).join(" · ") || "Name and contact details"} open={open.has("contact")} onToggle={() => toggle("contact")}>
              <ContactEditor content={content} update={update} />
            </SectionCard>
            {order.map((k, i) => (
              <SectionCard
                key={k}
                id={`sec-${k}`}
                title={SECTION_META[k].label}
                hint={SECTION_META[k].hint}
                open={open.has(k) || !!ai?.key && ((k === "summary" && ai.key === "summary") || ((k === "experience" || k === "volunteer") && content[k].some((e) => ai.key.includes(e.id))))}
                onToggle={() => toggle(k)}
                actions={
                  <MoveButtons
                    label={SECTION_META[k].label}
                    onUp={i > 0 ? () => setOrder((o) => [...o.slice(0, i - 1), o[i]!, o[i - 1]!, ...o.slice(i + 1)]) : undefined}
                    onDown={i < order.length - 1 ? () => setOrder((o) => [...o.slice(0, i), o[i + 1]!, o[i]!, ...o.slice(i + 2)]) : undefined}
                    onRemove={() => removeSection(k)}
                  />
                }
              >
                <SectionEditor k={k} content={content} update={update} ai={ai} setAi={setAi} targetRole={resume.targetRole} suggestions={skillsForRole(resume.targetRole)} />
              </SectionCard>
            ))}
            {hidden.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" className="w-full border-dashed bg-transparent" />}>
                  <Plus /> Add section
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                  {hidden.map((k) => (
                    <DropdownMenuItem
                      key={k}
                      onClick={() => {
                        setOrder((o) => [...o, k]);
                        setOpen((s) => new Set(s).add(k));
                        requestAnimationFrame(() => setTimeout(() => document.getElementById(`sec-${k}`)?.scrollIntoView({ behavior: "smooth" }), 30));
                      }}
                    >
                      {SECTION_META[k].label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className={cn("scroll-quiet min-h-0 overflow-y-auto bg-[#e9edf3]", view === "edit" && "hidden lg:block")}>
          <div className="sticky top-0 z-10 flex items-center justify-between bg-[#e9edf3]/95 px-6 py-2 text-xs text-muted-foreground">
            <span>
              {t.name} · {pages} {pages === 1 ? "page" : "pages"} · Letter
            </span>
            {pages > 2 && <span className="text-warning">Over two pages. Consider trimming.</span>}
          </div>
          <div className="mx-auto max-w-[860px] px-4 pb-10 sm:px-8">
            <ScaledPaper content={content} order={order} design={design} showBreaks onPages={setPages} />
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[92dvh] gap-0 overflow-hidden p-0 sm:max-w-[900px]">
          <DialogHeader className="border-b px-5 py-3.5">
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription>Exactly what the PDF will contain.</DialogDescription>
          </DialogHeader>
          <div className="scroll-quiet max-h-[calc(92dvh-140px)] overflow-y-auto bg-[#e9edf3] p-4 sm:p-8">
            <ScaledPaper content={content} order={order} design={design} showBreaks />
          </div>
          <DialogFooter className="m-0 border-t px-5 py-3">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={doDownload}>
              <Download /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as version</DialogTitle>
            <DialogDescription>A snapshot you can return to. Your resume keeps its current content.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!versionName.trim()) return;
              save(resume.id, { content, sectionOrder: order, design });
              saveVersion(resume.id, versionName.trim());
              setVersionOpen(false);
              toast.success("Version saved", { description: versionName.trim() });
            }}
          >
            <label htmlFor="v-name" className="text-[13px] font-medium">
              Version name
            </label>
            <Input id="v-name" className="mt-1.5" value={versionName} onChange={(e) => setVersionName(e.target.value)} autoFocus />
            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={() => setVersionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!versionName.trim()}>
                Save version
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Version history</DialogTitle>
            <DialogDescription>Restoring replaces the editor content. You can undo it.</DialogDescription>
          </DialogHeader>
          {resume.versions.length ? (
            <ul className="-mx-1 max-h-80 overflow-y-auto">
              {[...resume.versions].reverse().map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 border-t px-1 py-2.5 first:border-t-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{v.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(v.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      {v.score != null && ` · Score ${v.score}`}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      h.set((d) => ({ ...d, content: JSON.parse(JSON.stringify(v.content)) as ResumeContent }));
                      setHistoryOpen(false);
                      toast.success(`Restored “${v.label}”`, { action: { label: "Undo", onClick: () => h.undo() } });
                    }}
                  >
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No saved versions yet. Use Save as version to create one.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditRoute() {
  const { id } = useParams<{ id: string }>();
  const resume = useResume(id);
  if (!resume)
    return (
      <div className="p-8">
        <div className="rounded-xl border bg-card">
          <EmptyState
            title="Resume not found"
            description="It may have been deleted."
            action={
              <Link href="/dashboard/resumes" className={buttonVariants()}>
                Go to My Resumes
              </Link>
            }
          />
        </div>
      </div>
    );
  return <Editor key={resume.id} resume={resume} />;
}

export default function EditPage() {
  return (
    <Suspense>
      <EditRoute />
    </Suspense>
  );
}

