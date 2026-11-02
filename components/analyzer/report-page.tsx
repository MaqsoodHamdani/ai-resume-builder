"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PenLine, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ProcessingStages } from "@/components/analyzer/processing";
import { ReportView } from "@/components/analyzer/report";
import { EmptyState, NativeSelect, PageHeader } from "@/components/app/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLatestReport, useResume, useStore } from "@/lib/store";
import { formatDate, sleep } from "@/lib/utils";

const STAGES = ["Reading the latest version", "Scoring seven categories", "Comparing with the previous analysis"];

export function ReportPage({ id }: { id: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const resume = useResume(id);
  const report = useLatestReport(id);
  const runAnalysis = useStore((s) => s.runAnalysis);
  const resumes = useStore((s) => s.resumes);
  const [stage, setStage] = useState(-1);
  const started = useRef(false);

  const run = async () => {
    setStage(0);
    await sleep(550);
    setStage(1);
    await sleep(650);
    setStage(2);
    const rep = runAnalysis(id);
    await sleep(500);
    setStage(-1);
    if (rep?.previous) {
      const d = rep.score - rep.previous.score;
      toast.success(d > 0 ? `Score up ${d} points` : d < 0 ? `Score down ${-d} points` : "Score unchanged", { description: `${rep.previous.score} → ${rep.score}` });
    } else toast.success("Analysis complete");
  };

  useEffect(() => {
    if (started.current || !resume) return;
    if (params.get("run") === "1" || !report) {
      started.current = true;
      router.replace(`/dashboard/analyzer/${id}`, { scroll: false });
      // Starting the analysis is the effect itself: it runs once when the page opens with ?run=1.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, report]);

  if (!resume)
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState
          title="Resume not found"
          description="It may have been deleted. Choose another resume to analyze."
          action={
            <Link href="/dashboard/analyzer" className={buttonVariants()}>
              Back to Resume Analyzer
            </Link>
          }
        />
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={resume.name}
        description={
          <>
            {resume.targetRole || "No target role"}
            {report && <> · Last analyzed {formatDate(report.createdAt, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</>}
          </>
        }
        actions={
          <>
            {resumes.length > 1 && (
              <NativeSelect
                aria-label="Switch resume"
                value={id}
                onChange={(e) => router.push(`/dashboard/analyzer/${e.target.value}`)}
                className="w-full sm:w-56"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </NativeSelect>
            )}
            <Link href="/dashboard/analyzer/upload" className={buttonVariants({ variant: "outline" })}>
              Upload new
            </Link>
            <Button variant="outline" onClick={run} disabled={stage >= 0}>
              <RefreshCw className={stage >= 0 ? "animate-spin" : ""} /> Re-analyze
            </Button>
            <Link href={`/dashboard/resumes/${id}/edit`} className={buttonVariants()}>
              <PenLine /> Edit resume
            </Link>
          </>
        }
      />
      {stage >= 0 || !report ? (
        <div className="py-10">
          <ProcessingStages stages={STAGES} current={Math.max(0, stage)} title="Analyzing your resume" />
        </div>
      ) : (
        <ReportView resume={resume} report={report} />
      )}
    </div>
  );
}
