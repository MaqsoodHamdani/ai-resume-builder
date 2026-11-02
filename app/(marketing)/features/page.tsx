import type { Metadata } from "next";
import Link from "next/link";
import { AtsPreview, CategoryPreview, MatchPreview, RewritePreview, TemplateThumb } from "@/components/marketing/previews";
import { buttonVariants } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Features" };

const FEATURES = [
  {
    id: "analyzer",
    title: "AI Resume Analyzer",
    body: "A score out of 100 built from seven weighted categories, with every finding tied to the line it is about. Re-analyze after edits to see exactly which categories moved.",
    visual: <CategoryPreview />,
  },
  {
    id: "ats",
    title: "ATS Compatibility Checker",
    body: "Checks the parts applicant tracking systems rely on: contact details, standard headings, readable length and a single text flow. Clear guidance on which templates suit strict portals.",
    visual: <AtsPreview />,
  },
  {
    id: "writer",
    title: "AI Bullet Point Writer",
    body: "Strengthen verbs, cut filler and add impact to any bullet. Suggestions appear next to your original and only replace it when you accept. Missing results stay as placeholders for you to fill.",
    visual: <RewritePreview />,
  },
  {
    id: "matcher",
    title: "Job Description Matcher",
    body: "Paste a posting to see which required skills your resume shows, the experience gaps, and what to move up. Tailor a copy while your original stays untouched.",
    visual: <MatchPreview />,
  },
];

const MORE = [
  { id: "builder", title: "Resume Builder", body: "A guided, nine-step flow from contact details to final preview. Progress saves as you go, and writing help is available at each step." },
  { id: "summary", title: "Professional Summary Generator", body: "Builds a summary from your own experience, skills and strongest result, in three different shapes you can cycle through and edit." },
  { id: "export", title: "PDF Export", body: "Download a print-ready Letter PDF that matches the preview exactly, with page breaks shown before you export." },
  { id: "versions", title: "Versions and tailoring", body: "Save snapshots, restore any of them, and keep a tailored copy for each kind of role you apply to." },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="mx-auto max-w-[1200px] px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Everything between your first draft and the job offer</h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-2">Analyze what you have, fix what holds it back, build something new, and tailor it to each job. All in one workspace.</p>
      </section>

      <section className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pb-20 sm:px-6 lg:px-8">
        {FEATURES.map((f) => (
          <div key={f.id} id={f.id} className="grid scroll-mt-24 grid-cols-1 items-center gap-8 rounded-2xl bg-subtle p-6 sm:p-10 md:grid-cols-2 md:gap-14">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">{f.title}</h2>
              <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{f.body}</p>
            </div>
            <div className="min-w-0">{f.visual}</div>
          </div>
        ))}
      </section>

      <section id="builder" className="scroll-mt-24 border-t">
        <div className="mx-auto grid grid-cols-1 max-w-[1200px] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.025em]">Build and refine</h2>
            <dl className="mt-8 flex flex-col gap-6">
              {MORE.map((m) => (
                <div key={m.id}>
                  <dt className="text-[15px] font-semibold">{m.title}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-ink-2">{m.body}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div id="templates" className="scroll-mt-24">
            <h2 className="text-lg font-semibold">Resume Templates</h2>
            <p className="mt-1 text-[15px] text-ink-2">Eight distinct layouts. Five are ATS-friendly single-flow designs.</p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {TEMPLATES.map((t) => (
                <figure key={t.id}>
                  <div className="aspect-[8.5/11] overflow-hidden rounded-md bg-[#eef2f7] p-2">
                    <div className="h-full overflow-hidden rounded-[2px] shadow-[0_1px_2px_rgba(15,23,42,0.12)]">
                      <TemplateThumb templateId={t.id} />
                    </div>
                  </div>
                  <figcaption className="mt-2 text-[13px] font-medium">{t.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-subtle">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center lg:px-8">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Start with a free analysis of your resume</h2>
          <div className="flex gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Get started
            </Link>
            <Link href="/pricing" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
