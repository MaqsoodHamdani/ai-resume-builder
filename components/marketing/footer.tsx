import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

const COLS = [
  {
    title: "Product",
    links: [
      { href: "/features#analyzer", label: "Resume Analyzer" },
      { href: "/features#builder", label: "Resume Builder" },
      { href: "/features#matcher", label: "Job Matcher" },
      { href: "/features#templates", label: "Templates" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/resources#bullets", label: "Writing achievement bullets" },
      { href: "/resources#ats", label: "How ATS parsing works" },
      { href: "/resources#tailoring", label: "Tailoring to a job" },
      { href: "/pricing#faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-[1200px] px-4 pt-14 pb-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
              <LogoMark /> Candor
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">Honest, specific feedback on your resume, and the tools to act on it.</p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <h2 className="text-sm font-medium">{c.title}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 border-t pt-6 text-[13px] text-muted-foreground sm:flex-row">
          <p>© 2026 Candor. All rights reserved.</p>
          <p>Scores are an internal guide, not a guarantee of how any employer’s system will rank you.</p>
        </div>
      </div>
    </footer>
  );
}
