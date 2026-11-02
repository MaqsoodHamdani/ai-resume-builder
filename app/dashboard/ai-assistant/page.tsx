"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Check, ClipboardCopy, FileText, ListChecks, Loader2, PenLine, RefreshCw, Save, Target, Trophy, Type } from "lucide-react";
import { toast } from "sonner";
import { Field, NativeSelect, PageHeader, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  explainRewrite,
  generateBullets,
  generateDescription,
  generateSummary,
  recommendSkills,
  rewrite,
  rewriteAchievement,
  REWRITE_MODES,
  suggestVerbs,
  type RewriteMode,
} from "@/lib/services/writer";
import { useStore } from "@/lib/store";
import type { Resume } from "@/lib/types";
import { cn, sleep, uid } from "@/lib/utils";

type ToolId = "summary" | "bullet" | "description" | "verbs" | "skills" | "achievement";
type Target = "summary" | "bullet" | "description" | "skills";

const TOOLS: { id: ToolId; label: string; desc: string; icon: typeof FileText; target: Target }[] = [
  { id: "summary", label: "Professional Summary Generator", desc: "A summary built from your experience", icon: FileText, target: "summary" },
  { id: "bullet", label: "Bullet Point Improver", desc: "Stronger, shorter, more specific bullets", icon: PenLine, target: "bullet" },
  { id: "description", label: "Experience Description Generator", desc: "A role description and starter bullets", icon: ListChecks, target: "description" },
  { id: "verbs", label: "Action Verb Suggestions", desc: "Precise verbs for the work you did", icon: Type, target: "bullet" },
  { id: "skills", label: "Skills Recommendations", desc: "Skills commonly expected for a role", icon: Target, target: "skills" },
  { id: "achievement", label: "Achievement Rewriter", desc: "Action, scope and result in one line", icon: Trophy, target: "bullet" },
];

function SaveDialog({ open, onOpenChange, text, target, skills }: { open: boolean; onOpenChange: (o: boolean) => void; text: string; target: Target; skills?: string[] }) {
  const resumes = useStore((s) => s.resumes);
  const update = useStore((s) => s.updateResume);
  const router = useRouter();
  const [rid, setRid] = useState(resumes[0]?.id ?? "");
  const resume = resumes.find((r) => r.id === rid);
  const [picked, setRoleId] = useState("");
  // Fall back to the first role whenever the chosen one is not in this resume.
  const roleId = resume?.content.experience.some((e) => e.id === picked) ? picked : (resume?.content.experience[0]?.id ?? "");

  const save = () => {
    if (!resume) return;
    if (target === "summary") update(rid, (r) => ({ content: { ...r.content, summary: text } }), `Updated summary in ${resume.name}`);
    else if (target === "skills") {
      update(rid, (r) => {
        const groups = r.content.skills.length ? r.content.skills : [{ id: uid("sk"), name: "Skills", skills: [] }];
        const have = groups.flatMap((g) => g.skills.map((s) => s.toLowerCase()));
        const add = (skills ?? []).filter((s) => !have.includes(s.toLowerCase()));
        return { content: { ...r.content, skills: groups.map((g, i) => (i === groups.length - 1 ? { ...g, skills: [...g.skills, ...add] } : g)) } };
      }, `Added skills to ${resume.name}`);
    } else {
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      update(rid, (r) => ({ content: { ...r.content, experience: r.content.experience.map((e) => (e.id === roleId ? { ...e, bullets: [...e.bullets.filter((b) => b.trim()), ...lines] } : e)) } }), `Added bullets to ${resume.name}`);
    }
    onOpenChange(false);
    toast.success("Saved to resume", { description: resume.name, action: { label: "Open", onClick: () => router.push(`/dashboard/resumes/${rid}/edit`) } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to resume</DialogTitle>
          <DialogDescription>
            {target === "summary" ? "This replaces the current summary. You can undo it in the editor." : target === "skills" ? "Selected skills are added to the last skills category." : target === "description" ? "The first line becomes the role description; the rest are added as bullets." : "Bullets are added to the end of the role you choose."}
          </DialogDescription>
        </DialogHeader>
        {resumes.length ? (
          <div className="flex flex-col gap-4">
            <Field label="Resume" htmlFor="s-res">
              <NativeSelect id="s-res" value={rid} onChange={(e) => setRid(e.target.value)}>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            {(target === "bullet" || target === "description") && (
              <Field label="Role" htmlFor="s-role">
                {resume?.content.experience.length ? (
                  <NativeSelect id="s-role" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                    {resume.content.experience.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.role || "Untitled role"}
                        {e.company ? ` at ${e.company}` : ""}
                      </option>
                    ))}
                  </NativeSelect>
                ) : (
                  <p className="text-sm text-muted-foreground">This resume has no roles yet. Add one in the editor first.</p>
                )}
              </Field>
            )}
            {target === "summary" && resume?.content.summary && (
              <div className="rounded-lg bg-subtle p-3 text-[13px]">
                <div className="text-xs font-medium text-muted-foreground">Current summary</div>
                <p className="mt-1 text-ink-2">{resume.content.summary}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Create a resume first, then save suggestions to it.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!resume || ((target === "bullet" || target === "description") && !roleId)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AiAssistantPage() {
  const resumes = useStore((s) => s.resumes);
  const user = useStore((s) => s.user);
  const [tool, setTool] = useState<ToolId>("bullet");
  const [rid, setRid] = useState(resumes[0]?.id ?? "");
  const resume: Resume | undefined = resumes.find((r) => r.id === rid);
  const [role, setRole] = useState(resume?.targetRole ?? user.targetRole);
  const [input, setInput] = useState("Responsible for maintaining the CI pipeline and release process");
  const [company, setCompany] = useState("");
  const [mode, setMode] = useState<RewriteMode>("improve");
  const [variant, setVariant] = useState(0);
  const [output, setOutput] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ran, setRan] = useState(false);
  const outRef = useRef<HTMLTextAreaElement>(null);
  const meta = TOOLS.find((t) => t.id === tool)!;

  const skillsList = useMemo(() => recommendSkills(role, resume?.content.skills.flatMap((g) => g.skills) ?? []), [role, resume]);
  const verbs = useMemo(() => suggestVerbs(input), [input]);

  const compute = (v: number) => {
    switch (tool) {
      case "summary":
        return resume ? generateSummary(resume.content, role, v) : "";
      case "bullet":
        return rewrite(input, mode, v);
      case "description":
        return [generateDescription(role, company, input, v), "", ...generateBullets(role, input, v)].join("\n");
      case "achievement":
        return rewriteAchievement(input, v);
      case "verbs":
        return rewrite(input, "verbs", v);
      case "skills":
        return "";
    }
  };

  const generate = async (v = variant) => {
    if (tool !== "summary" && tool !== "skills" && !input.trim()) {
      toast.error("Enter some text to work with first.");
      return;
    }
    setLoading(true);
    setAccepted(false);
    await sleep(500);
    setOutput(compute(v));
    if (tool === "skills") setPicked([]);
    setLoading(false);
    setRan(true);
  };

  const switchTool = (t: ToolId) => {
    setTool(t);
    setOutput("");
    setRan(false);
    setVariant(0);
    setAccepted(false);
    if (t === "description") setInput("Own the patient booking flow; work with design and payments teams; run weekly releases");
    else if (t === "achievement") setInput("Improved the onboarding flow for new clinics");
    else if (t === "bullet" || t === "verbs") setInput("Responsible for maintaining the CI pipeline and release process");
  };

  const needsInput = tool === "bullet" || tool === "verbs" || tool === "achievement" || tool === "description";
  const original = tool === "bullet" || tool === "achievement" || tool === "verbs" ? input : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="AI Writing Assistant" description="Focused tools for the hardest parts of a resume. Suggestions are yours to edit, and nothing changes in a resume until you save it." />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Writing tools" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTool(t.id)}
              aria-current={tool === t.id ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors lg:shrink",
                tool === t.id ? "bg-background ring-1 ring-border" : "hover:bg-background/60",
              )}
            >
              <t.icon className={cn("mt-0.5 size-4 shrink-0", tool === t.id ? "text-primary" : "text-muted-foreground")} strokeWidth={1.75} />
              <span className="min-w-0">
                <span className="block text-sm font-medium whitespace-nowrap lg:whitespace-normal">{t.label}</span>
                <span className="hidden text-xs text-muted-foreground lg:block">{t.desc}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel title={meta.label} description={meta.desc}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(tool === "summary" || tool === "skills") && (
                <Field label="Use details from" htmlFor="a-res">
                  <NativeSelect
                    id="a-res"
                    value={rid}
                    onChange={(e) => {
                      setRid(e.target.value);
                      setRole(resumes.find((r) => r.id === e.target.value)?.targetRole ?? role);
                    }}
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
              {(tool === "summary" || tool === "skills" || tool === "description") && (
                <Field label="Target role" htmlFor="a-role">
                  <Input id="a-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Senior Frontend Engineer" />
                </Field>
              )}
              {tool === "description" && (
                <Field label="Company" htmlFor="a-co" optional>
                  <Input id="a-co" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Lattice Health" />
                </Field>
              )}
              {tool === "bullet" && (
                <Field label="What to improve" htmlFor="a-mode">
                  <NativeSelect id="a-mode" value={mode} onChange={(e) => setMode(e.target.value as RewriteMode)}>
                    {REWRITE_MODES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
              {needsInput && (
                <Field
                  label={tool === "description" ? "What you did in this role" : tool === "achievement" ? "Achievement to rewrite" : "Bullet point"}
                  htmlFor="a-in"
                  className="sm:col-span-2"
                  hint={tool === "description" ? "Rough notes are fine. Separate points with semicolons or new lines." : undefined}
                >
                  <Textarea id="a-in" value={input} onChange={(e) => setInput(e.target.value)} rows={3} className="min-h-20" />
                </Field>
              )}
            </div>
            {tool !== "verbs" && (
              <div className="mt-5 flex justify-end">
                <Button
                  onClick={() => {
                    setVariant(0);
                    void generate(0);
                  }}
                  disabled={loading || (tool === "summary" && !resume)}
                >
                  {loading && <Loader2 className="animate-spin" />}
                  {tool === "skills" ? "Recommend skills" : ran ? "Generate again" : "Generate"}
                </Button>
              </div>
            )}
          </Panel>

          {tool === "verbs" && (
            <Panel title="Suggested verbs" description={verbs.strong ? `“${verbs.current}” is already a strong opener. Alternatives:` : verbs.current ? `“${verbs.current}” is weak. Click a verb to rewrite the bullet with it.` : "Type a bullet above."}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {verbs.groups.map((g) => (
                  <div key={g.group}>
                    <h3 className="text-xs font-medium text-muted-foreground">{g.group}</h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {g.verbs.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            const rest = rewrite(input, "verbs").split(" ").slice(1).join(" ");
                            setOutput(`${v} ${rest}`);
                            setRan(true);
                            setAccepted(false);
                          }}
                          className="h-7 rounded-md border px-2.5 text-[13px] transition-colors hover:border-primary hover:text-primary"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {ran && (
            <Panel
              title={tool === "skills" ? "Recommended skills" : "Suggestion"}
              description={tool === "skills" ? "Select only skills you have actually used." : "Edit freely. Bracketed text marks details only you know."}
              actions={accepted ? <span className="flex items-center gap-1 text-xs font-medium text-success"><Check className="size-3.5" /> Accepted</span> : null}
            >
              {loading ? (
                <div className="flex h-24 items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Writing
                </div>
              ) : tool === "skills" ? (
                skillsList.length ? (
                  <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
                    {skillsList.map((s) => (
                      <label key={s} className="flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm">
                        <Checkbox checked={picked.includes(s)} onCheckedChange={(c) => setPicked((p) => (c ? [...p, s] : p.filter((x) => x !== s)))} />
                        {s}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Your resume already lists the skills commonly expected for {role || "this role"}.</p>
                )
              ) : (
                <div className="flex flex-col gap-3">
                  {original && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">Original</div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{original}</p>
                    </div>
                  )}
                  <div>
                    <label htmlFor="a-out" className="text-xs font-medium text-muted-foreground">
                      Suggested
                    </label>
                    <Textarea
                      ref={outRef}
                      id="a-out"
                      value={output}
                      onChange={(e) => {
                        setOutput(e.target.value);
                        setAccepted(false);
                      }}
                      rows={Math.max(3, output.split("\n").length + 1)}
                      className="mt-1 min-h-20 bg-[#f7f9ff]"
                    />
                    {original && output && <p className="mt-1.5 text-xs text-muted-foreground">{explainRewrite(original, output).join(" · ")}</p>}
                  </div>
                </div>
              )}
              {!loading && (
                <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                  {tool !== "skills" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(output);
                            toast.success("Copied");
                          } catch {
                            outRef.current?.select();
                            toast("Text selected. Press Ctrl+C to copy.");
                          }
                        }}
                      >
                        <ClipboardCopy /> Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const v = variant + 1;
                          setVariant(v);
                          void generate(v);
                        }}
                      >
                        <RefreshCw /> Regenerate
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => outRef.current?.focus()}>
                        <PenLine /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAccepted(true)} disabled={accepted || !output.trim()}>
                        <Check /> Accept
                      </Button>
                    </>
                  )}
                  <Button size="sm" className="sm:ml-auto" onClick={() => setSaving(true)} disabled={tool === "skills" ? !picked.length : !output.trim()}>
                    <Save /> Save to resume
                  </Button>
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>
      <SaveDialog open={saving} onOpenChange={setSaving} text={output} target={meta.target} skills={picked} />
    </div>
  );
}
