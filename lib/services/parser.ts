import type { EducationItem, ExperienceItem, ResumeContent, SectionKey, SimpleItem, SkillGroup } from "../types";
import { emptyContent } from "../content";
import { uid } from "../utils";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

export function validateFile(file: File): string | null {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext !== "pdf" && ext !== "docx") return "Upload a PDF or DOCX file. Other formats, including .doc, are not supported.";
  if (file.size > MAX_FILE_BYTES) return `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`;
  if (file.size === 0) return "This file is empty.";
  return null;
}

/** Extract plain text from a PDF or DOCX in the browser. */
export async function extractText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  if (file.name.toLowerCase().endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const res = await mammoth.extractRawText({ arrayBuffer: buf });
    return res.value.replace(/\n{3,}/g, "\n\n");
  }
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let line = "";
    const lines: string[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = "";
      }
    }
    if (line) lines.push(line);
    pages.push(lines.join("\n"));
  }
  return pages.join("\n");
}

const HEADINGS: [SectionKey | "skip", RegExp][] = [
  ["summary", /^(professional )?(summary|profile|about( me)?|objective|career objective|overview)$/i],
  ["experience", /^(work |professional |relevant )?(experience|employment( history)?|work history|career history)$/i],
  ["education", /^(education|academic background|education and training|qualifications)$/i],
  ["skills", /^((technical|core|key) )?(skills|competencies|expertise|technologies|tools)( and (tools|technologies))?$/i],
  ["certifications", /^(certifications?|licenses?( and certifications)?|courses)$/i],
  ["projects", /^((selected|personal|side) )?projects$/i],
  ["languages", /^languages?$/i],
  ["awards", /^(awards|honors|honours|achievements|awards and honors)$/i],
  ["volunteer", /^(volunteer(ing)?( experience| work)?|community( involvement)?|leadership and volunteering)$/i],
  ["skip", /^(references|interests|hobbies)$/i],
];

const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const DATE = `(?:${MONTH}\\s+\\d{4}|\\d{1,2}/\\d{4}|\\d{4})`;
const RANGE = new RegExp(`(${DATE})\\s*(?:-|–|—|to)\\s*(${DATE}|present|current|now)`, "i");
const SINGLE = new RegExp(`(${DATE})`, "i");
const BULLET = /^\s*(?:[•●▪◦‣∙·*-]|\d+\.)\s+/;
const MONTHS: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };

function toMonth(raw: string): string {
  const s = raw.trim().toLowerCase();
  const m = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})$/.exec(s);
  if (m) return `${m[2]}-${MONTHS[m[1]!.slice(0, 3)]}`;
  const n = /^(\d{1,2})\/(\d{4})$/.exec(s);
  if (n) return `${n[2]}-${n[1]!.padStart(2, "0")}`;
  if (/^\d{4}$/.test(s)) return `${s}-01`;
  return "";
}

/** Turn extracted resume text into structured content. Heuristic: good enough to edit from. */
export function parseResumeText(raw: string): { content: ResumeContent; order: SectionKey[] } {
  const content = emptyContent();
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // Header: everything before the first recognized heading.
  const blocks: { key: SectionKey | "skip" | "header"; lines: string[] }[] = [{ key: "header", lines: [] }];
  for (const l of lines) {
    const clean = l.replace(/[:|]+$/, "").trim();
    const h = clean.length < 48 ? HEADINGS.find(([, re]) => re.test(clean)) : undefined;
    if (h) blocks.push({ key: h[0], lines: [] });
    else blocks[blocks.length - 1]!.lines.push(l);
  }

  const header = blocks[0]!.lines;
  const all = raw;
  content.contact.email = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(all)?.[0] ?? "";
  content.contact.phone = /(\+?\(?\d[\d\s().-]{8,}\d)/.exec(header.join(" "))?.[0]?.trim() ?? "";
  content.contact.linkedin = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+\/?/i.exec(all)?.[0] ?? "";
  const urls = all.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|io|dev|me|net|org|design|co)(?:\/[\w./-]*)?/gi) ?? [];
  const other = urls.filter((u) => !/linkedin|@/i.test(u) && !content.contact.email.includes(u));
  content.contact.portfolio = other.find((u) => /github|behance|dribbble|portfolio/i.test(u)) ?? "";
  content.contact.website = other.find((u) => u !== content.contact.portfolio) ?? "";

  const nameLine = header.find((l) => /^[A-Za-zÀ-ÿ'’.-]+(\s+[A-Za-zÀ-ÿ'’.-]+){1,3}$/.test(l) && !/@|\d/.test(l));
  content.contact.fullName = nameLine ?? "";
  const rest = header.filter((l) => l !== nameLine && !/@|\d{3}|linkedin|https?:|www\./i.test(l));
  content.contact.title = rest.find((l) => l.length < 60 && !/,\s*[A-Z]{2}$/.test(l)) ?? "";
  content.contact.location =
    header
      .join(" | ")
      .split(/\s*[|•·]\s*/)
      .find((p) => /^[A-Z][a-zA-Z .'-]+,\s*[A-Z][A-Za-z]+/.test(p) && p.length < 40 && !/@/.test(p)) ?? "";

  const order: SectionKey[] = [];
  for (const b of blocks.slice(1)) {
    if (b.key === "skip" || b.key === "header") continue;
    if (!order.includes(b.key)) order.push(b.key);
    switch (b.key) {
      case "summary":
        content.summary = [content.summary, b.lines.join(" ")].filter(Boolean).join(" ");
        break;
      case "experience":
      case "volunteer":
        content[b.key].push(...parseRoles(b.lines));
        break;
      case "education":
        content.education.push(...parseEducation(b.lines));
        break;
      case "skills":
        content.skills.push(...parseSkills(b.lines));
        break;
      default:
        content[b.key].push(...parseSimple(b.lines));
    }
  }

  // No headings at all: treat the text as a summary so nothing is lost.
  if (!order.length && header.length > 3) {
    content.summary = header.filter((l) => l !== nameLine).slice(0, 6).join(" ");
    order.push("summary");
  }
  return { content, order };
}

function splitTitle(s: string): [string, string, string] {
  const clean = s.replace(/\s*[|,–—-]\s*$/, "").trim();
  const parts = clean.split(/\s+(?:at|@)\s+|\s*[|–—]\s*|\s+-\s+|,\s+/).filter(Boolean);
  return [parts[0] ?? "", parts[1] ?? "", parts[2] ?? ""];
}

function parseRoles(lines: string[]): ExperienceItem[] {
  const items: ExperienceItem[] = [];
  let cur: ExperienceItem | null = null;
  let pendingTitle: string[] = [];
  for (const l of lines) {
    const range = RANGE.exec(l);
    if (range) {
      const before = l.slice(0, range.index).trim();
      const after = l.slice(range.index + range[0].length).trim();
      const titleSource = before || pendingTitle.join(" | ") || after;
      const [role, company, location] = splitTitle(titleSource);
      const endRaw = range[2]!.toLowerCase();
      cur = {
        id: uid("exp"),
        role: role || pendingTitle[0] || "",
        company: company || pendingTitle[1] || "",
        location: location || (after && after !== titleSource ? after : ""),
        employmentType: "Full-time",
        start: toMonth(range[1]!),
        end: /present|current|now/.test(endRaw) ? "" : toMonth(range[2]!),
        current: /present|current|now/.test(endRaw),
        description: "",
        bullets: [],
      };
      items.push(cur);
      pendingTitle = [];
      continue;
    }
    if (BULLET.test(l)) {
      if (cur) cur.bullets.push(l.replace(BULLET, ""));
      continue;
    }
    if (cur && cur.bullets.length && /^[a-z(]/.test(l)) {
      cur.bullets[cur.bullets.length - 1] += ` ${l}`; // wrapped line
      continue;
    }
    if (cur && l.split(" ").length > 7) {
      cur.bullets.push(l);
      continue;
    }
    pendingTitle.push(l);
    if (pendingTitle.length > 2) pendingTitle.shift();
  }
  return items;
}

function parseEducation(lines: string[]): EducationItem[] {
  const items: EducationItem[] = [];
  let cur: EducationItem | null = null;
  const DEGREE = /\b(bachelor|master|b\.?s\.?c?|b\.?a\.?|m\.?s\.?c?|m\.?a\.?|mba|ph\.?d|associate|diploma|certificate|bsc|msc|beng|meng)\b/i;
  const SCHOOL = /\b(university|college|institute|school|academy|polytechnic)\b/i;
  for (const l of lines) {
    const range = RANGE.exec(l) ?? SINGLE.exec(l);
    const text = range ? (l.slice(0, range.index) + l.slice(range.index + range[0].length)).replace(/[|,–—-]\s*$/, "").trim() : l;
    if (SCHOOL.test(text) || !cur) {
      if (!cur || (cur.institution && SCHOOL.test(text))) {
        cur = { id: uid("edu"), institution: "", degree: "", field: "", start: "", end: "", details: "" };
        items.push(cur);
      }
    }
    if (range) {
      if (range[2]) {
        cur.start = toMonth(range[1]!);
        cur.end = /present|current/i.test(range[2]) ? "" : toMonth(range[2]);
      } else cur.end = toMonth(range[1]!);
    }
    for (const part of text.split(/\s*[|,–—]\s*/).filter(Boolean)) {
      const deg = DEGREE.exec(part);
      if (SCHOOL.test(part) && !cur.institution) cur.institution = part;
      else if (deg && !cur.degree) {
        const [d, field] = part.split(/\s+in\s+/);
        if (field) {
          cur.degree = d!;
          cur.field = field;
        } else {
          // "B.A. Economics" -> degree "B.A.", field "Economics"
          const end = deg.index + deg[0].length + (part[deg.index + deg[0].length] === "." ? 1 : 0);
          cur.degree = part.slice(0, end).trim();
          cur.field = part.slice(end).replace(/^\s*(of|in)\s+/i, "").trim();
        }
      } else if (cur.institution && cur.degree) cur.details = [cur.details, part.replace(BULLET, "")].filter(Boolean).join(", ");
      else if (!cur.institution && !SCHOOL.test(part) && !deg) cur.details = [cur.details, part].filter(Boolean).join(", ");
    }
  }
  return items.filter((e) => e.institution || e.degree);
}

function parseSkills(lines: string[]): SkillGroup[] {
  const groups: SkillGroup[] = [];
  const loose: string[] = [];
  for (const l of lines) {
    const m = /^([A-Za-z &/]{2,30}):\s*(.+)$/.exec(l.replace(BULLET, ""));
    const items = (m ? m[2]! : l.replace(BULLET, "")).split(/\s*[,|•·;]\s*/).map((s) => s.trim()).filter((s) => s && s.length < 40);
    if (m) groups.push({ id: uid("sk"), name: m[1]!.trim(), skills: items });
    else loose.push(...items);
  }
  if (loose.length) groups.push({ id: uid("sk"), name: groups.length ? "Other" : "Skills", skills: loose });
  return groups;
}

function parseSimple(lines: string[]): SimpleItem[] {
  const items: SimpleItem[] = [];
  for (const l of lines) {
    const clean = l.replace(BULLET, "");
    const date = SINGLE.exec(clean);
    const text = date ? clean.replace(date[0], "").replace(/[|,–—(-]\s*\)?\s*$/, "").trim() : clean;
    if (!BULLET.test(l) && items.length && /^[a-z]/.test(clean)) {
      items[items.length - 1]!.description += ` ${clean}`;
      continue;
    }
    const [title, subtitle] = text.split(/\s*[|–—]\s*|\s+-\s+|,\s+/);
    items.push({ id: uid("it"), title: title ?? text, subtitle: subtitle ?? "", date: date?.[0] ?? "", description: "" });
  }
  return items;
}
