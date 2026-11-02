"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { NativeSelect } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { generateBullets, generateDescription, generateSummary } from "@/lib/services/writer";
import type { EducationItem, ExperienceItem, ResumeContent, SectionKey, SimpleItem } from "@/lib/types";
import { formatRange, uid } from "@/lib/utils";
import { AiMenu, SuggestionPanel, type SuggestRequest } from "./ai-suggest";
import { AreaField, EntryCard, L, MonthField, move, MoveButtons, TagInput, TextField } from "./fields";

export type Update = (fn: (c: ResumeContent) => ResumeContent, group?: string) => void;
export type AiState = { key: string; request: SuggestRequest; initial?: string } | null;

export interface EditorProps {
  content: ResumeContent;
  update: Update;
  ai: AiState;
  setAi: (a: AiState) => void;
  targetRole: string;
}

/* ---------------- Personal information ---------------- */

export function ContactEditor({ content, update }: Pick<EditorProps, "content" | "update">) {
  const c = content.contact;
  const set = (k: keyof typeof c) => (v: string) => update((x) => ({ ...x, contact: { ...x.contact, [k]: v } }), `contact.${k}`);
  const emailBad = c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <TextField id="c-name" label="Full name" value={c.fullName} onChange={set("fullName")} placeholder="Alex Morgan" />
      <TextField id="c-title" label="Professional title" value={c.title} onChange={set("title")} placeholder="Senior Frontend Engineer" />
      <TextField id="c-email" label="Email" type="email" value={c.email} onChange={set("email")} placeholder="name@example.com" error={emailBad ? "Check the email format." : undefined} />
      <TextField id="c-phone" label="Phone" type="tel" value={c.phone} onChange={set("phone")} placeholder="(512) 555-0142" />
      <TextField id="c-loc" label="Location" value={c.location} onChange={set("location")} placeholder="Austin, TX" />
      <TextField id="c-li" label="LinkedIn URL" value={c.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/yourname" />
      <TextField id="c-port" label="Portfolio URL" value={c.portfolio} onChange={set("portfolio")} placeholder="github.com/yourname" />
      <TextField id="c-web" label="Website" value={c.website} onChange={set("website")} placeholder="yourname.com" />
    </div>
  );
}

/* ---------------- Summary ---------------- */

export function SummaryEditor({ content, update, ai, setAi, targetRole }: EditorProps) {
  const key = "summary";
  const gen: SuggestRequest = { mode: "custom", label: "Generate summary", generate: (v) => generateSummary(content, targetRole, v) };
  return (
    <div className="flex flex-col gap-3">
      <AreaField
        id="summary"
        label="Summary"
        rows={5}
        value={content.summary}
        onChange={(v) => update((x) => ({ ...x, summary: v }), "summary")}
        placeholder="Two to four sentences: your role, years of experience, core skills and one result you are proud of."
        extra={<AiMenu onPick={(r) => setAi({ key, request: r.mode === "custom" ? r : r })} extra={[gen]} />}
      />
      <p className="-mt-1 text-xs text-muted-foreground">{content.summary.trim().split(/\s+/).filter(Boolean).length} words. 30 to 80 reads best.</p>
      {ai?.key === key && (
        <SuggestionPanel
          original={content.summary}
          request={ai.request}
          initial={ai.initial}
          onClose={() => setAi(null)}
          onAccept={(t) => {
            update((x) => ({ ...x, summary: t }));
            setAi(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------------- Experience / Volunteer ---------------- */

const EMPLOYMENT = ["Full-time", "Part-time", "Contract", "Freelance", "Internship", "Volunteer"];

export function newRole(volunteer = false): ExperienceItem {
  return { id: uid("exp"), role: "", company: "", location: "", employmentType: volunteer ? "Volunteer" : "Full-time", start: "", end: "", current: false, description: "", bullets: [""] };
}

export function ExperienceEditor({ content, update, ai, setAi, field = "experience", openId }: EditorProps & { field?: "experience" | "volunteer"; openId?: string }) {
  const items = content[field];
  const [open, setOpen] = useState<string | null>(openId ?? items[0]?.id ?? null);
  const setItem = (id: string, patch: Partial<ExperienceItem>, group?: string) =>
    update((x) => ({ ...x, [field]: x[field].map((e) => (e.id === id ? { ...e, ...patch } : e)) }), group);
  const setItems = (fn: (l: ExperienceItem[]) => ExperienceItem[]) => update((x) => ({ ...x, [field]: fn(x[field]) }));
  const noun = field === "volunteer" ? "role" : "position";

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((e, idx) => {
        const isOpen = open === e.id || ai?.key.startsWith(`b:${e.id}:`) || false;
        return (
          <EntryCard
            key={e.id}
            title={e.role || `New ${noun}`}
            subtitle={[e.company, formatRange(e.start, e.end, e.current)].filter(Boolean).join(" · ")}
            open={isOpen}
            onToggle={() => setOpen(isOpen ? null : e.id)}
            actions={
              <MoveButtons
                label={e.role || noun}
                onUp={idx > 0 ? () => setItems((l) => move(l, idx, idx - 1)) : undefined}
                onDown={idx < items.length - 1 ? () => setItems((l) => move(l, idx, idx + 1)) : undefined}
                onRemove={() => setItems((l) => l.filter((x) => x.id !== e.id))}
              />
            }
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField id={`${e.id}-role`} label={field === "volunteer" ? "Role" : "Job title"} value={e.role} onChange={(v) => setItem(e.id, { role: v }, `${e.id}.role`)} placeholder="Senior Frontend Engineer" />
              <TextField id={`${e.id}-co`} label={field === "volunteer" ? "Organization" : "Company"} value={e.company} onChange={(v) => setItem(e.id, { company: v }, `${e.id}.co`)} placeholder="Lattice Health" />
              <TextField id={`${e.id}-loc`} label="Location" value={e.location} onChange={(v) => setItem(e.id, { location: v }, `${e.id}.loc`)} placeholder="Austin, TX or Remote" />
              <div className="flex flex-col gap-1.5">
                <L htmlFor={`${e.id}-type`}>Employment type</L>
                <NativeSelect id={`${e.id}-type`} value={e.employmentType} onChange={(ev) => setItem(e.id, { employmentType: ev.target.value })}>
                  {EMPLOYMENT.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </NativeSelect>
              </div>
              <MonthField id={`${e.id}-start`} label="Start date" value={e.start} onChange={(v) => setItem(e.id, { start: v })} />
              <MonthField id={`${e.id}-end`} label="End date" value={e.end} onChange={(v) => setItem(e.id, { end: v })} disabled={e.current} />
            </div>
            <label className="flex items-center gap-2 text-[13px]">
              <Checkbox checked={e.current} onCheckedChange={(c) => setItem(e.id, { current: !!c, end: c ? "" : e.end })} />I currently work here
            </label>
            <AreaField
              id={`${e.id}-desc`}
              label="Description"
              rows={2}
              value={e.description}
              onChange={(v) => setItem(e.id, { description: v }, `${e.id}.desc`)}
              placeholder="One line on the team, product or scope. Optional."
              extra={
                <AiMenu
                  label="Write"
                  onPick={(r) => setAi({ key: `d:${e.id}`, request: r })}
                  extra={[{ mode: "custom", label: "Generate description", generate: (v) => generateDescription(e.role, e.company, e.description, v) }]}
                />
              }
            />
            {ai?.key === `d:${e.id}` && (
              <SuggestionPanel
                original={e.description}
                request={ai.request}
                initial={ai.initial}
                onClose={() => setAi(null)}
                onAccept={(t) => {
                  setItem(e.id, { description: t });
                  setAi(null);
                }}
              />
            )}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium">Achievements</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-primary hover:text-primary"
                  onClick={() =>
                    setAi({
                      key: `g:${e.id}`,
                      request: { mode: "custom", label: "Generate bullet points", generate: (v) => generateBullets(e.role, e.description, v).join("\n") },
                    })
                  }
                >
                  Generate bullet points
                </Button>
              </div>
              {ai?.key === `g:${e.id}` && (
                <SuggestionPanel
                  original=""
                  request={ai.request}
                  onClose={() => setAi(null)}
                  onAccept={(t) => {
                    const lines = t.split("\n").map((s) => s.trim()).filter(Boolean);
                    setItem(e.id, { bullets: [...e.bullets.filter((b) => b.trim()), ...lines] });
                    setAi(null);
                  }}
                />
              )}
              {e.bullets.map((b, i) => {
                const key = `b:${e.id}:${i}`;
                return (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="group flex items-start gap-1.5">
                      <span className="mt-[15px] size-1 shrink-0 rounded-full bg-muted-foreground" />
                      <label htmlFor={key} className="sr-only">
                        Bullet {i + 1}
                      </label>
                      <textarea
                        id={key}
                        data-bullet={b}
                        value={b}
                        rows={1}
                        onChange={(ev) => setItem(e.id, { bullets: e.bullets.map((x, j) => (j === i ? ev.target.value : x)) }, key)}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" && !ev.shiftKey) {
                            ev.preventDefault();
                            const next = [...e.bullets];
                            next.splice(i + 1, 0, "");
                            setItem(e.id, { bullets: next });
                            requestAnimationFrame(() => document.getElementById(`b:${e.id}:${i + 1}`)?.focus());
                          }
                        }}
                        placeholder="Start with a verb and end with a result: Reduced load time by 40% by…"
                        className="field-sizing-content min-h-9 w-full flex-1 resize-none rounded-md border border-transparent px-2 py-1.5 text-base leading-snug outline-none hover:border-input focus:border-ring focus:ring-3 focus:ring-ring/40 md:text-sm"
                      />
                      <div className="flex shrink-0 items-center pt-1 opacity-100 transition-opacity sm:opacity-60 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                        <AiMenu label="" disabled={!b.trim()} onPick={(r) => setAi({ key, request: r })} />
                        <MoveButtons
                          label={`bullet ${i + 1}`}
                          onUp={i > 0 ? () => setItem(e.id, { bullets: move(e.bullets, i, i - 1) }) : undefined}
                          onDown={i < e.bullets.length - 1 ? () => setItem(e.id, { bullets: move(e.bullets, i, i + 1) }) : undefined}
                          onRemove={() => setItem(e.id, { bullets: e.bullets.filter((_, j) => j !== i) })}
                        />
                      </div>
                    </div>
                    {ai?.key === key && (
                      <div className="pl-3">
                        <SuggestionPanel
                          original={b}
                          request={ai.request}
                          initial={ai.initial}
                          onClose={() => setAi(null)}
                          onAccept={(t) => {
                            setItem(e.id, { bullets: e.bullets.map((x, j) => (j === i ? t : x)) });
                            setAi(null);
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setItem(e.id, { bullets: [...e.bullets, ""] })}>
                <Plus /> Add bullet
              </Button>
            </div>
          </EntryCard>
        );
      })}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const r = newRole(field === "volunteer");
          setItems((l) => [...l, r]);
          setOpen(r.id);
        }}
      >
        <Plus /> Add {field === "volunteer" ? "volunteer role" : "position"}
      </Button>
    </div>
  );
}

/* ---------------- Education ---------------- */

export function EducationEditor({ content, update }: Pick<EditorProps, "content" | "update">) {
  const items = content.education;
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  const setItem = (id: string, patch: Partial<EducationItem>, group?: string) =>
    update((x) => ({ ...x, education: x.education.map((e) => (e.id === id ? { ...e, ...patch } : e)) }), group);
  const setItems = (fn: (l: EducationItem[]) => EducationItem[]) => update((x) => ({ ...x, education: fn(x.education) }));
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((e, idx) => (
        <EntryCard
          key={e.id}
          title={[e.degree, e.field].filter(Boolean).join(" in ") || "New education"}
          subtitle={[e.institution, formatRange(e.start, e.end)].filter(Boolean).join(" · ")}
          open={open === e.id}
          onToggle={() => setOpen(open === e.id ? null : e.id)}
          actions={
            <MoveButtons
              label={e.institution || "education"}
              onUp={idx > 0 ? () => setItems((l) => move(l, idx, idx - 1)) : undefined}
              onDown={idx < items.length - 1 ? () => setItems((l) => move(l, idx, idx + 1)) : undefined}
              onRemove={() => setItems((l) => l.filter((x) => x.id !== e.id))}
            />
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField id={`${e.id}-inst`} className="sm:col-span-2" label="Institution" value={e.institution} onChange={(v) => setItem(e.id, { institution: v }, `${e.id}.inst`)} placeholder="The University of Texas at Austin" />
            <TextField id={`${e.id}-deg`} label="Degree" value={e.degree} onChange={(v) => setItem(e.id, { degree: v }, `${e.id}.deg`)} placeholder="B.S." />
            <TextField id={`${e.id}-field`} label="Field of study" value={e.field} onChange={(v) => setItem(e.id, { field: v }, `${e.id}.field`)} placeholder="Computer Science" />
            <MonthField id={`${e.id}-start`} label="Start date" value={e.start} onChange={(v) => setItem(e.id, { start: v })} />
            <MonthField id={`${e.id}-end`} label="Graduation date" value={e.end} onChange={(v) => setItem(e.id, { end: v })} />
          </div>
          <AreaField id={`${e.id}-det`} label="Additional details" rows={2} value={e.details} onChange={(v) => setItem(e.id, { details: v }, `${e.id}.det`)} placeholder="Honors, GPA if above 3.5, relevant coursework, thesis" />
        </EntryCard>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const n: EducationItem = { id: uid("edu"), institution: "", degree: "", field: "", start: "", end: "", details: "" };
          setItems((l) => [...l, n]);
          setOpen(n.id);
        }}
      >
        <Plus /> Add education
      </Button>
    </div>
  );
}

/* ---------------- Skills ---------------- */

export function SkillsEditor({ content, update, targetRole, suggestions }: Pick<EditorProps, "content" | "update" | "targetRole"> & { suggestions?: string[] }) {
  const groups = content.skills;
  const setGroups = (fn: (g: ResumeContent["skills"]) => ResumeContent["skills"], group?: string) => update((x) => ({ ...x, skills: fn(x.skills) }), group);
  const all = groups.flatMap((g) => g.skills.map((s) => s.toLowerCase()));
  const recs = (suggestions ?? []).filter((s) => !all.includes(s.toLowerCase())).slice(0, 8);
  return (
    <div className="flex flex-col gap-3">
      {groups.map((g, idx) => (
        <div key={g.id} className="flex flex-col gap-1.5 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <label htmlFor={`${g.id}-name`} className="sr-only">
              Category name
            </label>
            <input
              id={`${g.id}-name`}
              value={g.name}
              onChange={(e) => setGroups((l) => l.map((x) => (x.id === g.id ? { ...x, name: e.target.value } : x)), `${g.id}.name`)}
              placeholder="Category, for example Languages"
              className="h-8 min-w-0 flex-1 rounded-md border border-transparent px-1.5 text-sm font-medium outline-none hover:border-input focus:border-ring"
            />
            <MoveButtons
              label={g.name || "category"}
              onUp={idx > 0 ? () => setGroups((l) => move(l, idx, idx - 1)) : undefined}
              onDown={idx < groups.length - 1 ? () => setGroups((l) => move(l, idx, idx + 1)) : undefined}
              onRemove={() => setGroups((l) => l.filter((x) => x.id !== g.id))}
            />
          </div>
          <TagInput id={`${g.id}-tags`} value={g.skills} placeholder="Type a skill and press Enter" onChange={(v) => setGroups((l) => l.map((x) => (x.id === g.id ? { ...x, skills: v } : x)))} />
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => setGroups((l) => [...l, { id: uid("sk"), name: l.length ? "" : "Skills", skills: [] }])}>
        <Plus /> Add skill category
      </Button>
      {recs.length > 0 && (
        <div className="rounded-lg bg-subtle p-3">
          <p className="text-[13px] font-medium">Common for {targetRole || "your role"}</p>
          <p className="text-xs text-muted-foreground">Add only the ones you have used.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {recs.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setGroups((l) => (l.length ? l.map((x, i) => (i === l.length - 1 ? { ...x, skills: [...x.skills, s] } : x)) : [{ id: uid("sk"), name: "Skills", skills: [s] }]))
                }
                className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-[13px] transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="size-3" /> {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Simple lists ---------------- */

const SIMPLE_LABELS: Record<string, { noun: string; title: string; subtitle: string; date?: string; desc?: string; titlePh: string; subPh: string }> = {
  certifications: { noun: "certification", title: "Certification", subtitle: "Issuing organization", date: "Year", titlePh: "AWS Certified Cloud Practitioner", subPh: "Amazon Web Services" },
  projects: { noun: "project", title: "Project name", subtitle: "Type or your role", date: "Year", desc: "What it does and what it achieved", titlePh: "Tabletop", subPh: "Open-source library" },
  awards: { noun: "award", title: "Award", subtitle: "Awarded by", date: "Year", desc: "What it recognized", titlePh: "Engineering Excellence Award", subPh: "Lattice Health" },
  languages: { noun: "language", title: "Language", subtitle: "Proficiency", titlePh: "Spanish", subPh: "Professional working proficiency" },
};

export function SimpleEditor({ content, update, field }: Pick<EditorProps, "content" | "update"> & { field: "certifications" | "projects" | "awards" | "languages" }) {
  const items = content[field];
  const meta = SIMPLE_LABELS[field]!;
  const setItem = (id: string, patch: Partial<SimpleItem>, group?: string) => update((x) => ({ ...x, [field]: x[field].map((e) => (e.id === id ? { ...e, ...patch } : e)) }), group);
  const setItems = (fn: (l: SimpleItem[]) => SimpleItem[]) => update((x) => ({ ...x, [field]: fn(x[field]) }));
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((it, idx) => (
        <div key={it.id} className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="truncate text-sm font-medium">{it.title || `New ${meta.noun}`}</span>
            <MoveButtons
              label={it.title || meta.noun}
              onUp={idx > 0 ? () => setItems((l) => move(l, idx, idx - 1)) : undefined}
              onDown={idx < items.length - 1 ? () => setItems((l) => move(l, idx, idx + 1)) : undefined}
              onRemove={() => setItems((l) => l.filter((x) => x.id !== it.id))}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField id={`${it.id}-t`} label={meta.title} value={it.title} onChange={(v) => setItem(it.id, { title: v }, `${it.id}.t`)} placeholder={meta.titlePh} />
            <TextField id={`${it.id}-s`} label={meta.subtitle} value={it.subtitle} onChange={(v) => setItem(it.id, { subtitle: v }, `${it.id}.s`)} placeholder={meta.subPh} />
            {meta.date && <TextField id={`${it.id}-d`} label={meta.date} value={it.date} onChange={(v) => setItem(it.id, { date: v }, `${it.id}.d`)} placeholder="2024" />}
            {meta.desc && (
              <AreaField id={`${it.id}-x`} className="sm:col-span-2" label={meta.desc} rows={2} value={it.description} onChange={(v) => setItem(it.id, { description: v }, `${it.id}.x`)} />
            )}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => setItems((l) => [...l, { id: uid("it"), title: "", subtitle: "", date: "", description: "" }])}>
        <Plus /> Add {meta.noun}
      </Button>
    </div>
  );
}

/** Render the right editor for a section key. */
export function SectionEditor({ k, ...p }: EditorProps & { k: SectionKey; suggestions?: string[]; openId?: string }) {
  switch (k) {
    case "summary":
      return <SummaryEditor {...p} />;
    case "experience":
      return <ExperienceEditor {...p} />;
    case "volunteer":
      return <ExperienceEditor {...p} field="volunteer" />;
    case "education":
      return <EducationEditor {...p} />;
    case "skills":
      return <SkillsEditor {...p} />;
    default:
      return <SimpleEditor {...p} field={k} />;
  }
}
