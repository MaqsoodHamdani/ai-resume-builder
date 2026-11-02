// Self-check for the local analysis services: `npx tsx scripts/check-services.ts`
import assert from "node:assert/strict";
import { createSeed, SAMPLE_JOB, SAMPLE_RESUME_TEXT } from "../lib/data/seed";
import { analyzeResume } from "../lib/services/analyzer";
import { matchJob } from "../lib/services/matcher";
import { parseResumeText } from "../lib/services/parser";
import { generateSummary, rewrite } from "../lib/services/writer";
import { designFor } from "../lib/config";

const seed = createSeed();
const [main, , manager, original] = seed.resumes;
const scores = seed.reports.map((r) => `${r.resumeId}: ${r.score}`);
console.log("seed scores", scores);
assert.ok(seed.reports[0]!.score > seed.reports[3]!.score, "reworked resume should outscore the original upload");
assert.ok(seed.reports[0]!.previous, "main report carries the previous score");

// Same input, same report.
assert.equal(analyzeResume(main!).score, analyzeResume(main!).score);

// Parser on a pasted resume.
const parsed = parseResumeText(SAMPLE_RESUME_TEXT);
console.log("parsed contact", parsed.content.contact);
console.log("parsed roles", parsed.content.experience.map((e) => [e.role, e.company, e.start, e.end, e.current, e.bullets.length]));
console.log("parsed edu", parsed.content.education);
console.log("parsed skills", parsed.content.skills);
assert.equal(parsed.content.contact.fullName, "Jordan Lee");
assert.equal(parsed.content.experience.length, 2);
assert.equal(parsed.content.experience[0]!.bullets.length, 4);
assert.ok(parsed.content.experience[0]!.current);
assert.ok(parsed.content.education.length === 1);

const pr = analyzeResume({
  id: "p", name: "Jordan", targetRole: "Data Analyst", content: parsed.content, sectionOrder: parsed.order,
  design: designFor("plain"), source: "paste", createdAt: "", updatedAt: "", versions: [],
});
console.log("pasted score", pr.score, pr.categories.map((c) => `${c.key}=${c.score}`).join(" "));
console.log("findings", pr.findings.map((f) => `${f.severity}: ${f.title}`));

const m = matchJob(main!, SAMPLE_JOB.jobTitle, SAMPLE_JOB.company, SAMPLE_JOB.description);
console.log("match", m.score, m.keywords, m.skills, m.experience.gaps);
assert.ok(m.keywords.missing.includes("GraphQL"), "GraphQL is required and absent");
const weak = matchJob(original!, SAMPLE_JOB.jobTitle, SAMPLE_JOB.company, SAMPLE_JOB.description);
assert.ok(weak.score < m.score, "weaker resume should match worse");

for (const t of ["Responsible for maintaining the CI pipeline and release process", "Worked on the checkout redesign with the design and payments teams", "Helped improve accessibility across the storefront"]) {
  console.log(t, "\n  verbs ->", rewrite(t, "verbs"), "\n  impact ->", rewrite(t, "impact"), "\n  improve ->", rewrite(t, "improve", 1));
}
console.log(generateSummary(manager!.content, "Engineering Manager"));
console.log("ok");
