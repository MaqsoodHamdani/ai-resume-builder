"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, FileUp, Gauge, ListChecks, Plus, PenLine } from "lucide-react";
import { BandLabel, EmptyState, PageHeader, Panel, Pill, ScorePill, ScoreRing } from "@/components/app/ui";
import { ResumeActions, resumeStatus } from "@/components/resume/resume-actions";
import { buttonVariants } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn, pluralize, timeAgo } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const ACTIVITY_DOT: Record<string, string> = {
  analysis: "bg-primary",
  upload: "bg-[#0f766e]",
  version: "bg-[#94a3b8]",
  update: "bg-[#94a3b8]",
  create: "bg-[#0f766e]",
  match: "bg-[#d97706]",
  duplicate: "bg-[#94a3b8]",
  delete: "bg-destructive",
};

export default function DashboardPage() {
  const user = useStore((s) => s.user);
  const resumes = useStore((s) => s.resumes);
  const reports = useStore((s) => s.reports);
  const matches = useStore((s) => s.matches);
  const activity = useStore((s) => s.activity);

  const recent = [...resumes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const analyzed = resumes.filter((r) => reports.some((x) => x.resumeId === r.id));
  const avg = analyzed.length ? Math.round(analyzed.reduce((s, r) => s + reports.find((x) => x.resumeId === r.id)!.score, 0) / analyzed.length) : null;
  const latest = [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const latestResume = resumes.find((r) => r.id === latest?.resumeId);
  const first = user.name.split(" ")[0];

  const stats = [
    { label: "Total resumes", value: resumes.length, sub: `${resumes.filter((r) => r.source === "tailored").length} tailored` },
    { label: "Resumes analyzed", value: analyzed.length, sub: resumes.length - analyzed.length ? `${resumes.length - analyzed.length} not analyzed yet` : "All analyzed" },
    { label: "Average score", value: avg ?? "—", sub: avg != null ? "Across analyzed resumes" : "Analyze a resume to see it" },
    { label: "Job matches", value: matches.length, sub: `${matches.filter((m) => m.saved).length} saved` },
  ];

  const actions = [
    { href: "/dashboard/analyzer/upload", label: "Analyze a resume", desc: "Upload a PDF or DOCX for a full report", icon: FileUp },
    { href: "/dashboard/builder", label: "Build a resume", desc: "Guided steps with live templates", icon: PenLine },
    { href: "/dashboard/job-matcher", label: "Match a job", desc: "Compare a resume to a job description", icon: BriefcaseBusiness },
    {
      href: latestResume ? `/dashboard/analyzer/${latestResume.id}` : "/dashboard/analyzer/upload",
      label: "Improve my resume",
      desc: latestResume ? `Work through ${pluralize(latest!.findings.length, "finding")}` : "Start with an analysis",
      icon: ListChecks,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${greeting()}, ${first}`}
        description="Let's make your next career move count."
        actions={
          <Link href="/dashboard/builder" className={buttonVariants()}>
            <Plus /> Create new resume
          </Link>
        }
      />

      <section aria-label="Overview" className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={cn("px-5 py-4", i % 2 === 1 && "border-l", i >= 2 && "border-t lg:border-t-0", i === 2 && "lg:border-l")}>
            <div className="text-[13px] text-muted-foreground">{s.label}</div>
            <div className="tabular mt-1 text-[26px] font-semibold tracking-[-0.02em]">{s.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </section>

      <section aria-label="Quick actions" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="group flex items-start gap-3 rounded-xl border bg-card px-4 py-3.5 transition-[border-color,background-color] hover:border-[#cbd5e1] hover:bg-[#fcfdff] active:scale-[0.99]"
          >
            <a.icon className="mt-0.5 size-[18px] shrink-0 text-primary" strokeWidth={1.75} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-sm font-medium">
                {a.label}
                <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </span>
              <span className="mt-0.5 block text-[13px] text-muted-foreground">{a.desc}</span>
            </span>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Recent resumes"
          actions={
            <Link href="/dashboard/resumes" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View all
            </Link>
          }
          bodyClassName="px-0 pb-2"
        >
          {recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="w-[40%] px-5 py-2 font-normal">Resume</th>
                    <th className="px-3 py-2 font-normal">Last updated</th>
                    <th className="px-3 py-2 text-right font-normal">Score</th>
                    <th className="px-3 py-2 font-normal">Status</th>
                    <th className="w-12 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {recent.slice(0, 5).map((r) => {
                    const rep = reports.find((x) => x.resumeId === r.id);
                    const st = resumeStatus(r, rep);
                    return (
                      <tr key={r.id} className="border-t transition-colors hover:bg-subtle">
                        <td className="max-w-0 px-5 py-2.5">
                          <Link href={`/dashboard/resumes/${r.id}`} className="block truncate font-medium hover:text-primary">
                            {r.name}
                          </Link>
                          <span className="block truncate text-xs text-muted-foreground">{r.targetRole || "No target role"}</span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{timeAgo(r.updatedAt)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <ScorePill score={rep?.score} />
                        </td>
                        <td className="px-3 py-2.5">
                          <Pill tone={st.tone}>{st.label}</Pill>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <ResumeActions resume={r} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<FileUp />}
              title="No resumes yet"
              description="Upload an existing resume for an instant analysis, or build one from scratch."
              action={
                <>
                  <Link href="/dashboard/analyzer/upload" className={buttonVariants()}>
                    Upload resume
                  </Link>
                  <Link href="/dashboard/builder" className={buttonVariants({ variant: "outline" })}>
                    Build from scratch
                  </Link>
                </>
              }
            />
          )}
        </Panel>

        <Panel title="Improvement overview" description={latestResume ? latestResume.name : undefined}>
          {latest && latestResume ? (
            <>
              <div className="flex items-center gap-4">
                <ScoreRing score={latest.score} size={92} stroke={7} />
                <div>
                  <BandLabel score={latest.score} />
                  {latest.previous && (
                    <p className="mt-2 text-[13px] text-muted-foreground">
                      <span className={cn("font-medium", latest.score >= latest.previous.score ? "text-success" : "text-destructive")}>
                        {latest.score >= latest.previous.score ? "+" : ""}
                        {latest.score - latest.previous.score} points
                      </span>{" "}
                      since the previous analysis
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">Analyzed {timeAgo(latest.createdAt).toLowerCase()}</p>
                </div>
              </div>
              <h3 className="mt-5 text-[13px] font-medium text-muted-foreground">Recommended next</h3>
              <ul className="mt-1">
                {latest.findings.slice(0, 3).map((f) => (
                  <li key={f.id} className="border-t first:border-t-0">
                    <Link
                      href={`/dashboard/resumes/${latestResume.id}/edit?section=${f.section}`}
                      className="group flex items-center justify-between gap-3 py-2.5 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:text-primary">{f.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{f.severity === "high" ? "High" : f.severity === "medium" ? "Medium" : "Low"} priority</span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-primary">Fix</span>
                    </Link>
                  </li>
                ))}
                {!latest.findings.length && <li className="py-2 text-sm text-muted-foreground">No open findings. Nice work.</li>}
              </ul>
              <Link href={`/dashboard/analyzer/${latestResume.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 w-full")}>
                View full report
              </Link>
            </>
          ) : (
            <EmptyState
              className="py-6"
              icon={<Gauge />}
              title="No analysis yet"
              description="Your latest score and top recommendations will appear here."
              action={
                <Link href="/dashboard/analyzer/upload" className={buttonVariants({ size: "sm" })}>
                  Analyze a resume
                </Link>
              }
            />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Recent activity">
          {activity.length ? (
            <ol className="relative">
              {activity.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-baseline gap-3 border-t py-2.5 first:border-t-0">
                  <span className={cn("size-2 shrink-0 translate-y-[-1px] rounded-full", ACTIVITY_DOT[a.kind])} />
                  <span className="min-w-0 flex-1 text-sm">{a.text}</span>
                  <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">{timeAgo(a.at)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">Uploads, analyses and edits will show up here.</p>
          )}
        </Panel>
        <Panel
          title="Saved job matches"
          actions={
            <Link href="/dashboard/job-matcher" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              New match
            </Link>
          }
        >
          {matches.filter((m) => m.saved).length ? (
            <ul>
              {matches
                .filter((m) => m.saved)
                .slice(0, 4)
                .map((m) => (
                  <li key={m.id} className="border-t first:border-t-0">
                    <Link href={`/dashboard/job-matcher?match=${m.id}`} className="group flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium group-hover:text-primary">{m.jobTitle}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {m.company} · {timeAgo(m.createdAt)}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-sm font-semibold">{m.score}%</span>
                    </Link>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">Save a job match to compare it here.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
