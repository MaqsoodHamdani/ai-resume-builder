import { designFor } from "../config";
import { analyzeResume } from "../services/analyzer";
import { matchJob } from "../services/matcher";
import type { Activity, AnalysisReport, JobMatch, Resume, ResumeContent, User } from "../types";

const DAY = 86_400_000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

export const SAMPLE_JOB = {
  jobTitle: "Senior Frontend Engineer",
  company: "Fieldnote",
  description: `Fieldnote builds scheduling and payments software for independent clinics. We're hiring a Senior Frontend Engineer to own the patient-facing booking experience.

What you'll do
- Lead the frontend architecture for our booking and payments flows
- Build accessible, fast interfaces in React and TypeScript
- Partner with design to grow our design system
- Mentor engineers and raise the bar on code review and testing
- Improve web performance and Core Web Vitals across the product

Requirements
- 6+ years of experience building production web applications
- Expert in React, TypeScript and modern CSS
- Experience with Next.js and server rendering
- Strong testing practice with Jest or Playwright
- Experience with GraphQL APIs
- Track record of mentoring engineers

Nice to have
- Experience with payments or healthcare products
- Familiarity with AWS and CI/CD pipelines`,
};

export const SAMPLE_RESUME_TEXT = `Jordan Lee
Data Analyst
jordan.lee@fastmail.com | (312) 555-0187 | Chicago, IL | linkedin.com/in/jordanlee-data

SUMMARY
Detail-oriented data analyst with experience turning messy operational data into reporting that managers use every week.

EXPERIENCE
Data Analyst | Meridian Freight | Mar 2022 – Present
• Responsible for building weekly delivery performance dashboards in Tableau for 12 regional managers
• Automated the carrier invoice reconciliation in Python, saving 9 hours per week
• Worked on the forecasting model for seasonal volume with the planning team
• Wrote SQL queries to support ad hoc requests from finance

Operations Associate | Lakeshore Logistics | Jun 2020 – Feb 2022
• Helped track shipment exceptions across 3 warehouses
• Built an Excel model that flagged late carriers, reducing missed pickups by 14%

EDUCATION
B.A. Economics, University of Illinois Chicago, 2016 – 2020

SKILLS
SQL, Python, Tableau, Excel, Pandas, Statistics`;

function alexBase(): ResumeContent {
  return {
    contact: {
      fullName: "Alex Morgan",
      title: "Senior Frontend Engineer",
      email: "alex.morgan@fastmail.com",
      phone: "(512) 555-0142",
      location: "Austin, TX",
      linkedin: "linkedin.com/in/alexmorgan-dev",
      portfolio: "github.com/alexmorgan",
      website: "alexmorgan.dev",
    },
    summary:
      "Senior frontend engineer with 8 years of experience building fast, accessible React and TypeScript applications. At Lattice Health, led a framework migration that cut median load time by 61% and built the design system five product teams ship with.",
    experience: [
      {
        id: "exp_lattice",
        role: "Senior Frontend Engineer",
        company: "Lattice Health",
        location: "Austin, TX",
        employmentType: "Full-time",
        start: "2022-03",
        end: "",
        current: true,
        description: "Patient scheduling and clinic operations software used by 1,400 clinics.",
        bullets: [
          "Led the migration of the patient scheduling app from AngularJS to React and TypeScript, cutting median page load from 4.1s to 1.6s",
          "Built a design system of 48 accessible components adopted by 5 product teams",
          "Reduced booking errors by 31% by introducing schema validation and end-to-end tests with Playwright",
          "Mentored 4 engineers through a structured onboarding program; 2 were promoted within a year",
          "Responsible for maintaining the CI pipeline and release process",
        ],
      },
      {
        id: "exp_brightwave",
        role: "Frontend Engineer",
        company: "Brightwave Commerce",
        location: "Remote",
        employmentType: "Full-time",
        start: "2019-06",
        end: "2022-02",
        current: false,
        description: "",
        bullets: [
          "Rebuilt product listing pages in Next.js, increasing organic traffic by 22% through server rendering",
          "Worked on the checkout redesign with the design and payments teams",
          "Introduced visual regression testing that caught 60+ UI regressions before release",
          "Helped improve accessibility across the storefront",
        ],
      },
      {
        id: "exp_northside",
        role: "Web Developer",
        company: "Northside Creative Studio",
        location: "Austin, TX",
        employmentType: "Full-time",
        start: "2017-08",
        end: "2019-05",
        current: false,
        description: "",
        bullets: [
          "Delivered 20+ marketing sites for clients in hospitality and retail",
          "Built reusable WordPress themes that cut project setup time from 3 days to 1",
        ],
      },
    ],
    education: [
      {
        id: "edu_ut",
        institution: "The University of Texas at Austin",
        degree: "B.S.",
        field: "Computer Science",
        start: "2013-08",
        end: "2017-05",
        details: "Minor in Business. Teaching assistant for Data Structures.",
      },
    ],
    skills: [
      { id: "sk_lang", name: "Languages", skills: ["TypeScript", "JavaScript", "HTML", "CSS"] },
      { id: "sk_fw", name: "Frameworks", skills: ["React", "Next.js", "Redux", "Tailwind CSS"] },
      { id: "sk_tools", name: "Tools", skills: ["Playwright", "Jest", "Storybook", "GitHub Actions", "Figma"] },
    ],
    certifications: [
      { id: "cert_aws", title: "AWS Certified Cloud Practitioner", subtitle: "Amazon Web Services", date: "2023", description: "" },
    ],
    projects: [
      {
        id: "proj_tabletop",
        title: "Tabletop",
        subtitle: "Open-source React library",
        date: "2021",
        description: "Accessible, headless data tables for React with keyboard navigation and virtualization. 1.2k GitHub stars.",
      },
    ],
    languages: [
      { id: "lang_en", title: "English", subtitle: "Native", date: "", description: "" },
      { id: "lang_es", title: "Spanish", subtitle: "Professional working proficiency", date: "", description: "" },
    ],
    awards: [],
    volunteer: [],
  };
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export interface SeedState {
  user: User;
  resumes: Resume[];
  reports: AnalysisReport[];
  matches: JobMatch[];
  activity: Activity[];
}

export function createSeed(): SeedState {
  const main = alexBase();

  // The original upload: the same history before Alex reworked it.
  const original = clone(main);
  original.summary =
    "Passionate, results-driven frontend developer and team player with experience in React. Looking for a challenging role where I can grow.";
  original.experience[0]!.bullets = [
    "Responsible for migrating the scheduling app from AngularJS to React",
    "Worked on the design system with the design team",
    "Helped reduce booking errors by adding tests",
    "Mentored junior engineers",
  ];
  original.experience[1]!.bullets = [
    "Rebuilt product listing pages in Next.js",
    "Worked on the checkout redesign",
  ];
  original.experience[2]!.bullets = ["Built websites for clients"];
  original.skills = [{ id: "sk_all", name: "Skills", skills: ["React", "JavaScript", "CSS", "WordPress"] }];
  original.certifications = [];
  original.projects = [];
  original.contact.linkedin = "";
  original.contact.title = "Frontend Developer";

  const manager = clone(main);
  manager.contact.title = "Engineering Manager";
  manager.summary =
    "Dynamic, hard-working engineering leader and team player passionate about building great teams and great products.";
  manager.experience[0]!.bullets = [
    "Led a team of 6 engineers delivering the patient scheduling app",
    "Responsible for hiring and onboarding new engineers",
    "Mentored 4 engineers; 2 were promoted within a year",
    "Worked on quarterly roadmap planning with product and design",
  ];

  const fintech = clone(main);
  fintech.contact.title = "Product Engineer";
  fintech.summary =
    "Product engineer with 8 years of experience shipping React and TypeScript products end to end. Rebuilt checkout and listing flows at Brightwave Commerce and lifted organic traffic by 22% through server rendering.";
  fintech.skills = [
    { id: "sk_fw", name: "Frameworks", skills: ["React", "Next.js", "Node.js", "Redux"] },
    { id: "sk_lang", name: "Languages", skills: ["TypeScript", "JavaScript", "SQL", "CSS"] },
    { id: "sk_tools", name: "Tools", skills: ["Playwright", "Jest", "GitHub Actions", "Figma"] },
  ];

  const mk = (
    id: string,
    name: string,
    targetRole: string,
    content: ResumeContent,
    templateId: string,
    source: Resume["source"],
    createdAgo: number,
    updatedAgo: number,
    extra: Partial<Resume> = {},
  ): Resume => ({
    id,
    name,
    targetRole,
    content,
    sectionOrder: ["summary", "experience", "skills", "education", "projects", "certifications", "languages"],
    design: designFor(templateId),
    source,
    createdAt: ago(createdAgo),
    updatedAt: ago(updatedAgo),
    versions: [],
    ...extra,
  });

  const r1 = mk("res_frontend", "Senior Frontend Engineer 2026", "Senior Frontend Engineer", main, "meridian", "upload", 21 * DAY, 2 * 3_600_000, {
    fileName: "AlexMorgan_Resume_2025.pdf",
  });
  const r2 = mk("res_fintech", "Product Engineer, Fintech", "Product Engineer", fintech, "atlas", "tailored", 9 * DAY, 3 * DAY);
  const r3 = mk("res_manager", "Engineering Manager (draft)", "Engineering Manager", manager, "sterling", "duplicate", 6 * DAY, 5 * DAY);
  const r4 = mk("res_original", "Alex Morgan Resume 2025", "Frontend Engineer", original, "plain", "upload", 22 * DAY, 22 * DAY, {
    fileName: "AlexMorgan_Resume_2025.pdf",
  });

  const at = (r: AnalysisReport, t: number) => ({ ...r, createdAt: ago(t) });
  const r1Before = at(analyzeResume({ ...r1, content: original }), 21 * DAY);
  const reports = [
    at(analyzeResume(r1, r1Before), 2 * 3_600_000),
    at(analyzeResume(r2), 3 * DAY),
    at(analyzeResume(r3), 5 * DAY),
    at(analyzeResume(r4), 22 * DAY),
  ];

  r1.versions = [
    { id: "v_r1_1", label: "Original upload", createdAt: ago(21 * DAY), score: r1Before.score, content: clone(original) },
    { id: "v_r1_2", label: "Rewrote experience bullets", createdAt: ago(2 * 3_600_000), score: reports[0]!.score, content: clone(main) },
  ];
  r2.versions = [{ id: "v_r2_1", label: "Tailored for fintech roles", createdAt: ago(9 * DAY), score: reports[1]!.score, content: clone(fintech) }];

  const match = { ...matchJob(r1, SAMPLE_JOB.jobTitle, SAMPLE_JOB.company, SAMPLE_JOB.description), saved: true, createdAt: ago(1 * DAY) };
  const match2 = {
    ...matchJob(
      r2,
      "Product Engineer",
      "Harbor Pay",
      "Harbor Pay is hiring a Product Engineer to build merchant onboarding and payments dashboards.\n\nRequirements\n- 4+ years building web products with React and TypeScript\n- Experience with Node.js and PostgreSQL\n- Comfort working across the stack and with product analytics\n- Experience with payments or fintech products\n\nNice to have\n- GraphQL\n- AWS",
    ),
    saved: true,
    createdAt: ago(4 * DAY),
  };

  const activity: Activity[] = [
    { id: "a1", kind: "analysis", text: "Analysis completed for Senior Frontend Engineer 2026", resumeId: r1.id, at: ago(2 * 3_600_000) },
    { id: "a2", kind: "version", text: "New version saved: Rewrote experience bullets", resumeId: r1.id, at: ago(2.2 * 3_600_000) },
    { id: "a3", kind: "match", text: `Matched Senior Frontend Engineer 2026 to Fieldnote (${match.score}%)`, resumeId: r1.id, at: ago(1 * DAY) },
    { id: "a4", kind: "update", text: "Updated skills in Product Engineer, Fintech", resumeId: r2.id, at: ago(3 * DAY) },
    { id: "a5", kind: "match", text: `Matched Product Engineer, Fintech to Harbor Pay (${match2.score}%)`, resumeId: r2.id, at: ago(4 * DAY) },
    { id: "a6", kind: "duplicate", text: "Created Engineering Manager (draft) from Senior Frontend Engineer 2026", resumeId: r3.id, at: ago(6 * DAY) },
    { id: "a7", kind: "create", text: "Tailored Product Engineer, Fintech", resumeId: r2.id, at: ago(9 * DAY) },
    { id: "a8", kind: "upload", text: "Uploaded AlexMorgan_Resume_2025.pdf", resumeId: r4.id, at: ago(22 * DAY) },
  ];

  const user: User = {
    name: "Alex Morgan",
    email: "alex.morgan@fastmail.com",
    careerStage: "senior",
    industry: "Technology",
    targetRole: "Senior Frontend Engineer",
    plan: "pro",
    billingCycle: "yearly",
    onboarded: true,
    preferences: {
      defaultTemplate: "meridian",
      notifications: { analysis: true, tips: true, weekly: false, product: true },
      compactTables: false,
    },
  };

  return { user, resumes: [r1, r2, r3, r4], reports, matches: [match, match2], activity };
}
