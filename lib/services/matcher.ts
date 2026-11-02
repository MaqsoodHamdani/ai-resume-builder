import type { JobMatch, Resume } from "../types";
import { clamp, uid } from "../utils";
import { allBullets, hasTerm, KNOWN_SKILLS, resumeText, yearsOfExperience } from "./text";

const STOP = new Set(
  "the and for with you your our are will have has this that from into about their they them who what when where which while also able must should would could more most other such than then these those using use work team role job company including across within over under very well both each any all can not but being been were was was experience years year strong excellent ability skills knowledge understanding working preferred required requirements responsibilities qualifications plus bonus etc".split(
    " ",
  ),
);

const REQUIRED_LINE = /\b(required|requirements|must|you have|you bring|qualifications|minimum|what we're looking for|what you'll need)\b/i;

/**
 * Compare a resume against a job description. Only ever reports what the posting asks for and
 * whether the resume shows it; it never proposes claiming experience the user does not have.
 */
export function matchJob(resume: Resume, jobTitle: string, company: string, description: string): JobMatch {
  const c = resume.content;
  const text = resumeText(c);
  const jd = description;
  const lines = jd.split(/\n+/);

  // 1. Known skills mentioned in the posting.
  const jdSkills = KNOWN_SKILLS.filter((s) => hasTerm(jd, s));
  const requiredLines = lines.filter((l) => REQUIRED_LINE.test(l));
  // Lines under a "Requirements" heading count as required too.
  let inRequired = false;
  for (const l of lines) {
    if (/^\s*(requirements|qualifications|what you('|’)ll need|you have|must have)/i.test(l)) inRequired = true;
    else if (/^\s*(nice to have|bonus|preferred|benefits|about us|what we offer)/i.test(l)) inRequired = false;
    else if (inRequired) requiredLines.push(l);
  }
  const requiredText = requiredLines.join("\n");
  const occurrences = (s: string) => jd.split(/\n/).filter((l) => hasTerm(l, s)).length;
  const important = jdSkills.filter((s) => hasTerm(requiredText, s) || occurrences(s) >= 2);
  const additionalSkills = jdSkills.filter((s) => !important.includes(s));

  // 2. Other frequent terms in the posting (domain words like "payments", "onboarding").
  const freq = new Map<string, number>();
  for (const w of jd.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? []) {
    if (STOP.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const extraTerms = [...freq.entries()]
    .filter(([w, n]) => n >= 3 && !jdSkills.some((s) => s.toLowerCase() === w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w[0]!.toUpperCase() + w.slice(1));

  const all = [...important, ...additionalSkills, ...extraTerms];
  const matched = all.filter((k) => hasTerm(text, k));
  const missing = all.filter((k) => !hasTerm(text, k));
  const importantMatched = important.filter((k) => hasTerm(text, k));

  // 3. Score: required skills count double; title and years adjust.
  const denom = important.length * 2 + additionalSkills.length + extraTerms.length * 0.5;
  const num = importantMatched.length * 2 + additionalSkills.filter((k) => hasTerm(text, k)).length + extraTerms.filter((k) => hasTerm(text, k)).length * 0.5;
  let score = denom ? (num / denom) * 88 : 50;
  const titleWords = jobTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  const titleHits = titleWords.filter((w) => text.toLowerCase().includes(w)).length;
  score += titleWords.length ? (titleHits / titleWords.length) * 10 : 5;
  const years = yearsOfExperience(c);
  const reqYears = Number(/(\d+)\+?\s*(?:or more\s*)?years/i.exec(jd)?.[1] ?? 0);
  if (reqYears && years >= reqYears) score += 4;
  if (reqYears && years < reqYears) score -= Math.min(15, (reqYears - years) * 5);
  score = Math.round(clamp(score, 12, 97));

  // 4. Experience alignment.
  const bullets = allBullets(c);
  const relevant = bullets
    .map((b) => ({ b, hits: all.filter((k) => hasTerm(b.text, k)) }))
    .filter((x) => x.hits.length)
    .sort((a, b) => b.hits.length - a.hits.length)
    .slice(0, 4)
    .map((x) => `${x.b.text} (${x.b.where}; shows ${x.hits.slice(0, 3).join(", ")})`);
  const gaps: string[] = [];
  if (reqYears && years < reqYears)
    gaps.push(years ? `The posting asks for ${reqYears}+ years; your dated experience adds up to about ${years}.` : `The posting asks for ${reqYears}+ years, and your resume has no dated experience yet. Add start and end dates to your roles.`);
  for (const k of important.filter((k) => !hasTerm(text, k)).slice(0, 3))
    gaps.push(`${k} is listed as required and does not appear in your resume. If you have used it, say where; if not, leave it out.`);
  const wantsLeadership = /\b(lead|mentor|manage|leadership)\b/i.test(requiredText);
  const showsLeadership = bullets.some((b) => /^(led|mentored|managed|coached|directed|hired)\b/i.test(b.text.trim()));
  if (wantsLeadership && !showsLeadership) gaps.push("The role asks for leadership or mentoring; no bullet shows you leading people or work.");

  const skillList = c.skills.flatMap((g) => g.skills);
  const inSkillsSection = (k: string) => skillList.some((s) => s.toLowerCase() === k.toLowerCase() || hasTerm(s, k));
  const highlight = importantMatched.filter((k) => !inSkillsSection(k));

  const expSuggestions: string[] = [];
  if (highlight.length) expSuggestions.push(`You mention ${highlight.slice(0, 3).join(", ")} in your experience but not in Skills. Add them there too.`);
  const weakRelevant = bullets.find((b) => all.some((k) => hasTerm(b.text, k)) && !/\d|%|\$/.test(b.text));
  if (weakRelevant) expSuggestions.push(`“${weakRelevant.text.slice(0, 80)}${weakRelevant.text.length > 80 ? "…" : ""}” is relevant to this job. Add the result it produced.`);
  if (!expSuggestions.length)
    expSuggestions.push(relevant.length ? "Your most relevant bullets already carry results. Move them to the top of each role." : "None of your bullets mention what this posting asks for. Where you have done related work, describe it in the posting’s terms.");

  const suggestions: JobMatch["suggestions"] = [
    {
      title: "Update your professional summary",
      detail: `Name the role (${jobTitle || "this position"}) and lead with ${importantMatched.slice(0, 2).join(" and ") || "your strongest matching skills"}, which the posting emphasizes.`,
      section: "summary",
    },
  ];
  if (weakRelevant)
    suggestions.push({ title: "Strengthen relevant bullet points", detail: "Add measurable results to the bullets that match this posting so they stand out.", section: "experience" });
  const project = c.projects.find((p) => all.some((k) => hasTerm(`${p.title} ${p.description}`, k)));
  if (project)
    suggestions.push({ title: "Highlight a relevant project", detail: `“${project.title}” uses skills this role asks for. Move Projects higher for this application.`, section: "projects" });
  if (importantMatched.length)
    suggestions.push({ title: "Reorder your skills", detail: `Put ${importantMatched.slice(0, 4).join(", ")} first in your skills list.`, section: "skills" });

  return {
    id: uid("match"),
    resumeId: resume.id,
    jobTitle: jobTitle.trim(),
    company: company.trim(),
    description: jd,
    createdAt: new Date().toISOString(),
    score,
    saved: false,
    keywords: { matched, missing, important, additional: [...additionalSkills, ...extraTerms] },
    skills: {
      found: importantMatched,
      missing: important.filter((k) => !hasTerm(text, k)),
      highlight,
    },
    experience: { relevant, gaps, suggestions: expSuggestions },
    suggestions,
  };
}
