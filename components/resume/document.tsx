"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { FONTS, MARGINS, PAGE, SECTION_META, SPACING } from "@/lib/config";
import type { EducationItem, ExperienceItem, ResumeContent, ResumeDesign, SectionKey, SimpleItem } from "@/lib/types";
import { formatMonth, formatRange, initials } from "@/lib/utils";

export interface DocProps {
  content: ResumeContent;
  order: SectionKey[];
  design: ResumeDesign;
  /** Text to highlight with a numbered margin mark (the annotated page). */
  marks?: { text: string; n: number }[];
}

const Marks = createContext<DocProps["marks"]>(undefined);

function Marked({ text }: { text: string }) {
  const marks = useContext(Marks);
  const m = marks?.find((x) => x.text.trim() === text.trim());
  if (!m) return <>{text}</>;
  return (
    <mark style={{ background: "rgba(37, 99, 235, 0.12)", color: "inherit", boxShadow: "inset 0 -2px 0 rgba(37, 99, 235, 0.55)", padding: "0 0.1em" }}>
      {text}
      <sup style={{ marginLeft: "0.25em", fontSize: "0.72em", fontWeight: 700, color: "#1d4ed8", fontFamily: "var(--font-geist-sans), sans-serif" }}>{m.n}</sup>
    </mark>
  );
}

type EntryStyle = "inline" | "ledger" | "gutter" | "timeline" | "sterling";
type SkillStyle = "lines" | "grid" | "chips" | "stack" | "columns";
interface Look {
  heading: (title: string) => ReactNode;
  entry: EntryStyle;
  skills: SkillStyle;
}

const gap = (n: number) => `calc(var(--gap) * ${n}em)`;
const clean = (u: string) => u.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

function contactItems(c: ResumeContent["contact"]) {
  return [c.email, c.phone, c.location, c.linkedin && clean(c.linkedin), c.portfolio && clean(c.portfolio), c.website && clean(c.website)].filter(
    Boolean,
  ) as string[];
}

function has(content: ResumeContent, key: SectionKey) {
  if (key === "summary") return !!content.summary.trim();
  if (key === "skills") return content.skills.some((g) => g.skills.length);
  return (content[key] as unknown[]).length > 0;
}

function Name({ c, className, style }: { c: ResumeContent["contact"]; className?: string; style?: CSSProperties }) {
  return (
    <div className={className} style={style}>
      {c.fullName || <span style={{ color: "#9ca3af" }}>Your name</span>}
    </div>
  );
}

/* ---------- Entries ---------- */

function EntryHead({
  look,
  title,
  sub,
  meta,
  dates,
}: {
  look: EntryStyle;
  title: string;
  sub?: string;
  meta?: string;
  dates: string;
}) {
  if (look === "ledger")
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1em" }}>
          <strong style={{ fontWeight: 700 }}>{sub || title}</strong>
          <span>{meta}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1em", fontStyle: "italic" }}>
          <span>{sub ? title : ""}</span>
          <span style={{ whiteSpace: "nowrap" }}>{dates}</span>
        </div>
      </>
    );
  if (look === "sterling")
    return (
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1em", alignItems: "baseline" }}>
        <div>
          <strong style={{ fontWeight: 650, fontSize: "1.06em" }}>{title}</strong>
          {(sub || meta) && <span style={{ color: "#4b5563" }}>{`  ·  ${[sub, meta].filter(Boolean).join(", ")}`}</span>}
        </div>
        <span style={{ whiteSpace: "nowrap", color: "var(--accent)", fontWeight: 600, fontSize: "0.92em" }}>{dates}</span>
      </div>
    );
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1em", alignItems: "baseline" }}>
        <div>
          <strong style={{ fontWeight: 650 }}>{title}</strong>
          {sub && <span>{look === "timeline" ? <><br />{sub}</> : `, ${sub}`}</span>}
        </div>
        {look !== "gutter" && <span style={{ whiteSpace: "nowrap", color: "#4b5563", fontSize: "0.92em" }}>{dates}</span>}
      </div>
      {meta && <div style={{ color: "#6b7280", fontSize: "0.92em" }}>{meta}</div>}
    </>
  );
}

function EntryShell({ look, dates, children }: { look: EntryStyle; dates: string; children: ReactNode }) {
  if (look === "gutter")
    return (
      <div className="resume-entry" style={{ display: "grid", gridTemplateColumns: "7.2em 1fr", gap: "1em", marginTop: gap(0.75) }}>
        <div style={{ color: "#4b5563", fontSize: "0.9em", paddingTop: "0.1em" }}>{dates}</div>
        <div>{children}</div>
      </div>
    );
  if (look === "timeline")
    return (
      <div className="resume-entry" style={{ position: "relative", paddingLeft: "1.4em", marginTop: gap(0.8) }}>
        <span style={{ position: "absolute", left: 0, top: "0.42em", width: "0.55em", height: "0.55em", borderRadius: 99, background: "var(--accent)" }} />
        <span style={{ position: "absolute", left: "0.24em", top: "1.2em", bottom: "-1em", width: 1, background: "#e5e7eb" }} />
        {children}
      </div>
    );
  return (
    <div className="resume-entry" style={{ marginTop: gap(0.8) }}>
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  const list = items.filter((b) => b.trim());
  if (!list.length) return null;
  return (
    <ul style={{ margin: `${gap(0.3)} 0 0`, paddingLeft: "1.15em", listStyle: "disc" }}>
      {list.map((b, i) => (
        <li key={i} style={{ marginTop: gap(0.15), paddingLeft: "0.15em" }}>
          <Marked text={b} />
        </li>
      ))}
    </ul>
  );
}

function Role({ e, look }: { e: ExperienceItem; look: EntryStyle }) {
  const dates = formatRange(e.start, e.end, e.current);
  return (
    <EntryShell look={look} dates={dates}>
      <EntryHead look={look} title={e.role || "Role"} sub={e.company} meta={e.location} dates={dates} />
      {e.description && <p style={{ margin: `${gap(0.2)} 0 0`, color: "#374151" }}>{e.description}</p>}
      <Bullets items={e.bullets} />
    </EntryShell>
  );
}

function School({ e, look }: { e: EducationItem; look: EntryStyle }) {
  const dates = formatRange(e.start, e.end);
  const degree = [e.degree, e.field].filter(Boolean).join(" in ").replace(/\. in /, ". ");
  return (
    <EntryShell look={look} dates={dates}>
      <EntryHead look={look} title={degree || "Degree"} sub={e.institution} dates={dates} />
      {e.details && <p style={{ margin: `${gap(0.2)} 0 0`, color: "#374151" }}>{e.details}</p>}
    </EntryShell>
  );
}

function Item({ it, look }: { it: SimpleItem; look: EntryStyle }) {
  const dates = formatMonth(it.date);
  return (
    <EntryShell look={look === "ledger" ? "inline" : look} dates={dates}>
      <EntryHead look={look === "ledger" ? "inline" : look} title={it.title} sub={it.subtitle} dates={dates} />
      {it.description && <p style={{ margin: `${gap(0.2)} 0 0`, color: "#374151" }}>{it.description}</p>}
    </EntryShell>
  );
}

function Skills({ content, style }: { content: ResumeContent; style: SkillStyle }) {
  const groups = content.skills.filter((g) => g.skills.length);
  if (style === "chips")
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4em", marginTop: gap(0.6) }}>
        {groups.flatMap((g) => g.skills).map((s, i) => (
          <span key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.1em 0.5em", fontSize: "0.92em" }}>
            {s}
          </span>
        ))}
      </div>
    );
  if (style === "grid")
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: `${gap(0.3)} 1.5em`, marginTop: gap(0.6) }}>
        {groups.flatMap((g) => g.skills).map((s, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5em", alignItems: "baseline" }}>
            <span style={{ width: "0.35em", height: "0.35em", background: "var(--accent)", flex: "none", transform: "translateY(-0.15em)" }} />
            {s}
          </div>
        ))}
      </div>
    );
  if (style === "columns")
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: `${gap(0.5)} 2em`, marginTop: gap(0.6) }}>
        {groups.map((g) => (
          <div key={g.id}>
            <div style={{ fontWeight: 650 }}>{g.name}</div>
            <div style={{ color: "#374151" }}>{g.skills.join(", ")}</div>
          </div>
        ))}
      </div>
    );
  if (style === "stack")
    return (
      <div style={{ marginTop: gap(0.5) }}>
        {groups.map((g) => (
          <div key={g.id} style={{ marginTop: gap(0.5) }}>
            <div style={{ fontWeight: 650, fontSize: "0.92em" }}>{g.name}</div>
            {g.skills.map((s, i) => (
              <div key={i} style={{ marginTop: "0.15em" }}>
                {s}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  return (
    <div style={{ marginTop: gap(0.5) }}>
      {groups.map((g) => (
        <div key={g.id} style={{ marginTop: gap(0.25) }}>
          {groups.length > 1 || g.name !== "Skills" ? <strong style={{ fontWeight: 650 }}>{g.name}: </strong> : null}
          {g.skills.join(", ")}
        </div>
      ))}
    </div>
  );
}

function SectionBody({ k, content, look }: { k: SectionKey; content: ResumeContent; look: Look }) {
  switch (k) {
    case "summary":
      return (
        <p style={{ margin: `${gap(0.5)} 0 0` }}>
          <Marked text={content.summary} />
        </p>
      );
    case "experience":
      return <>{content.experience.map((e) => <Role key={e.id} e={e} look={look.entry} />)}</>;
    case "volunteer":
      return <>{content.volunteer.map((e) => <Role key={e.id} e={e} look={look.entry} />)}</>;
    case "education":
      return <>{content.education.map((e) => <School key={e.id} e={e} look={look.entry} />)}</>;
    case "skills":
      return <Skills content={content} style={look.skills} />;
    case "languages":
      return (
        <p style={{ margin: `${gap(0.5)} 0 0` }}>
          {content.languages.map((l) => `${l.title}${l.subtitle ? ` (${l.subtitle})` : ""}`).join("  ·  ")}
        </p>
      );
    default:
      return <>{(content[k] as SimpleItem[]).map((it) => <Item key={it.id} it={it} look={look.entry} />)}</>;
  }
}

function Sections({ content, order, look, only }: { content: ResumeContent; order: SectionKey[]; look: Look; only?: SectionKey[] }) {
  return (
    <>
      {order
        .filter((k) => (only ? only.includes(k) : true) && has(content, k))
        .map((k) => (
          <section key={k} style={{ marginTop: gap(1.35) }}>
            {look.heading(k === "summary" ? "Summary" : k === "experience" ? "Experience" : SECTION_META[k].label)}
            <SectionBody k={k} content={content} look={look} />
          </section>
        ))}
    </>
  );
}

/* ---------- Templates ---------- */

function Meridian({ content, order }: DocProps) {
  const c = content.contact;
  return (
    <div style={{ padding: "var(--mv) var(--margin)" }}>
      <Name c={c} style={{ fontSize: "2.35em", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }} />
      {c.title && <div style={{ fontSize: "1.15em", color: "var(--accent)", fontWeight: 550, marginTop: "0.2em" }}>{c.title}</div>}
      <div style={{ marginTop: "0.6em", color: "#4b5563", fontSize: "0.92em", display: "flex", flexWrap: "wrap", gap: "0.2em 1.1em" }}>
        {contactItems(c).map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
      <Sections
        content={content}
        order={order}
        look={{
          entry: "inline",
          skills: "lines",
          heading: (t) => (
            <h2 style={{ fontSize: "0.95em", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", paddingBottom: "0.3em", borderBottom: "1.5px solid var(--accent)" }}>
              {t}
            </h2>
          ),
        }}
      />
    </div>
  );
}

function Ledger({ content, order }: DocProps) {
  const c = content.contact;
  return (
    <div style={{ padding: "var(--mv) var(--margin)" }}>
      <div style={{ textAlign: "center" }}>
        <Name c={c} style={{ fontSize: "2.2em", fontWeight: 600, letterSpacing: "0.01em" }} />
        {c.title && <div style={{ fontStyle: "italic", marginTop: "0.15em", fontSize: "1.05em" }}>{c.title}</div>}
        <div style={{ marginTop: "0.45em", fontSize: "0.92em" }}>{contactItems(c).join("  |  ")}</div>
      </div>
      <Sections
        content={content}
        order={order}
        look={{
          entry: "ledger",
          skills: "lines",
          heading: (t) => (
            <h2 style={{ fontSize: "1.02em", fontWeight: 600, fontVariant: "small-caps", letterSpacing: "0.08em", borderBottom: "1px solid var(--accent)", paddingBottom: "0.15em", textTransform: "lowercase" }}>
              {t}
            </h2>
          ),
        }}
      />
    </div>
  );
}

function Plain({ content, order }: DocProps) {
  const c = content.contact;
  return (
    <div style={{ padding: "var(--mv) var(--margin)" }}>
      <Name c={c} style={{ fontSize: "1.8em", fontWeight: 700 }} />
      {c.title && <div style={{ marginTop: "0.1em" }}>{c.title}</div>}
      <div style={{ marginTop: "0.35em" }}>{contactItems(c).join(" · ")}</div>
      <Sections content={content} order={order} look={{ entry: "inline", skills: "lines", heading: (t) => <h2 style={{ fontSize: "1.08em", fontWeight: 700 }}>{t}</h2> }} />
    </div>
  );
}

function Launch({ content, order }: DocProps) {
  const c = content.contact;
  // Education and projects lead for early-career resumes.
  const lead: SectionKey[] = ["summary", "education", "projects", "skills"];
  const sorted = [...lead.filter((k) => order.includes(k)), ...order.filter((k) => !lead.includes(k))];
  return (
    <div style={{ padding: "var(--mv) var(--margin)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "2em", paddingBottom: "0.8em", borderBottom: "3px solid var(--accent)" }}>
        <div>
          <Name c={c} style={{ fontSize: "2.1em", fontWeight: 750, letterSpacing: "-0.015em", lineHeight: 1.1 }} />
          {c.title && <div style={{ marginTop: "0.2em", color: "#374151" }}>{c.title}</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: "0.9em", color: "#374151", lineHeight: 1.5 }}>
          {contactItems(c).slice(0, 4).map((x) => (
            <div key={x}>{x}</div>
          ))}
        </div>
      </div>
      <Sections
        content={content}
        order={sorted}
        look={{
          entry: "inline",
          skills: "columns",
          heading: (t) => <h2 style={{ fontSize: "1.12em", fontWeight: 700, color: "var(--accent)" }}>{t}</h2>,
        }}
      />
    </div>
  );
}

function Atlas({ content, order }: DocProps) {
  const c = content.contact;
  const side: SectionKey[] = ["skills", "education", "languages", "certifications"];
  const heading = (t: string) => (
    <h2 style={{ fontSize: "0.88em", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t}</h2>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "34% 1fr", minHeight: PAGE.height }}>
      <aside style={{ background: "color-mix(in srgb, var(--accent) 7%, white)", padding: "var(--mv) 1.8em var(--mv) calc(var(--margin) * 0.75)" }}>
        <Name c={c} style={{ fontSize: "1.9em", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.01em" }} />
        {c.title && <div style={{ marginTop: "0.35em", color: "var(--accent)", fontWeight: 600 }}>{c.title}</div>}
        <div style={{ marginTop: gap(1.3), fontSize: "0.9em", lineHeight: 1.6, wordBreak: "break-word" }}>
          {contactItems(c).map((x) => (
            <div key={x}>{x}</div>
          ))}
        </div>
        <Sections content={content} order={order} only={side} look={{ entry: "inline", skills: "stack", heading }} />
      </aside>
      <main style={{ padding: "var(--mv) calc(var(--margin) * 0.8) var(--mv) 2em" }}>
        <Sections content={content} order={order.filter((k) => !side.includes(k))} look={{ entry: "inline", skills: "lines", heading }} />
      </main>
    </div>
  );
}

function Sterling({ content, order }: DocProps) {
  const c = content.contact;
  return (
    <div>
      <header style={{ background: "var(--accent)", color: "white", padding: "calc(var(--margin) * 0.8) var(--margin)" }}>
        <Name c={c} style={{ fontSize: "2.4em", fontWeight: 650, letterSpacing: "-0.01em", lineHeight: 1.1 }} />
        {c.title && <div style={{ fontSize: "1.15em", opacity: 0.85, marginTop: "0.2em" }}>{c.title}</div>}
        <div style={{ marginTop: "0.8em", fontSize: "0.92em", opacity: 0.9, display: "flex", flexWrap: "wrap", gap: "0.2em 1.2em" }}>
          {contactItems(c).map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
      </header>
      <div style={{ padding: "0 var(--margin) var(--mv)" }}>
        {content.summary && (
          <p style={{ fontSize: "1.12em", lineHeight: 1.5, marginTop: gap(1.4), color: "#111827" }}>
            <Marked text={content.summary} />
          </p>
        )}
        <Sections
          content={content}
          order={order.filter((k) => k !== "summary")}
          look={{
            entry: "sterling",
            skills: "grid",
            heading: (t) => (
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.8em", fontSize: "0.95em", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {t === "Skills" ? "Core competencies" : t}
                <span style={{ flex: 1, height: 1, background: "#d1d5db" }} />
              </h2>
            ),
          }}
        />
      </div>
    </div>
  );
}

function Scholar({ content, order }: DocProps) {
  const c = content.contact;
  return (
    <div style={{ padding: "var(--mv) var(--margin)" }}>
      <Name c={c} style={{ fontSize: "2.3em", fontWeight: 500, letterSpacing: "0.005em" }} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: "2em", marginTop: "0.3em", paddingBottom: "0.6em", borderBottom: "1px solid #d1d5db" }}>
        <div style={{ fontStyle: "italic" }}>{c.title}</div>
        <div style={{ textAlign: "right", fontSize: "0.92em" }}>{contactItems(c).join(" · ")}</div>
      </div>
      <Sections
        content={content}
        order={order}
        look={{
          entry: "gutter",
          skills: "lines",
          heading: (t) => <h2 style={{ fontSize: "1.2em", fontWeight: 600, color: "var(--accent)" }}>{t}</h2>,
        }}
      />
    </div>
  );
}

function Canvas({ content, order }: DocProps) {
  const c = content.contact;
  return (
    <div style={{ padding: "var(--mv) var(--margin)" }}>
      <div style={{ display: "flex", gap: "1.3em", alignItems: "center" }}>
        <div style={{ width: "4.2em", height: "4.2em", borderRadius: 999, background: "var(--accent)", color: "white", display: "grid", placeItems: "center", fontSize: "1.25em", fontWeight: 700, flex: "none", letterSpacing: "0.02em" }}>
          {initials(c.fullName || "Your Name")}
        </div>
        <div>
          <Name c={c} style={{ fontSize: "2.2em", fontWeight: 750, letterSpacing: "-0.025em", lineHeight: 1.05 }} />
          {c.title && <div style={{ color: "var(--accent)", fontWeight: 600, marginTop: "0.2em" }}>{c.title}</div>}
        </div>
      </div>
      <div style={{ marginTop: "0.9em", fontSize: "0.92em", color: "#4b5563", display: "flex", flexWrap: "wrap", gap: "0.2em 1.1em" }}>
        {contactItems(c).map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
      <Sections
        content={content}
        order={order}
        look={{
          entry: "timeline",
          skills: "chips",
          heading: (t) => <h2 style={{ fontSize: "1.25em", fontWeight: 750, letterSpacing: "-0.01em" }}>{t}</h2>,
        }}
      />
    </div>
  );
}

const TEMPLATES: Record<string, (p: DocProps) => ReactNode> = {
  meridian: Meridian,
  ledger: Ledger,
  atlas: Atlas,
  plain: Plain,
  sterling: Sterling,
  scholar: Scholar,
  canvas: Canvas,
  launch: Launch,
};

/** A full-size Letter page (816px wide). Scale it with <ScaledPaper>. */
export function ResumeDocument(props: DocProps & { className?: string }) {
  const { design } = props;
  const T = TEMPLATES[design.templateId] ?? Meridian;
  const style = {
    width: PAGE.width,
    minHeight: PAGE.height,
    fontFamily: FONTS[design.font].css,
    fontSize: `${design.fontSize}px`,
    lineHeight: 1.45,
    color: "#1f2937",
    background: "white",
    "--accent": design.accent,
    "--gap": SPACING[design.spacing],
    "--margin": `${MARGINS[design.margins]}px`,
    "--mv": `${MARGINS[design.margins]}px`,
  } as CSSProperties;
  return (
    <div className={`resume-paper ${props.className ?? ""}`} style={style}>
      <Marks.Provider value={props.marks}>
        <T {...props} />
      </Marks.Provider>
    </div>
  );
}
