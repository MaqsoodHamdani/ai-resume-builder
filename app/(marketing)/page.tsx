import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AtsPreview, CategoryPreview, HeroPreview, MatchPreview, RewritePreview, TemplateThumb } from "@/components/marketing/previews";
import { buttonVariants } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/config";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    id: "analysis",
    title: "Resume analysis that points at the line",
    body: "Upload a PDF or DOCX and get a score across seven categories, from impact to formatting. Every finding quotes the bullet it is about and opens the editor on that section.",
    points: ["Seven weighted categories", "Findings ranked by priority", "Re-analyze and see what moved"],
    visual: <CategoryPreview />,
  },
  {
    id: "ats",
    title: "Checks for the systems that read first",
    body: "Applicant tracking systems pull your contact details, headings and dates into a record before a person reads anything. Candor checks the parts they depend on.",
    points: ["Contact details and standard headings", "Length and text-based layout", "Template guidance for strict portals"],
    visual: <AtsPreview />,
  },
  {
    id: "builder",
    title: "Rewrites you approve, line by line",
    body: "Ask for a stronger verb, a tighter sentence or more impact. Suggestions sit next to your original and never replace it until you accept. Where a result is missing, Candor leaves a placeholder instead of inventing one.",
    points: ["Original and suggestion side by side", "Accept, reject or regenerate", "Never fills in numbers for you"],
    visual: <RewritePreview />,
  },
  {
    id: "matcher",
    title: "Match a resume to the job in front of you",
    body: "Paste a job description to see which required skills your resume shows, which it does not, and what to move up. Tailor a copy without touching your original.",
    points: ["Required skills weighted double", "Experience gaps stated plainly", "Tailored copy saved as its own version"],
    visual: <MatchPreview />,
  },
];

const STEPS = [
  { title: "Upload your resume", body: "Drop in a PDF or DOCX, or paste the text. Candor reads it in your browser and maps it into sections." },
  { title: "Get personalized insights", body: "See your score, what is working, and a ranked list of fixes, each tied to the line it is about." },
  { title: "Improve and download", body: "Fix each finding in the editor, re-analyze to confirm, then download a clean PDF." },
];

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-4 pt-14 pb-20 sm:px-6 md:pt-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-8">
        <div>
          <h1 className="max-w-[13ch] text-[2.75rem] leading-[1.04] font-semibold tracking-[-0.035em] sm:text-6xl">
            Build a Resume That Gets You Noticed.
          </h1>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-ink-2">
            Analyze your resume, uncover opportunities for improvement, and create a professional resume tailored to the jobs you want.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup?intent=analyze" className={buttonVariants({ size: "lg" })}>
              Analyze My Resume
            </Link>
            <Link href="/signup?intent=build" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Build My Resume
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Free plan includes one resume and a full first analysis.</p>
        </div>
        <HeroPreview />
      </section>

      <section className="border-y bg-subtle">
        <div className="mx-auto grid grid-cols-1 max-w-[1200px] gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_2fr] lg:px-8">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Feedback you can act on, not a vague grade</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-[15px] font-semibold">Specific to your text</p>
              <p className="mt-1.5 text-[15px] text-ink-2">Findings quote your own bullets and summary, so you know exactly which line to change and why.</p>
            </div>
            <div>
              <p className="text-[15px] font-semibold">Honest about limits</p>
              <p className="mt-1.5 text-[15px] text-ink-2">Your score is a guide to improvement, not a promise about any employer’s screening system.</p>
            </div>
            <div>
              <p className="text-[15px] font-semibold">Truthful by design</p>
              <p className="mt-1.5 text-[15px] text-ink-2">Candor never suggests adding skills or results you do not have. Missing numbers stay as placeholders for you.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">One workspace from first draft to the job you apply for</h2>
        <div className="mt-16 flex flex-col gap-24">
          {FEATURES.map((f, i) => (
            <div key={f.id} className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
              <div className={cn("min-w-0", i % 2 === 1 && "md:order-2")}>
                <h3 className="text-2xl font-semibold tracking-[-0.02em]">{f.title}</h3>
                <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{f.body}</p>
                <ul className="mt-5 flex flex-col gap-2 text-[15px]">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-center gap-2.5">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={cn("min-w-0 rounded-2xl bg-[#eef2f7] p-4 sm:p-10", i % 2 === 1 && "md:order-1")}>
                <div className="mx-auto max-w-md">{f.visual}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-subtle">
        <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-[-0.025em]">How it works</h2>
          <ol className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.title} className="border-t-2 border-foreground pt-5">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.025em]">Templates built to be read</h2>
            <p className="mt-2 max-w-xl text-[17px] text-ink-2">Eight layouts with different structures, from a strict single column to an executive header. Switch at any time without retyping.</p>
          </div>
          <Link href="/signup?intent=build" className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}>
            Browse all templates <ArrowRight />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
          {TEMPLATES.slice(0, 4).map((t) => (
            <figure key={t.id}>
              <div className="rounded-xl bg-[#eef2f7] p-3 sm:p-4">
                <div className="aspect-[8.5/11] overflow-hidden rounded-[3px] shadow-[0_1px_3px_rgba(15,23,42,0.12)]">
                  <TemplateThumb templateId={t.id} />
                </div>
              </div>
              <figcaption className="mt-3">
                <span className="text-sm font-medium">{t.name}</span>
                <span className="ml-2 text-sm text-muted-foreground">{t.category}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bg-foreground text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">See what your resume is missing</h2>
            <p className="mt-3 max-w-lg text-[17px] text-[#cbd5e1]">Create a free account, upload your resume and get your first report in under a minute.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Create free account
            </Link>
            <Link href="/pricing" className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "text-white hover:bg-white/10 hover:text-white")}>
              Compare plans
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
