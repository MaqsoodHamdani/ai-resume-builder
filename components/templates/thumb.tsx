"use client";

import { ScaledPaper } from "@/components/resume/scaled-paper";
import { designFor } from "@/lib/config";
import { createSeed } from "@/lib/data/seed";

const sample = createSeed().resumes[0]!;

/** A template rendered with sample content, for galleries and pickers. */
export function TemplateThumbEmpty({ templateId }: { templateId: string }) {
  return (
    <div className="h-full overflow-hidden rounded-[2px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.12)]">
      <ScaledPaper content={sample.content} order={sample.sectionOrder} design={designFor(templateId)} />
    </div>
  );
}

export const SAMPLE_RESUME = sample;
