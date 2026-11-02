import type { ResumeContent } from "../types";

/** Skill vocabularies by role family. Used for relevance scoring and job-description extraction. */
export const ROLE_FAMILIES: { id: string; match: RegExp; label: string; skills: string[] }[] = [
  {
    id: "frontend",
    match: /front[\s-]?end|web developer|react|ui engineer|javascript/i,
    label: "frontend engineering",
    skills: ["React", "TypeScript", "JavaScript", "Next.js", "CSS", "HTML", "Accessibility", "Web performance", "Testing", "Jest", "GraphQL", "REST APIs", "Design systems", "CI/CD", "Git"],
  },
  {
    id: "backend",
    match: /back[\s-]?end|platform engineer|api|server|devops|site reliability|sre|infrastructure/i,
    label: "backend engineering",
    skills: ["Node.js", "Python", "Java", "Go", "SQL", "PostgreSQL", "REST APIs", "Microservices", "AWS", "Docker", "Kubernetes", "Redis", "System design", "CI/CD", "Observability"],
  },
  {
    id: "fullstack",
    match: /full[\s-]?stack|software engineer|software developer|product engineer|developer/i,
    label: "software engineering",
    skills: ["TypeScript", "JavaScript", "React", "Node.js", "SQL", "PostgreSQL", "REST APIs", "AWS", "Docker", "Testing", "CI/CD", "System design", "Git", "Agile"],
  },
  {
    id: "data",
    match: /data|analytics|machine learning|ml engineer|scientist|bi analyst/i,
    label: "data and analytics",
    skills: ["Python", "SQL", "Pandas", "Machine learning", "Statistics", "Tableau", "Power BI", "Spark", "A/B testing", "dbt", "ETL", "Data modeling", "Excel"],
  },
  {
    id: "design",
    match: /design|ux|ui\b|product designer|researcher/i,
    label: "product design",
    skills: ["Figma", "User research", "Prototyping", "Design systems", "Interaction design", "Usability testing", "Accessibility", "Wireframing", "Visual design", "Information architecture"],
  },
  {
    id: "manager",
    match: /engineering manager|head of|director|vp|team lead|tech lead|manager, engineering/i,
    label: "engineering leadership",
    skills: ["Hiring", "Mentoring", "Roadmap planning", "Stakeholder management", "Agile", "Performance reviews", "Delivery", "Budget", "Cross-functional leadership", "Strategy", "Coaching", "System design"],
  },
  {
    id: "product",
    match: /product manager|product owner|\bpm\b|program manager/i,
    label: "product management",
    skills: ["Roadmap planning", "Stakeholder management", "User research", "Prioritization", "A/B testing", "Product analytics", "Agile", "Go-to-market", "OKRs", "SQL", "Jira", "Product discovery"],
  },
  {
    id: "marketing",
    match: /marketing|growth|content|seo|brand|communications|social media/i,
    label: "marketing",
    skills: ["SEO", "Content strategy", "Google Analytics", "Campaign management", "Paid social", "Email marketing", "HubSpot", "Brand strategy", "Conversion rate optimization", "Copywriting", "Marketing automation"],
  },
  {
    id: "sales",
    match: /sales|account executive|business development|account manager|customer success/i,
    label: "sales",
    skills: ["Pipeline management", "Salesforce", "Quota attainment", "Negotiation", "Prospecting", "CRM", "Account management", "Forecasting", "Solution selling"],
  },
  {
    id: "finance",
    match: /financ|accountant|accounting|analyst|controller|audit/i,
    label: "finance",
    skills: ["Financial modeling", "Excel", "Forecasting", "Budgeting", "GAAP", "Variance analysis", "SQL", "Power BI", "Reconciliation", "FP&A"],
  },
];

export const GENERAL_SKILLS = ["Communication", "Project management", "Leadership", "Problem solving", "Stakeholder management", "Excel", "Data analysis", "Collaboration"];

/** Every term we know how to spot in a job description. */
export const KNOWN_SKILLS = Array.from(
  new Set([
    ...ROLE_FAMILIES.flatMap((f) => f.skills),
    ...GENERAL_SKILLS,
    "Vue", "Angular", "Svelte", "Tailwind CSS", "Redux", "Webpack", "Vite", "Storybook", "Playwright", "Cypress",
    "C#", "C++", "Rust", "Ruby", "Rails", "PHP", "Kotlin", "Swift", "iOS", "Android", "React Native",
    "GCP", "Azure", "Terraform", "Kafka", "MongoDB", "MySQL", "Elasticsearch", "Linux", "Security",
    "Product strategy", "Mentoring", "Code review", "Scrum", "Kanban", "Customer research", "Experimentation",
    "Communication", "Leadership", "Payments", "Fintech", "Compliance", "Healthcare", "E-commerce",
    "Sketch", "Adobe Creative Suite", "Motion design", "Branding", "Illustration",
    "Data visualization", "Looker", "Snowflake", "BigQuery", "Airflow", "TensorFlow", "PyTorch", "NLP", "LLMs",
  ]),
);

const ALIASES: Record<string, string[]> = {
  "Next.js": ["nextjs", "next js"],
  "Node.js": ["nodejs", "node"],
  JavaScript: ["js", "es6"],
  TypeScript: ["ts"],
  "Web performance": ["performance", "core web vitals", "page speed"],
  Accessibility: ["a11y", "wcag"],
  "REST APIs": ["restful", "rest api", "api design"],
  "CI/CD": ["continuous integration", "github actions", "ci pipelines"],
  Testing: ["unit tests", "integration tests", "test coverage"],
  Kubernetes: ["k8s"],
  PostgreSQL: ["postgres"],
  "Machine learning": ["ml"],
  "A/B testing": ["ab testing", "experiments", "experimentation"],
  "Stakeholder management": ["stakeholders"],
  Mentoring: ["mentored", "mentorship", "coached"],
  Hiring: ["hired", "recruiting", "interviewing"],
  "Roadmap planning": ["roadmap", "roadmaps"],
  "Design systems": ["design system", "component library"],
  "Cross-functional leadership": ["cross-functional"],
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const termCache = new Map<string, RegExp>();
export function termRegex(term: string) {
  let re = termCache.get(term);
  if (!re) {
    const variants = [term, ...(ALIASES[term] ?? [])].map(escapeRegex).join("|");
    re = new RegExp(`(?<![a-z0-9])(?:${variants})(?![a-z0-9+#])`, "i");
    termCache.set(term, re);
  }
  return re;
}

export function hasTerm(text: string, term: string) {
  return termRegex(term).test(text);
}

export function familyFor(role: string) {
  return ROLE_FAMILIES.find((f) => f.match.test(role));
}

export function skillsForRole(role: string) {
  return familyFor(role)?.skills ?? GENERAL_SKILLS;
}

export const STRONG_VERBS = [
  "accelerated", "achieved", "architected", "automated", "built", "championed", "consolidated", "created", "cut", "decreased",
  "delivered", "designed", "developed", "directed", "doubled", "drove", "eliminated", "engineered", "established", "expanded",
  "generated", "grew", "implemented", "improved", "increased", "introduced", "launched", "led", "managed", "mentored",
  "migrated", "modernized", "negotiated", "optimized", "orchestrated", "overhauled", "owned", "partnered", "pioneered", "produced",
  "rebuilt", "redesigned", "reduced", "refactored", "resolved", "restructured", "saved", "scaled", "secured", "shipped",
  "simplified", "spearheaded", "streamlined", "strengthened", "taught", "trained", "transformed", "tripled", "unified", "won",
  "wrote", "analyzed", "coordinated", "authored", "facilitated", "guided", "hired", "organized", "planned", "presented",
  "published", "researched", "supervised", "tested", "translated", "coached", "closed", "converted", "audited", "forecasted",
  "conducted", "collaborated", "prototyped", "defined", "standardized", "instrumented", "maintained", "earned", "raised",
];

export const WEAK_OPENERS: { pattern: RegExp; label: string }[] = [
  { pattern: /^responsible for\b/i, label: "Opens with “Responsible for”" },
  { pattern: /^(worked|working) on\b/i, label: "Opens with “Worked on”" },
  { pattern: /^helped\b/i, label: "Opens with “Helped”" },
  { pattern: /^assisted\b/i, label: "Opens with “Assisted”" },
  { pattern: /^duties included\b/i, label: "Opens with “Duties included”" },
  { pattern: /^(was )?involved in\b/i, label: "Opens with “Involved in”" },
  { pattern: /^participated in\b/i, label: "Opens with “Participated in”" },
  { pattern: /^tasked with\b/i, label: "Opens with “Tasked with”" },
  { pattern: /^handled\b/i, label: "Opens with “Handled”" },
  { pattern: /^did\b/i, label: "Opens with “Did”" },
];

export const CLICHES = [
  "team player", "hard-working", "hardworking", "detail-oriented", "go-getter", "results-driven", "self-starter",
  "think outside the box", "synergy", "dynamic", "passionate", "motivated individual", "fast learner", "proven track record",
];

export const METRIC = /\d|%|\$|£|€|\b(doubled|tripled|halved)\b/i;

export function firstWord(text: string) {
  return (text.trim().split(/\s+/)[0] ?? "").toLowerCase().replace(/[^a-z-]/g, "");
}

export function startsStrong(text: string) {
  return STRONG_VERBS.includes(firstWord(text));
}

export function weakOpener(text: string) {
  return WEAK_OPENERS.find((w) => w.pattern.test(text.trim()));
}

export function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** All prose in the resume, for keyword detection. */
export function resumeText(c: ResumeContent) {
  return [
    c.contact.title,
    c.summary,
    ...c.experience.flatMap((e) => [e.role, e.company, e.description, ...e.bullets]),
    ...c.education.flatMap((e) => [e.degree, e.field, e.institution, e.details]),
    ...c.skills.flatMap((g) => [g.name, ...g.skills]),
    ...c.projects.flatMap((p) => [p.title, p.subtitle, p.description]),
    ...c.certifications.flatMap((p) => [p.title, p.subtitle]),
    ...c.volunteer.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...c.awards.flatMap((a) => [a.title, a.description]),
  ]
    .filter(Boolean)
    .join("\n");
}

export function allBullets(c: ResumeContent) {
  return [
    ...c.experience.flatMap((e) => e.bullets.filter((b) => b.trim()).map((b) => ({ text: b, where: `${e.role} · ${e.company}` }))),
    ...c.volunteer.flatMap((e) => e.bullets.filter((b) => b.trim()).map((b) => ({ text: b, where: `${e.role} · ${e.company}` }))),
  ];
}

/** Years of experience from the earliest start date to the latest end (or now). */
export function yearsOfExperience(c: ResumeContent, now = new Date()) {
  const starts = c.experience.map((e) => e.start).filter((s) => /^\d{4}-\d{2}$/.test(s));
  if (!starts.length) return 0;
  const first = starts.sort()[0]!;
  const [y, m] = first.split("-").map(Number) as [number, number];
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  return Math.max(0, Math.round(months / 12));
}

/** Small deterministic hash, so the same input always yields the same variant. */
export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
