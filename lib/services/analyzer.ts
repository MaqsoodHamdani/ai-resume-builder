import type { AnalysisReport, CategoryKey, CategoryScore, Check, Finding, Resume, WeakBullet } from "../types";
import { clamp, uid } from "../utils";
import {
  allBullets,
  CLICHES,
  familyFor,
  hasTerm,
  METRIC,
  resumeText,
  skillsForRole,
  startsStrong,
  weakOpener,
  wordCount,
} from "./text";
import { rewrite } from "./writer";

export const CATEGORY_META: Record<CategoryKey, { label: string; weight: number }> = {
  impact: { label: "Impact and Achievements", weight: 0.2 },
  experience: { label: "Work Experience", weight: 0.18 },
  content: { label: "Content Quality", weight: 0.15 },
  skills: { label: "Skills Relevance", weight: 0.15 },
  ats: { label: "ATS Compatibility", weight: 0.12 },
  summary: { label: "Professional Summary", weight: 0.1 },
  formatting: { label: "Formatting and Structure", weight: 0.1 },
};

const ORDER: CategoryKey[] = ["ats", "content", "experience", "skills", "summary", "formatting", "impact"];

/**
 * Local resume analysis. Deterministic: the same resume always gets the same report.
 * Scores are an internal optimization indicator, not a prediction of any employer's ATS.
 */
export function analyzeResume(resume: Resume, previous?: AnalysisReport): AnalysisReport {
  const c = resume.content;
  const role = resume.targetRole || c.contact.title || c.experience[0]?.role || "";
  const text = resumeText(c);
  const bullets = allBullets(c);
  const findings: Finding[] = [];
  const strengths: string[] = [];

  // ---------- Impact ----------
  const withMetrics = bullets.filter((b) => METRIC.test(b.text));
  const metricShare = bullets.length ? withMetrics.length / bullets.length : 0;
  const impact = bullets.length ? clamp(Math.round(25 + 75 * metricShare)) : 20;
  if (metricShare >= 0.5) strengths.push(`${withMetrics.length} of ${bullets.length} bullets include a measurable result.`);
  const noMetric = bullets.filter((b) => !METRIC.test(b.text));
  if (bullets.length && noMetric.length >= 2) {
    const sample = noMetric[0]!;
    findings.push({
      id: uid("f"),
      category: "impact",
      severity: metricShare < 0.25 ? "high" : metricShare < 0.5 ? "medium" : "low",
      title: "Missing measurable achievements",
      explanation: `${noMetric.length} of ${bullets.length} bullets describe work without a result, such as “${trim(sample.text)}”.`,
      why: "Numbers let a recruiter judge scale in seconds. Bullets with outcomes are the ones people remember.",
      suggestion: "Add the result each piece of work produced: a percentage, a time saved, revenue, users or team size.",
      section: "experience",
      before: sample.text,
      after: rewrite(sample.text, "impact"),
    });
  }

  // ---------- Content quality ----------
  const strong = bullets.filter((b) => startsStrong(b.text));
  const weak = bullets.filter((b) => weakOpener(b.text));
  const firstPerson = /\b(I|me|my)\b/.test(c.experience.flatMap((e) => e.bullets).join(" "));
  const totalWords = wordCount(text);
  const strongShare = bullets.length ? strong.length / bullets.length : 0;
  const content = clamp(
    Math.round(40 + 50 * strongShare - 7 * weak.length - (firstPerson ? 10 : 0) + (totalWords >= 300 && totalWords <= 950 ? 10 : 0)),
    15,
  );
  if (strongShare >= 0.7) strengths.push(`Strong experience descriptions: ${strong.length} bullets open with an action verb.`);
  if (weak.length) {
    const w = weak[0]!;
    findings.push({
      id: uid("f"),
      category: "content",
      severity: weak.length > 2 ? "high" : "medium",
      title: "Weak action verbs",
      explanation: `${weak.length} ${weak.length === 1 ? "bullet opens" : "bullets open"} with a passive phrase. ${weakOpener(w.text)!.label} in “${trim(w.text)}”.`,
      why: "The first word sets how much ownership a reader assumes. “Responsible for” reads as a job description, not an achievement.",
      suggestion: "Start each bullet with a specific past-tense verb that says what you did: Built, Led, Reduced, Launched.",
      section: "experience",
      before: w.text,
      after: rewrite(w.text, "verbs"),
    });
  }
  if (firstPerson) {
    findings.push({
      id: uid("f"),
      category: "content",
      severity: "low",
      title: "First-person pronouns in bullets",
      explanation: "Some experience bullets use “I” or “my”.",
      why: "Resume convention drops the pronoun. It saves space and reads more confidently.",
      suggestion: "Remove “I” and “my” and start with the verb.",
      section: "experience",
    });
  }

  // ---------- Work experience ----------
  let experience = 100;
  const exp = c.experience;
  if (!exp.length) experience = 15;
  const thin = exp.filter((e) => e.bullets.filter(Boolean).length < 2);
  const light = exp.filter((e) => e.bullets.filter(Boolean).length === 2);
  const long = exp.filter((e) => e.bullets.filter(Boolean).length > 7);
  const undated = exp.filter((e) => !e.start || (!e.end && !e.current));
  experience -= thin.length * 14 + light.length * 6 + long.length * 6 + undated.length * 10;
  experience = clamp(experience, 15);
  if (exp.length && !undated.length) strengths.push(`Clear employment history: ${exp.length} ${exp.length === 1 ? "role" : "roles"} with complete dates.`);
  if (!exp.length) {
    findings.push({
      id: uid("f"),
      category: "experience",
      severity: "high",
      title: "No work experience listed",
      explanation: "The resume has no roles in Work Experience.",
      why: "Most recruiters read experience first. Even internships, part-time and freelance work count.",
      suggestion: "Add your most recent role with three to five achievement bullets.",
      section: "experience",
    });
  }
  if (thin.length) {
    findings.push({
      id: uid("f"),
      category: "experience",
      severity: "medium",
      title: "Roles with too little detail",
      explanation: `${thin.map((e) => `${e.role} at ${e.company}`).join(", ")} ${thin.length === 1 ? "has" : "have"} fewer than two bullets.`,
      why: "A role with one line looks unimportant, even when it was not.",
      suggestion: "Give each recent role three to five bullets that show scope and results.",
      section: "experience",
    });
  }
  if (undated.length) {
    findings.push({
      id: uid("f"),
      category: "experience",
      severity: "medium",
      title: "Missing employment dates",
      explanation: `${undated.map((e) => e.role || "A role").join(", ")} ${undated.length === 1 ? "is" : "are"} missing a start or end date.`,
      why: "Gaps in dates make recruiters guess, and many tracking systems sort by recency.",
      suggestion: "Add a month and year for every start and end date, or mark the role as current.",
      section: "experience",
    });
  }

  // ---------- Skills relevance ----------
  const target = skillsForRole(role);
  const found = target.filter((s) => hasTerm(text, s));
  const missing = target.filter((s) => !hasTerm(text, s));
  const skillCount = c.skills.flatMap((g) => g.skills).length;
  const skills = clamp(Math.round(30 + 70 * Math.min(1, found.length / (target.length * 0.9)) - (skillCount < 6 ? 12 : 0)), 10);
  const fam = familyFor(role);
  if (found.length >= target.length * 0.5)
    strengths.push(`Relevant skills: ${found.length} of ${target.length} terms common in ${fam?.label ?? "this field"} roles.`);
  if (missing.length >= 2) {
    findings.push({
      id: uid("f"),
      category: "skills",
      severity: found.length < target.length * 0.35 ? "high" : found.length < target.length * 0.6 ? "medium" : "low",
      title: "Missing relevant skills",
      explanation: `For ${role || "your target role"}, the resume does not mention ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? ` and ${missing.length - 4} more` : ""}.`,
      why: "Recruiters and tracking systems search for these terms. If you have the skill but never name it, it is invisible.",
      suggestion: "Add the skills you genuinely have, ideally inside a bullet that shows where you used them. Leave out anything you have not done.",
      section: "skills",
    });
  }
  if (skillCount < 6) {
    findings.push({
      id: uid("f"),
      category: "skills",
      severity: "low",
      title: "Short skills section",
      explanation: `Only ${skillCount} ${skillCount === 1 ? "skill is" : "skills are"} listed.`,
      why: "A skills section of 8 to 15 grouped items gives readers a quick map of what you can do.",
      suggestion: "Group skills into two or three categories, such as Languages, Frameworks and Tools.",
      section: "skills",
    });
  }

  // ---------- ATS compatibility ----------
  const ats: Check[] = [
    { label: "Email address", pass: /@/.test(c.contact.email), detail: c.contact.email || "No email found in the header." },
    { label: "Phone number", pass: /\d{3}/.test(c.contact.phone), detail: c.contact.phone || "No phone number found." },
    { label: "LinkedIn profile", pass: /linkedin/i.test(c.contact.linkedin), detail: c.contact.linkedin || "Add a LinkedIn URL so recruiters can verify your history." },
    {
      label: "Standard section headings",
      pass: resume.sectionOrder.includes("experience") && resume.sectionOrder.includes("education") && resume.sectionOrder.includes("skills"),
      detail: "Experience, Education and Skills are the headings parsers look for.",
    },
    {
      label: "Readable length",
      pass: totalWords >= 250 && totalWords <= 1000,
      detail: `${totalWords} words. ${totalWords < 250 ? "Under 250 reads as thin." : totalWords > 1000 ? "Over 1,000 usually runs past two pages." : "Within the usual one to two pages."}`,
    },
    {
      label: "Text-based layout",
      pass: resume.design.templateId !== "canvas" && resume.design.templateId !== "sterling",
      detail:
        resume.design.templateId === "canvas" || resume.design.templateId === "sterling"
          ? "This template uses graphic elements some parsers skip. Export with Plain or Meridian for strict portals."
          : "Single text flow that parsers can read top to bottom.",
    },
  ];
  const atsScore = clamp(Math.round((ats.filter((a) => a.pass).length / ats.length) * 100));
  if (ats.filter((a) => a.pass).length >= 5) strengths.push("Good section organization with headings tracking systems recognize.");
  const failedContact = ats.slice(0, 3).filter((a) => !a.pass);
  if (failedContact.length) {
    findings.push({
      id: uid("f"),
      category: "ats",
      severity: "high",
      title: "Incomplete contact information",
      explanation: `Missing: ${failedContact.map((a) => a.label.toLowerCase()).join(", ")}.`,
      why: "Tracking systems fill the candidate record from your header. A missing field can mean a recruiter cannot reach you.",
      suggestion: "Add a professional email, a phone number and your LinkedIn URL to the header.",
      section: "contact",
    });
  }

  // ---------- Summary ----------
  const sw = wordCount(c.summary);
  const cliches = CLICHES.filter((x) => c.summary.toLowerCase().includes(x));
  let summary = 25;
  if (sw) {
    summary = 60;
    if (sw >= 30 && sw <= 80) summary += 15;
    else summary -= 10;
    if (role && hasTerm(c.summary, role.split(" ").slice(-1)[0]!)) summary += 10;
    if (METRIC.test(c.summary)) summary += 10;
    summary -= cliches.length * 8;
    summary = clamp(summary, 15);
  }
  if (!sw) {
    findings.push({
      id: uid("f"),
      category: "summary",
      severity: "medium",
      title: "No professional summary",
      explanation: "The resume starts straight into experience.",
      why: "A two-to-four sentence summary tells the reader which role you are aiming for before they read the details.",
      suggestion: "Write a short summary naming your role, years of experience, core skills and one result.",
      section: "summary",
    });
  } else if (cliches.length || sw < 30 || !METRIC.test(c.summary)) {
    findings.push({
      id: uid("f"),
      category: "summary",
      severity: cliches.length ? "medium" : "low",
      title: "Generic professional summary",
      explanation: cliches.length
        ? `The summary relies on phrases recruiters skim past: ${cliches.map((x) => `“${x}”`).join(", ")}.`
        : sw < 30
          ? `At ${sw} words, the summary is too short to say what sets you apart.`
          : "The summary has no concrete result or number.",
      why: "The summary is the first thing read. Specific claims make the reader keep going.",
      suggestion: "Replace adjectives with evidence: years of experience, the domain you work in and one result you are proud of.",
      section: "summary",
      before: c.summary,
    });
  } else {
    strengths.push("Professional summary is specific and backed by a result.");
  }

  // ---------- Formatting ----------
  const dates = [...exp, ...c.education].flatMap((e) => [e.start, e.end]).filter(Boolean);
  const isoDates = dates.filter((d) => /^\d{4}-\d{2}$/.test(d));
  const mixedDates = isoDates.length > 0 && isoDates.length < dates.length;
  const longBullets = bullets.filter((b) => wordCount(b.text) > 32);
  const shortBullets = bullets.filter((b) => wordCount(b.text) < 6);
  const periods = bullets.filter((b) => /\.$/.test(b.text.trim())).length;
  const mixedPeriods = periods > 0 && periods < bullets.length;
  const formatting = clamp(
    100 - (mixedDates ? 18 : 0) - longBullets.length * 7 - shortBullets.length * 5 - (mixedPeriods ? 8 : 0),
    20,
  );
  if (mixedDates) {
    findings.push({
      id: uid("f"),
      category: "formatting",
      severity: "low",
      title: "Inconsistent date formatting",
      explanation: `Dates mix formats, for example “${dates.find((d) => !/^\d{4}-\d{2}$/.test(d))}” alongside month and year.`,
      why: "Consistent dates look careful and parse reliably.",
      suggestion: "Use month and year everywhere, such as Mar 2022 – Present.",
      section: "experience",
    });
  }
  if (longBullets.length) {
    const lb = longBullets[0]!;
    findings.push({
      id: uid("f"),
      category: "formatting",
      severity: "low",
      title: "Bullets that run long",
      explanation: `${longBullets.length} ${longBullets.length === 1 ? "bullet runs" : "bullets run"} past 32 words.`,
      why: "Long bullets wrap to three lines and get skimmed. One idea per bullet reads faster.",
      suggestion: "Split long bullets or cut the setup and keep the action and the result.",
      section: "experience",
      before: lb.text,
      after: rewrite(lb.text, "concise"),
    });
  }
  if (mixedPeriods) {
    findings.push({
      id: uid("f"),
      category: "formatting",
      severity: "low",
      title: "Mixed punctuation in bullets",
      explanation: `${periods} of ${bullets.length} bullets end with a period.`,
      why: "Small inconsistencies read as a lack of care.",
      suggestion: "Pick one style, with or without full stops, and apply it to every bullet.",
      section: "experience",
    });
  }

  // ---------- Keywords ----------
  const counts = new Map<string, number>();
  for (const b of bullets) {
    const w = b.text.trim().split(/\s+/)[0]!.toLowerCase().replace(/[^a-z]/g, "");
    if (w.length > 2) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const repeated = [...counts.entries()]
    .filter(([, n]) => n >= 3)
    .map(([term, count]) => ({ term: term[0]!.toUpperCase() + term.slice(1), count }))
    .sort((a, b) => b.count - a.count);
  if (repeated.length) {
    findings.push({
      id: uid("f"),
      category: "content",
      severity: "low",
      title: "Repeated opening verbs",
      explanation: `${repeated.map((r) => `“${r.term}” opens ${r.count} bullets`).join("; ")}.`,
      why: "Varied verbs show a wider range of work and keep the reader engaged.",
      suggestion: "Swap a few for more precise verbs. The AI Writing Assistant has suggestions by category.",
      section: "experience",
    });
  }

  // ---------- Experience analysis ----------
  const weakBullets: WeakBullet[] = bullets
    .map((b) => {
      const reasons: string[] = [];
      const w = weakOpener(b.text);
      if (w) reasons.push(w.label);
      else if (!startsStrong(b.text)) reasons.push("No clear action verb");
      if (!METRIC.test(b.text)) reasons.push("No measurable result");
      if (wordCount(b.text) > 32) reasons.push("Over 32 words");
      if (wordCount(b.text) < 6) reasons.push("Too vague to show scope");
      return { text: b.text, where: b.where, reasons };
    })
    .filter((b) => b.reasons.length >= 2 || b.reasons.some((r) => r.startsWith("Opens")))
    .slice(0, 6);

  // ---------- Education ----------
  const edu = c.education;
  const education: Check[] = [
    { label: "Education listed", pass: edu.length > 0, detail: edu.length ? `${edu.length} ${edu.length === 1 ? "entry" : "entries"}` : "No education entries." },
    {
      label: "Degree and institution",
      pass: edu.length > 0 && edu.every((e) => e.degree && e.institution),
      detail: edu.length && edu.every((e) => e.degree && e.institution) ? "Every entry names a degree and an institution." : "An entry is missing its degree or institution.",
    },
    {
      label: "Graduation dates",
      pass: edu.length > 0 && edu.every((e) => e.end),
      detail: edu.every((e) => e.end) ? "All entries are dated." : "Add a graduation year, or the expected year if you are still studying.",
    },
    {
      label: "Certifications",
      pass: c.certifications.length > 0,
      detail: c.certifications.length ? c.certifications.map((x) => x.title).join(", ") : "Optional. Add recognized certifications relevant to your target role.",
    },
  ];
  if (!edu.length) {
    findings.push({
      id: uid("f"),
      category: "formatting",
      severity: "medium",
      title: "Missing education section",
      explanation: "No education entries were found.",
      why: "Many tracking systems have a required education field and filter on it.",
      suggestion: "Add your highest qualification with the institution and year.",
      section: "education",
    });
  }

  const categories: CategoryScore[] = ORDER.map((key) => {
    const score = { ats: atsScore, content, experience, skills, summary, formatting, impact }[key];
    return { key, label: CATEGORY_META[key].label, score, note: noteFor(key, score) };
  });
  const score = Math.round(categories.reduce((sum, cat) => sum + cat.score * CATEGORY_META[cat.key].weight, 0));
  const rank = { high: 0, medium: 1, low: 2 };

  return {
    id: uid("rep"),
    resumeId: resume.id,
    createdAt: new Date().toISOString(),
    targetRole: role,
    score,
    categories,
    strengths: strengths.slice(0, 5),
    findings: findings.sort((a, b) => rank[a.severity] - rank[b.severity]),
    ats,
    keywords: { found, missing, repeated },
    experience: { bulletCount: bullets.length, withMetrics: withMetrics.length, strongVerbs: strong.length, weakBullets },
    education,
    previous: previous
      ? {
          score: previous.score,
          createdAt: previous.createdAt,
          categories: Object.fromEntries(previous.categories.map((x) => [x.key, x.score])),
        }
      : undefined,
  };
}

function noteFor(key: CategoryKey, score: number) {
  const good = score >= 80;
  const notes: Record<CategoryKey, [string, string]> = {
    ats: ["Parses cleanly with complete contact details", "Contact details or headings need attention"],
    content: ["Clear, active writing", "Passive phrasing weakens several bullets"],
    experience: ["Roles are detailed and dated", "Some roles need more detail or dates"],
    skills: ["Covers the skills this role asks for", "Key skills for the role are not named"],
    summary: ["Specific and evidence-led", "Reads as generic or is missing"],
    formatting: ["Consistent dates and bullet lengths", "Inconsistent dates or long bullets"],
    impact: ["Most bullets show a result", "Too few bullets show a measurable result"],
  };
  return notes[key][good ? 0 : 1];
}

function trim(s: string, n = 70) {
  return s.length > n ? `${s.slice(0, n).trimEnd()}…` : s;
}
