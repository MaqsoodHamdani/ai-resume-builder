"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { Download, Gauge, PenLine } from "lucide-react";
import { toast } from "sonner";
import { BandLabel, EmptyState, PageHeader, Panel, ScoreRing } from "@/components/app/ui";
import { ResumeActions } from "@/components/resume/resume-actions";
import { ScaledPaper } from "@/components/resume/scaled-paper";
import { Button, buttonVariants } from "@/components/ui/button";
import { getTemplate } from "@/lib/config";
import { printResume } from "@/lib/print";
import { useLatestReport, useResume, useStore } from "@/lib/store";
import { cn, formatDate, timeAgo } from "@/lib/utils";

const SOURCE = { upload: "Uploaded file", paste: "Pasted text", builder: "Resume Builder", duplicate: "Duplicate", tailored: "Tailored for a job" };

function Detail() {
  const { id } = useParams<{ id: string }>();
  const resume = useResume(id);
  const report = useLatestReport(id);
  const allMatches = useStore((s) => s.matches);
  const matches = allMatches.filter((m) => m.resumeId === id);
  const restore = useStore((s) => s.restoreVersion);

  if (!resume)
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState
          title="Resume not found"
          description="It may have been deleted."
          action={
            <Link href="/dashboard/resumes" className={buttonVariants()}>
              Go to My Resumes
            </Link>
          }
        />
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={resume.name}
        description={`${resume.targetRole || "No target role"} · Updated ${timeAgo(resume.updatedAt).toLowerCase()}`}
        actions={
          <>
            <Button variant="outline" onClick={() => printResume(resume)}>
              <Download /> Download PDF
            </Button>
            <Link href={`/dashboard/analyzer/${id}${report ? "" : "?run=1"}`} className={buttonVariants({ variant: "outline" })}>
              <Gauge /> {report ? "View report" : "Analyze"}
            </Link>
            <Link href={`/dashboard/resumes/${id}/edit`} className={buttonVariants()}>
              <PenLine /> Edit
            </Link>
            <ResumeActions resume={resume} />
          </>
        }
      />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-xl bg-[#e9edf3] p-4 sm:p-8">
          <div className="mx-auto max-w-[760px]">
            <ScaledPaper content={resume.content} order={resume.sectionOrder} design={resume.design} showBreaks />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <Panel title="Latest analysis">
            {report ? (
              <div className="flex items-center gap-4">
                <ScoreRing score={report.score} size={80} stroke={7} />
                <div className="min-w-0">
                  <BandLabel score={report.score} />
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    {report.findings.length} findings · {timeAgo(report.createdAt).toLowerCase()}
                  </p>
                  <Link href={`/dashboard/analyzer/${id}`} className="mt-1 inline-block text-[13px] font-medium text-primary hover:underline">
                    Open report
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">This resume has not been analyzed yet.</p>
                <Link href={`/dashboard/analyzer/${id}?run=1`} className={cn(buttonVariants({ size: "sm" }), "mt-3")}>
                  Analyze now
                </Link>
              </div>
            )}
          </Panel>
          <Panel title="Details">
            <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-[13px]">
              <dt className="text-muted-foreground">Template</dt>
              <dd>
                {getTemplate(resume.design.templateId).name}
                {getTemplate(resume.design.templateId).ats && <span className="text-muted-foreground"> · ATS-friendly</span>}
              </dd>
              <dt className="text-muted-foreground">Created from</dt>
              <dd className="[overflow-wrap:anywhere]">{resume.fileName ?? SOURCE[resume.source]}</dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(resume.createdAt)}</dd>
              <dt className="text-muted-foreground">Last modified</dt>
              <dd>{formatDate(resume.updatedAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</dd>
            </dl>
          </Panel>
          <Panel title="Versions" description="Snapshots you can restore">
            {resume.versions.length ? (
              <ul>
                {[...resume.versions].reverse().map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 border-t py-2.5 first:border-t-0">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{v.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(v.createdAt, { month: "short", day: "numeric" })}
                        {v.score != null && ` · Score ${v.score}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        restore(id, v.id);
                        toast.success(`Restored “${v.label}”`);
                      }}
                    >
                      Restore
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No versions yet. Save one from the editor’s menu.</p>
            )}
          </Panel>
          <Panel
            title="Job matches"
            actions={
              <Link href={`/dashboard/job-matcher?resume=${id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                New match
              </Link>
            }
          >
            {matches.length ? (
              <ul>
                {matches.map((m) => (
                  <li key={m.id} className="border-t first:border-t-0">
                    <Link href={`/dashboard/job-matcher?match=${m.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-primary">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{m.jobTitle}</span>
                        <span className="block truncate text-xs text-muted-foreground">{m.company}</span>
                      </span>
                      <span className="tabular text-sm font-semibold">{m.score}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Compare this resume with a job description to see how well it fits.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default function ResumeDetailPage() {
  return (
    <Suspense>
      <Detail />
    </Suspense>
  );
}
