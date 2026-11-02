"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { ReportPage } from "@/components/analyzer/report-page";

function Inner() {
  const { id } = useParams<{ id: string }>();
  return <ReportPage key={id} id={id} />;
}

export default function AnalyzerReportRoute() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
