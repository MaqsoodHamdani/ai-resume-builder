import type { ResumeContent } from "../types";
import {
  familyFor,
  firstWord,
  hash,
  METRIC,
  skillsForRole,
  startsStrong,
  STRONG_VERBS,
  wordCount,
  yearsOfExperience,
} from "./text";

// Local, rule-based writing assistance. Every function is pure and deterministic for a given
// (input, variant), so "Regenerate" cycles through variants. Swap this module for an LLM call later.

export type RewriteMode = "improve" | "professional" | "concise" | "verbs" | "impact";

export const REWRITE_MODES: { id: RewriteMode; label: string }[] = [
  { id: "improve", label: "Improve writing" },
  { id: "professional", label: "Make more professional" },
  { id: "concise", label: "Make more concise" },
  { id: "verbs", label: "Add strong action verbs" },
  { id: "impact", label: "Improve impact" },
];

const IRREGULAR: Record<string, string> = {
  building: "built", leading: "led", running: "ran", writing: "wrote", making: "made", teaching: "taught",
  driving: "drove", growing: "grew", winning: "won", setting: "set", cutting: "cut", bringing: "brought",
  selling: "sold", speaking: "spoke", overseeing: "oversaw", shipping: "shipped", planning: "planned",
  managing: "managed", creating: "created", developing: "developed", designing: "designed", handling: "handled",
  maintaining: "maintained", coordinating: "coordinated", improving: "improved", supporting: "supported",
  analyzing: "analyzed", reviewing: "reviewed", testing: "tested", training: "trained", owning: "owned",
};

function pastTense(gerund: string) {
  const g = gerund.toLowerCase();
  if (IRREGULAR[g]) return IRREGULAR[g]!;
  if (!g.endsWith("ing")) return g;
  const stem = g.slice(0, -3);
  if (/[^aeiou][aeiou][bdgmnprt]$/.test(stem) && stem.length <= 4) return stem + stem.slice(-1) + "ed";
  return /e$/.test(stem) ? stem + "d" : stem + "ed";
}

const VERB_FAMILIES: { when: RegExp; verbs: string[] }[] = [
  { when: /\b(redesign|migration|rollout|rebuild|overhaul|launch)\b/i, verbs: ["Led", "Delivered", "Drove", "Shipped"] },
  { when: /\b(team|engineers|people|hire|hiring|mentor|direct reports)\b/i, verbs: ["Led", "Mentored", "Directed", "Coached"] },
  { when: /\b(build|built|develop|feature|app|application|component|service|api|platform|tool|system|website)\b/i, verbs: ["Built", "Engineered", "Developed", "Shipped"] },
  { when: /\b(process|workflow|pipeline|manual|time|cost|slow|faster|efficien)/i, verbs: ["Streamlined", "Automated", "Reduced", "Optimized"] },
  { when: /\b(report|data|analysis|metrics|dashboard|research|insight)/i, verbs: ["Analyzed", "Measured", "Identified", "Modeled"] },
  { when: /\b(customer|client|stakeholder|partner|vendor|sales|deal)/i, verbs: ["Partnered", "Negotiated", "Secured", "Grew"] },
  { when: /\b(design|redesign|ux|ui|interface|brand)/i, verbs: ["Designed", "Redesigned", "Prototyped", "Defined"] },
  { when: /\b(launch|release|campaign|program|initiative|project)/i, verbs: ["Launched", "Delivered", "Spearheaded", "Drove"] },
];
const FALLBACK_VERBS = ["Delivered", "Drove", "Owned", "Established"];

function verbsFor(text: string) {
  return VERB_FAMILIES.find((f) => f.when.test(text))?.verbs ?? FALLBACK_VERBS;
}

const FILLER: [RegExp, string][] = [
  [/\bsuccessfully\s+/gi, ""],
  [/\bin order to\b/gi, "to"],
  [/\ba (large )?number of\b/gi, "several"],
  [/\butiliz(e|ed|ing)\b/gi, "us$1"],
  [/\b(really|very|basically|actually)\s+/gi, ""],
  [/\bvarious\s+/gi, ""],
  [/\bon a daily basis\b/gi, "daily"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bat this point in time\b/gi, "now"],
  [/\bwhich (was|were) /gi, ""],
  [/\s*\([^)]*\)/g, ""],
];

const CASUAL: [RegExp, string][] = [
  [/\bgot\b/gi, "earned"],
  [/\blots of\b/gi, "many"],
  [/\ba lot of\b/gi, "significant"],
  [/\bstuff\b/gi, "work"],
  [/\bbig\b/gi, "major"],
  [/\bfixed\b/gi, "resolved"],
  [/\bhelped out\b/gi, "supported"],
  [/\bkids\b/gi, "students"],
  [/\bguys\b/gi, "team members"],
  [/\bawesome|amazing|great\b/gi, "strong"],
  [/\bthings\b/gi, "initiatives"],
  [/\bI\s+|\bmy\s+/g, ""],
];

function sentenceCase(s: string) {
  const t = s.trim().replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1");
  return t ? t[0]!.toUpperCase() + t.slice(1) : t;
}

function stripEnd(s: string) {
  return s.trim().replace(/[.;,\s]+$/, "");
}

/** Replace a weak opener with a strong past-tense verb. */
function strengthenOpening(text: string, variant: number) {
  let t = text.trim();
  const responsible = /^(?:was )?(?:responsible for|tasked with|in charge of)\s+(\w+ing)\b/i.exec(t);
  if (responsible) {
    t = sentenceCase(pastTense(responsible[1]!) + t.slice(responsible[0].length));
    return t;
  }
  const generic = /^(?:was )?(?:responsible for|tasked with|in charge of|duties included|involved in|participated in|worked on|working on|helped(?: to)?(?: with)?|assisted(?: with| in)?|handled|did)\s+/i.exec(t);
  if (generic) {
    const rest = t.slice(generic[0].length);
    const verbs = verbsFor(rest);
    const v = verbs[variant % verbs.length]!;
    const restClean = /^(\w+ing)\b/.test(rest) ? pastTense(rest.split(" ")[0]!) + rest.slice(rest.split(" ")[0]!.length) : rest;
    // "Helped build X" -> "Built X"; "Worked on the checkout" -> "Built the checkout"
    if (/^(build|create|design|develop|launch|improve|reduce|grow|lead|manage)\b/i.test(restClean)) {
      const w = restClean.split(" ")[0]!;
      return sentenceCase(pastTense(w + "ing").replace(/^./, (c) => c.toUpperCase()) + restClean.slice(w.length));
    }
    return sentenceCase(`${v} ${restClean}`);
  }
  if (!startsStrong(t)) {
    const fw = firstWord(t);
    if (/ing$/.test(fw)) return sentenceCase(pastTense(fw) + t.slice(fw.length));
    if (/^(the|a|an|our|new|my)$/.test(fw) || /^[a-z]/i.test(fw)) {
      const verbs = verbsFor(t);
      return sentenceCase(`${verbs[variant % verbs.length]} ${t[0]!.toLowerCase()}${t.slice(1)}`);
    }
  }
  return sentenceCase(t);
}

function concise(text: string) {
  let t = text;
  for (const [re, rep] of FILLER) t = t.replace(re, rep);
  const words = t.trim().split(/\s+/);
  if (words.length > 24) {
    // Keep the clause that carries the result when the bullet runs long.
    const cut = t.split(/,\s+(?:and |which |while )?/);
    t = cut.length > 1 ? cut.filter((c, i) => i === 0 || METRIC.test(c)).join(", ") : words.slice(0, 24).join(" ");
  }
  return sentenceCase(t);
}

function professional(text: string) {
  let t = text;
  for (const [re, rep] of CASUAL) t = t.replace(re, rep);
  return sentenceCase(t);
}

const IMPACT_TAILS = [
  ", improving [metric] by [X%]",
  ", cutting [time or cost] by [X%]",
  ", reaching [N] users or customers",
  ", saving [N] hours per week",
];

function impact(text: string, variant: number) {
  const t = stripEnd(text);
  if (METRIC.test(t)) return sentenceCase(t);
  return sentenceCase(t + IMPACT_TAILS[variant % IMPACT_TAILS.length]);
}

export function rewrite(text: string, mode: RewriteMode, variant = 0) {
  const src = text.trim();
  if (!src) return "";
  switch (mode) {
    case "concise":
      return concise(src);
    case "professional":
      return professional(src);
    case "verbs":
      return strengthenOpening(src, variant);
    case "impact":
      return impact(strengthenOpening(src, variant), variant);
    case "improve":
    default: {
      const base = concise(professional(strengthenOpening(src, variant)));
      return variant % 2 === 0 ? impact(base, variant) : base;
    }
  }
}

/** Short reasons shown under a suggestion so users know what changed. */
export function explainRewrite(before: string, after: string) {
  const notes: string[] = [];
  if (firstWord(before) !== firstWord(after) && startsStrong(after)) notes.push(`Opens with “${after.split(" ")[0]}”`);
  if (wordCount(after) < wordCount(before) - 2) notes.push(`${wordCount(before) - wordCount(after)} fewer words`);
  if (/\[[^\]]+\]/.test(after)) notes.push("Placeholder for a result only you know");
  if (!notes.length) notes.push("Cleaner phrasing");
  return notes;
}

export function generateSummary(c: ResumeContent, targetRole: string, variant = 0) {
  const years = yearsOfExperience(c);
  const latest = c.experience[0];
  const role = targetRole || c.contact.title || latest?.role || "Professional";
  const skills = c.skills.flatMap((g) => g.skills).slice(0, 3);
  const skillPhrase = skills.length ? joinList(skills) : familyFor(role)?.label ?? "cross-functional work";
  const metricBullet = c.experience.flatMap((e) => e.bullets).find((b) => METRIC.test(b));
  const yearsPhrase = years ? `${years}+ years of experience` : "hands-on experience";
  const roleNoun = role.toLowerCase();

  const achievement = metricBullet
    ? lowerFirst(stripEnd(metricBullet))
    : "delivered work that teams relied on";

  const variants = [
    `${capitalize(roleNoun)} with ${yearsPhrase} in ${skillPhrase}.${latest ? ` Most recently ${latest.role} at ${latest.company}: ${achievement}.` : ""} Known for turning ambiguous problems into shipped, measurable outcomes.`,
    `${capitalize(roleNoun)} bringing ${yearsPhrase} across ${skillPhrase}.${latest ? ` At ${latest.company}, ${achievement}.` : ""} Comfortable owning work end to end and partnering closely with product, design and operations.`,
    `${yearsPhrase.replace(/^./, (s) => s.toUpperCase())} as a ${roleNoun}, focused on ${skillPhrase}.${latest ? ` Recent work at ${latest.company}: ${achievement}.` : ""} Looking to bring the same rigor to a ${role} role.`,
  ];
  return variants[variant % variants.length]!.replace(/\s+/g, " ").trim();
}

export function generateBullets(role: string, notes: string, variant = 0) {
  const lines = notes
    .split(/\n|;|•|(?<=\.)\s+/)
    .map((l) => l.trim())
    .filter((l) => wordCount(l) >= 3);
  if (lines.length) return lines.slice(0, 5).map((l, i) => impact(strengthenOpening(l, variant + i), variant + i));
  const fam = familyFor(role)?.id;
  const bank: Record<string, string[]> = {
    frontend: [
      "Built [feature] in React and TypeScript used by [N] customers each week",
      "Reduced page load time by [X%] by [technique, e.g. code splitting]",
      "Introduced [testing tool] and raised test coverage from [X%] to [Y%]",
      "Partnered with design to ship [N] components to the shared design system",
    ],
    manager: [
      "Led a team of [N] engineers delivering [product area]",
      "Hired and onboarded [N] engineers, cutting time-to-first-commit to [N] days",
      "Introduced [process] that improved on-time delivery from [X%] to [Y%]",
      "Mentored [N] engineers, [N] of whom were promoted",
    ],
    design: [
      "Redesigned [flow], lifting completion rate by [X%]",
      "Ran [N] usability studies that shaped the [product] roadmap",
      "Built a design system of [N] components adopted by [N] teams",
    ],
    data: [
      "Built [model or dashboard] that informed [decision], worth [$X]",
      "Automated [report], saving [N] hours per week",
      "Designed A/B tests across [N] experiments, lifting [metric] by [X%]",
    ],
  };
  const fallback = [
    "Delivered [project] for [team or customer], achieving [result]",
    "Improved [process] by [X%] by [what you changed]",
    "Owned [responsibility] for [N] [accounts, users or sites]",
    "Collaborated with [teams] to launch [initiative] on schedule",
  ];
  const list = (fam && bank[fam]) || fallback;
  return rotate(list, variant);
}

export function generateDescription(role: string, company: string, notes: string, variant = 0) {
  const scope = notes.trim() ? lowerFirst(stripEnd(notes.split(/\n/)[0]!)) : `the ${familyFor(role)?.label ?? "team"}'s core work`;
  const options = [
    `${role} at ${company || "[company]"}, responsible for ${scope}.`,
    `Joined ${company || "[company]"} as ${withArticle(role)} to own ${scope}.`,
    `Owned ${scope} as part of ${company || "[company]"}'s ${familyFor(role)?.label ?? "core"} team.`,
  ];
  return options[variant % options.length]!;
}

export const VERB_SUGGESTIONS: { group: string; verbs: string[] }[] = [
  { group: "Leading", verbs: ["Led", "Directed", "Mentored", "Coached", "Spearheaded", "Championed"] },
  { group: "Building", verbs: ["Built", "Engineered", "Designed", "Launched", "Shipped", "Prototyped"] },
  { group: "Improving", verbs: ["Streamlined", "Optimized", "Reduced", "Accelerated", "Simplified", "Overhauled"] },
  { group: "Analyzing", verbs: ["Analyzed", "Identified", "Measured", "Forecasted", "Audited", "Modeled"] },
  { group: "Growing", verbs: ["Grew", "Increased", "Expanded", "Generated", "Secured", "Won"] },
  { group: "Communicating", verbs: ["Presented", "Authored", "Negotiated", "Facilitated", "Partnered", "Translated"] },
];

export function suggestVerbs(text: string) {
  const first = firstWord(text);
  const ranked = [...VERB_SUGGESTIONS].sort((a, b) => {
    const fa = verbsFor(text).some((v) => a.verbs.includes(v)) ? -1 : 0;
    const fb = verbsFor(text).some((v) => b.verbs.includes(v)) ? -1 : 0;
    return fa - fb;
  });
  return { current: first, strong: STRONG_VERBS.includes(first), groups: ranked };
}

export function recommendSkills(role: string, existing: string[]) {
  const have = new Set(existing.map((s) => s.toLowerCase()));
  return skillsForRole(role).filter((s) => !have.has(s.toLowerCase()));
}

/** Action + scope + result, with placeholders for what only the user knows. */
export function rewriteAchievement(text: string, variant = 0) {
  const t = stripEnd(strengthenOpening(text, variant));
  const hasResult = METRIC.test(t);
  if (hasResult) return sentenceCase(t);
  const frames = [
        (s: string) => `${s}, resulting in [measurable result]`,
        (s: string) => `${s} for [team, customer or scale], which [what changed because of it]`,
        (s: string) => `${s}, improving [metric] from [before] to [after]`,
  ];
  return sentenceCase(frames[variant % frames.length]!(t));
}

export function variantFor(text: string, n: number) {
  return (hash(text) + n) % 997;
}

function rotate<T>(list: T[], n: number) {
  const k = n % list.length;
  return [...list.slice(k), ...list.slice(0, k)];
}
function joinList(items: string[]) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
function capitalize(s: string) {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}
function lowerFirst(s: string) {
  return /^[A-Z][a-z]/.test(s) ? s[0]!.toLowerCase() + s.slice(1) : s;
}
function withArticle(s: string) {
  return /^[aeiou]/i.test(s) ? `an ${s}` : `a ${s}`;
}
