import type { Density, FontKey, ResumeDesign, SectionKey } from "./types";

export const SECTION_META: Record<SectionKey, { label: string; hint: string }> = {
  summary: { label: "Professional Summary", hint: "Two to four sentences on who you are and what you bring." },
  experience: { label: "Work Experience", hint: "Roles, dates and achievement bullets." },
  education: { label: "Education", hint: "Degrees, institutions and graduation dates." },
  skills: { label: "Skills", hint: "Grouped by category so recruiters can scan them." },
  certifications: { label: "Certifications", hint: "Issuer and date for each credential." },
  projects: { label: "Projects", hint: "Work that shows what you can build." },
  languages: { label: "Languages", hint: "Language and proficiency." },
  awards: { label: "Awards", hint: "Recognition with the year received." },
  volunteer: { label: "Volunteer Experience", hint: "Unpaid roles that show skills or values." },
};

export const ALL_SECTIONS: SectionKey[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "certifications",
  "projects",
  "languages",
  "awards",
  "volunteer",
];

export const DEFAULT_ORDER: SectionKey[] = ["summary", "experience", "skills", "education", "projects", "certifications"];

export type TemplateCategory =
  | "Modern"
  | "Professional"
  | "Minimal"
  | "Executive"
  | "Academic"
  | "Creative"
  | "Entry-Level";

export interface TemplateMeta {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  ats: boolean;
  defaults: Pick<ResumeDesign, "font" | "accent" | "fontSize">;
  free: boolean;
}

export const TEMPLATES: TemplateMeta[] = [
  { id: "meridian", name: "Meridian", category: "Modern", description: "Single column with accent headings. Balanced and easy to scan.", ats: true, defaults: { font: "geist", accent: "#2563eb", fontSize: 13 }, free: true },
  { id: "ledger", name: "Ledger", category: "Professional", description: "Centered serif header and ruled sections. A classic for finance, law and consulting.", ats: true, defaults: { font: "source-serif", accent: "#1f2937", fontSize: 13.5 }, free: true },
  { id: "atlas", name: "Atlas", category: "Professional", description: "Tinted side column for contact, skills and education; experience gets the width.", ats: false, defaults: { font: "inter", accent: "#0f766e", fontSize: 12.5 }, free: false },
  { id: "plain", name: "Plain", category: "Minimal", description: "No colour, no columns. The safest choice for strict applicant tracking systems.", ats: true, defaults: { font: "inter", accent: "#111827", fontSize: 13 }, free: true },
  { id: "sterling", name: "Sterling", category: "Executive", description: "Full-width header band and a core competencies grid for senior leaders.", ats: false, defaults: { font: "geist", accent: "#1e3a5f", fontSize: 13 }, free: false },
  { id: "scholar", name: "Scholar", category: "Academic", description: "CV layout with dates in a left gutter. Built for research and teaching roles.", ats: true, defaults: { font: "garamond", accent: "#7c2d12", fontSize: 14 }, free: false },
  { id: "canvas", name: "Canvas", category: "Creative", description: "Monogram header and a timeline for experience. For design and media roles.", ats: false, defaults: { font: "geist", accent: "#be185d", fontSize: 12.5 }, free: false },
  { id: "launch", name: "Launch", category: "Entry-Level", description: "Education and projects first, compact skills grid. Made for a first job.", ats: true, defaults: { font: "inter", accent: "#2563eb", fontSize: 13 }, free: true },
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "Modern",
  "Professional",
  "Minimal",
  "Executive",
  "Academic",
  "Creative",
  "Entry-Level",
];

export function getTemplate(id: string) {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;
}

export const FONTS: Record<FontKey, { label: string; css: string }> = {
  geist: { label: "Geist", css: "var(--font-geist-sans), Arial, sans-serif" },
  inter: { label: "Inter", css: "var(--font-inter), Arial, sans-serif" },
  "source-serif": { label: "Source Serif", css: "var(--font-source-serif), Georgia, serif" },
  garamond: { label: "EB Garamond", css: "var(--font-garamond), Garamond, Georgia, serif" },
};

export const ACCENTS = ["#2563eb", "#0f766e", "#1e3a5f", "#7c2d12", "#be185d", "#4d7c0f", "#111827"];

export const SPACING: Record<Density, number> = { compact: 0.78, normal: 1, relaxed: 1.22 };
export const MARGINS: Record<Density, number> = { compact: 40, normal: 56, relaxed: 72 };

/** Letter paper at 96dpi. */
export const PAGE = { width: 816, height: 1056 };

export function designFor(templateId: string): ResumeDesign {
  const t = getTemplate(templateId);
  return { templateId: t.id, ...t.defaults, spacing: "normal", margins: "normal" };
}

export const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    monthly: 0,
    yearly: 0,
    blurb: "For a first look at where your resume stands.",
    features: ["Basic resume analysis", "One active resume", "4 resume templates", "Basic improvement suggestions"],
  },
  {
    id: "pro" as const,
    name: "Pro",
    monthly: 12,
    yearly: 96,
    blurb: "For an active job search across several roles.",
    features: [
      "Advanced resume analysis",
      "Up to 10 resumes",
      "All 8 templates",
      "AI writing assistance",
      "Job description matching",
      "PDF downloads",
    ],
  },
  {
    id: "premium" as const,
    name: "Premium",
    monthly: 24,
    yearly: 192,
    blurb: "For senior searches and frequent tailoring.",
    features: [
      "Everything in Pro",
      "Advanced optimization",
      "Unlimited resume versions",
      "Extended AI assistance",
      "Cover letter and interview prep tools",
    ],
  },
];

export const PLAN_LIMITS = {
  free: { resumes: 1, matches: 3, ai: 10 },
  pro: { resumes: 10, matches: 50, ai: 300 },
  premium: { resumes: Infinity, matches: Infinity, ai: 1000 },
};

type Cell = string | boolean;
export const COMPARISON: { group: string; rows: { label: string; values: [Cell, Cell, Cell] }[] }[] = [
  {
    group: "Analysis",
    rows: [
      { label: "Resume score and category breakdown", values: [true, true, true] },
      { label: "ATS compatibility checks", values: ["Basic", true, true] },
      { label: "Keyword analysis", values: [false, true, true] },
      { label: "Re-analysis with score comparison", values: ["1 per month", "Unlimited", "Unlimited"] },
    ],
  },
  {
    group: "Building",
    rows: [
      { label: "Active resumes", values: ["1", "10", "Unlimited"] },
      { label: "Resume templates", values: ["4", "8", "8"] },
      { label: "Version history", values: ["3 versions", "20 versions", "Unlimited"] },
      { label: "PDF download", values: [false, true, true] },
    ],
  },
  {
    group: "AI and tailoring",
    rows: [
      { label: "AI writing suggestions", values: ["10 per month", "300 per month", "1,000 per month"] },
      { label: "Job description matching", values: ["3 per month", "50 per month", "Unlimited"] },
      { label: "Cover letter and interview prep", values: [false, false, true] },
    ],
  },
];

export const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Marketing and media",
  "Consulting",
  "Retail and e-commerce",
  "Manufacturing",
  "Government and nonprofit",
  "Other",
];

export const CAREER_STAGES = [
  { id: "student", label: "Student", hint: "Studying, looking for internships or part-time work" },
  { id: "graduate", label: "Recent graduate", hint: "Graduated in the last two years" },
  { id: "entry", label: "Entry-level professional", hint: "Up to 3 years of experience" },
  { id: "mid", label: "Mid-level professional", hint: "3 to 8 years of experience" },
  { id: "senior", label: "Senior professional", hint: "8+ years, leading people or programs" },
  { id: "changer", label: "Career changer", hint: "Moving into a new field" },
] as const;
