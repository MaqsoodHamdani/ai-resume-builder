export type SectionKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "projects"
  | "languages"
  | "awards"
  | "volunteer";

export interface Contact {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  website: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  employmentType: string;
  start: string; // "YYYY-MM"
  end: string; // "YYYY-MM" or "" when current
  current: boolean;
  description: string;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start: string;
  end: string;
  details: string;
}

export interface SkillGroup {
  id: string;
  name: string;
  skills: string[];
}

/** Certifications, projects, languages and awards share one shape. */
export interface SimpleItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
}

export interface ResumeContent {
  contact: Contact;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  certifications: SimpleItem[];
  projects: SimpleItem[];
  languages: SimpleItem[];
  awards: SimpleItem[];
  volunteer: ExperienceItem[];
}

export type FontKey = "geist" | "inter" | "source-serif" | "garamond";
export type Density = "compact" | "normal" | "relaxed";

export interface ResumeDesign {
  templateId: string;
  font: FontKey;
  fontSize: number; // body size in px at 816px page width
  accent: string;
  spacing: Density;
  margins: Density;
}

export interface ResumeVersion {
  id: string;
  label: string;
  createdAt: string;
  score?: number;
  content: ResumeContent;
}

export type ResumeSource = "upload" | "builder" | "duplicate" | "tailored" | "paste";

export interface Resume {
  id: string;
  name: string;
  targetRole: string;
  content: ResumeContent;
  sectionOrder: SectionKey[];
  design: ResumeDesign;
  source: ResumeSource;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
  versions: ResumeVersion[];
}

export type CategoryKey =
  | "ats"
  | "content"
  | "experience"
  | "skills"
  | "summary"
  | "formatting"
  | "impact";

export interface CategoryScore {
  key: CategoryKey;
  label: string;
  score: number;
  note: string;
}

export type Severity = "high" | "medium" | "low";

export interface Finding {
  id: string;
  category: CategoryKey;
  severity: Severity;
  title: string;
  explanation: string;
  why: string;
  suggestion: string;
  section: SectionKey | "contact";
  before?: string;
  after?: string;
}

export interface Check {
  label: string;
  pass: boolean;
  detail: string;
}

export interface WeakBullet {
  text: string;
  where: string;
  reasons: string[];
}

export interface AnalysisReport {
  id: string;
  resumeId: string;
  createdAt: string;
  targetRole: string;
  score: number;
  categories: CategoryScore[];
  strengths: string[];
  findings: Finding[];
  ats: Check[];
  keywords: {
    found: string[];
    missing: string[];
    repeated: { term: string; count: number }[];
  };
  experience: {
    bulletCount: number;
    withMetrics: number;
    strongVerbs: number;
    weakBullets: WeakBullet[];
  };
  education: Check[];
  previous?: {
    score: number;
    createdAt: string;
    categories: Partial<Record<CategoryKey, number>>;
  };
}

export interface JobMatch {
  id: string;
  resumeId: string;
  jobTitle: string;
  company: string;
  description: string;
  createdAt: string;
  score: number;
  saved: boolean;
  keywords: { matched: string[]; missing: string[]; important: string[]; additional: string[] };
  skills: { found: string[]; missing: string[]; highlight: string[] };
  experience: { relevant: string[]; gaps: string[]; suggestions: string[] };
  suggestions: { title: string; detail: string; section: SectionKey }[];
}

export type ActivityKind =
  | "upload"
  | "analysis"
  | "update"
  | "version"
  | "create"
  | "match"
  | "duplicate"
  | "delete";

export interface Activity {
  id: string;
  kind: ActivityKind;
  text: string;
  resumeId?: string;
  at: string;
}

export type Plan = "free" | "pro" | "premium";
export type CareerStage =
  | "student"
  | "graduate"
  | "entry"
  | "mid"
  | "senior"
  | "changer";

export interface User {
  name: string;
  email: string;
  avatar?: string;
  careerStage: CareerStage;
  industry: string;
  targetRole: string;
  plan: Plan;
  billingCycle: "monthly" | "yearly";
  onboarded: boolean;
  preferences: {
    defaultTemplate: string;
    notifications: { analysis: boolean; tips: boolean; weekly: boolean; product: boolean };
    compactTables: boolean;
  };
}
