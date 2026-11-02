"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field, NativeSelect, PageHeader, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { cn, sleep } from "@/lib/utils";

const FAQ = [
  { q: "How is my resume score calculated?", a: "Candor scores seven categories: impact, work experience, content quality, skills relevance, ATS compatibility, summary and formatting. Each has a weight, and the overall score is their weighted average. It is a guide for improving your resume, not a prediction of how any employer’s system ranks you." },
  { q: "Why does my uploaded resume look different in the editor?", a: "Candor reads the text of your PDF or DOCX and maps it into sections. Unusual layouts, tables and text inside images can be read out of order. Check each section after uploading, and use a template to restyle it." },
  { q: "Will Candor add skills I do not have?", a: "No. Missing skills are shown so you know what a role asks for. Add one only if you have genuinely used it. Rewrites leave bracketed placeholders where a result is needed, so you fill in real numbers." },
  { q: "How do I download a PDF?", a: "Open a resume and choose Download PDF. In the print dialog that opens, set the destination to Save as PDF. The file matches the preview exactly." },
  { q: "What is the difference between a version and a copy?", a: "A version is a snapshot inside the same resume that you can restore. A copy, created with Duplicate or Tailor my resume, is a separate resume you can edit independently." },
  { q: "Can I change my plan later?", a: "Yes. Upgrades apply immediately and are prorated. Downgrades apply at the end of the billing period and keep all of your data." },
];

const schema = z.object({
  topic: z.string(),
  subject: z.string().trim().min(4, "Add a short subject."),
  message: z.string().trim().min(20, "Describe the problem in at least 20 characters so we can help."),
});

export default function HelpPage() {
  const user = useStore((s) => s.user);
  const [open, setOpen] = useState<number | null>(0);
  const { register, handleSubmit, reset, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { topic: "Analysis", subject: "", message: "" } });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Help & Support" description="Answers to common questions, and a direct line to our team." />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Frequently asked questions" bodyClassName="px-0 pb-1">
          <ul>
            {FAQ.map((f, i) => (
              <li key={f.q} className="border-t first:border-t-0">
                <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-sm font-medium hover:bg-subtle">
                  {f.q}
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open === i && "rotate-180")} />
                </button>
                {open === i && <p className="px-5 pb-4 text-sm leading-relaxed text-ink-2">{f.a}</p>}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Contact support" description={`We reply to ${user.email} within one business day.`}>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(async () => {
              await sleep(700);
              reset();
              toast.success("Message sent", { description: "We will reply by email within one business day." });
            })}
          >
            <Field label="Topic" htmlFor="h-topic">
              <NativeSelect id="h-topic" {...register("topic")}>
                <option>Analysis</option>
                <option>Editor and templates</option>
                <option>Uploading files</option>
                <option>Billing</option>
                <option>Something else</option>
              </NativeSelect>
            </Field>
            <Field label="Subject" htmlFor="h-subj" error={formState.errors.subject?.message}>
              <Input id="h-subj" aria-invalid={!!formState.errors.subject} {...register("subject")} />
            </Field>
            <Field label="Message" htmlFor="h-msg" error={formState.errors.message?.message}>
              <Textarea id="h-msg" rows={5} aria-invalid={!!formState.errors.message} {...register("message")} className="min-h-28" />
            </Field>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Loader2 className="animate-spin" />}
              Send message
            </Button>
          </form>
          <p className="mt-4 text-[13px] text-muted-foreground">
            Writing advice lives in{" "}
            <Link href="/resources" className="font-medium text-primary hover:underline">
              Resources
            </Link>
            .
          </p>
        </Panel>
      </div>
    </div>
  );
}
