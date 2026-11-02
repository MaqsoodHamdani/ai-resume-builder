"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { Check, ChevronDown, Minus } from "lucide-react";
import { Segmented } from "@/components/editor/design-controls";
import { buttonVariants } from "@/components/ui/button";
import { COMPARISON, PLANS } from "@/lib/config";
import { cn } from "@/lib/utils";

const FAQ = [
  { q: "Can I try Candor before paying?", a: "Yes. The Free plan includes a full analysis of one resume, four templates and basic suggestions, with no card required." },
  { q: "What does the score mean?", a: "It is Candor’s own measure across seven categories, designed to show what to improve next. It does not predict how any employer’s applicant tracking system ranks you." },
  { q: "Can I switch plans or cancel?", a: "Any time, from Billing in Settings. Upgrades are prorated; downgrades and cancellations apply at the end of the period, and your resumes stay available." },
  { q: "How does yearly billing work?", a: "You pay for twelve months up front at a lower rate: $96 a year for Pro, or $192 for Premium, which is a third off the monthly price." },
  { q: "Do you write my resume for me?", a: "Candor suggests wording and structure, but you approve every change. It never invents achievements or skills, and leaves placeholders where only you know the result." },
  { q: "Is there a student discount?", a: "Students and recent graduates can use the Free plan indefinitely. Contact us from a school email address for a discount on Pro." },
];

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="mx-auto size-4 text-primary" strokeWidth={2.5} aria-label="Included" />;
  if (v === false) return <Minus className="mx-auto size-4 text-[#cbd5e1]" aria-label="Not included" />;
  return <span className="text-[13px]">{v}</span>;
}

export default function PricingPage() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <section className="mx-auto max-w-[1200px] px-4 pt-16 pb-10 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Simple pricing for every stage of a job search</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-2">Start free. Upgrade when you are applying to several roles at once.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Segmented
            label="Billing cycle"
            value={cycle}
            onChange={setCycle}
            options={[
              { id: "monthly", label: "Monthly" },
              { id: "yearly", label: "Yearly" },
            ]}
          />
          <span className="text-[13px] font-medium text-success">Save 33% yearly</span>
        </div>
      </section>

      <section className="mx-auto grid grid-cols-1 max-w-[1200px] gap-5 px-4 pb-20 sm:px-6 md:grid-cols-3 lg:px-8">
        {PLANS.map((p) => {
          const featured = p.id === "pro";
          const price = cycle === "yearly" ? p.yearly / 12 : p.monthly;
          return (
            <div key={p.id} className={cn("flex flex-col rounded-2xl border p-7", featured ? "border-foreground bg-foreground text-white" : "bg-card")}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                {featured && <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">Recommended</span>}
              </div>
              <p className={cn("mt-1 text-sm", featured ? "text-[#cbd5e1]" : "text-muted-foreground")}>{p.blurb}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="tabular text-4xl font-semibold tracking-[-0.03em]">${Number.isInteger(price) ? price : price.toFixed(2)}</span>
                <span className={cn("text-sm", featured ? "text-[#cbd5e1]" : "text-muted-foreground")}>/ month</span>
              </div>
              <p className={cn("mt-1 h-5 text-[13px]", featured ? "text-[#cbd5e1]" : "text-muted-foreground")}>
                {p.monthly ? (cycle === "yearly" ? `Billed $${p.yearly} yearly` : "Billed monthly") : "Free forever"}
              </p>
              <Link
                href={`/signup${p.id === "free" ? "" : `?plan=${p.id}`}`}
                className={cn(buttonVariants({ size: "lg", variant: featured ? "default" : "outline" }), "mt-6 w-full", !featured && "bg-transparent")}
              >
                {p.id === "free" ? "Start for free" : `Choose ${p.name}`}
              </Link>
              <ul className="mt-7 flex flex-col gap-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className={cn("mt-0.5 size-4 shrink-0", featured ? "text-[#93c5fd]" : "text-primary")} strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="border-t bg-subtle">
        <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-[-0.025em]">Compare plans</h2>
          <div className="mt-8 overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b">
                  <th className="w-[40%] px-5 py-3.5 text-left font-medium text-muted-foreground">Feature</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="px-4 py-3.5 text-center font-semibold">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((g) => (
                  <Fragment key={g.group}>
                    <tr>
                      <th colSpan={4} className="bg-subtle px-5 pt-5 pb-2 text-left text-[13px] font-semibold">
                        {g.group}
                      </th>
                    </tr>
                    {g.rows.map((r) => (
                      <tr key={r.label} className="border-t">
                        <td className="px-5 py-3 text-ink-2">{r.label}</td>
                        {r.values.map((v, i) => (
                          <td key={i} className="px-4 py-3 text-center">
                            <Cell v={v} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-semibold tracking-[-0.025em]">Questions</h2>
        <ul className="mt-8 border-t">
          {FAQ.map((f, i) => (
            <li key={f.q} className="border-b">
              <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-medium">
                {f.q}
                <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open === i && "rotate-180")} />
              </button>
              {open === i && <p className="-mt-1 pb-5 text-[15px] leading-relaxed text-ink-2">{f.a}</p>}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
