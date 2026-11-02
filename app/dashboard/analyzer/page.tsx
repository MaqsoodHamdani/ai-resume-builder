"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Gauge } from "lucide-react";
import { ReportPage } from "@/components/analyzer/report-page";
import { EmptyState, PageHeader } from "@/components/app/ui";
import { buttonVariants } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function AnalyzerPage() {
  const reports = useStore((s) => s.reports);
  const resumes = useStore((s) => s.resumes);
  // Show the most recent analysis; fall back to the most recently edited resume.
  const latest = [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.resumeId ?? [...resumes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.id;

  if (!latest)
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Resume Analyzer" description="Score a resume across seven categories and get specific, ranked fixes." />
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={<Gauge />}
            title="No resumes to analyze yet"
            description="Upload a PDF or DOCX, or paste your resume text, to get your first report."
            action={
              <Link href="/dashboard/analyzer/upload" className={buttonVariants()}>
                Upload resume
              </Link>
            }
          />
        </div>
      </div>
    );

  return (
    <Suspense>
      <ReportPage id={latest} />
    </Suspense>
  );
}
