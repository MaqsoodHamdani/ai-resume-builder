"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import { FileText, RefreshCw, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { ProcessingStages } from "@/components/analyzer/processing";
import { LimitNotice } from "@/components/app/limit-notice";
import { Field, PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SAMPLE_RESUME_TEXT } from "@/lib/data/seed";
import { useResumeLimit } from "@/lib/limits";
import { extractText, parseResumeText, validateFile } from "@/lib/services/parser";
import { useStore } from "@/lib/store";
import { cn, sleep } from "@/lib/utils";

const STAGES = ["Uploading document", "Reading resume content", "Extracting resume sections", "Preparing analysis"];
const MIN_TEXT = 200;

function fmtSize(b: number) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

export default function UploadPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const createResume = useStore((s) => s.createResume);
  const runAnalysis = useStore((s) => s.runAnalysis);
  const limit = useResumeLimit();
  const input = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState("file");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [text, setText] = useState("");
  const [textError, setTextError] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(user.targetRole);
  const [stage, setStage] = useState(-1);
  const [procError, setProcError] = useState("");

  const pick = async (f: File | undefined) => {
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      setFileError(err);
      setFile(null);
      return;
    }
    setFileError("");
    setFile(f);
    if (!name) setName(f.name.replace(/\.(pdf|docx)$/i, "").replace(/[_-]+/g, " "));
    setProgress(0);
    for (let p = 10; p <= 100; p += 15) {
      await sleep(70);
      setProgress(Math.min(100, p));
    }
    setProgress(100);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void pick(e.dataTransfer.files[0]);
  };

  const run = async () => {
    if (tab === "file" && !file) {
      setFileError("Choose a PDF or DOCX file to analyze.");
      return;
    }
    if (tab === "paste" && text.trim().length < MIN_TEXT) {
      setTextError(`Paste your full resume. At least ${MIN_TEXT} characters are needed for a useful analysis.`);
      return;
    }
    setProcError("");
    try {
      setStage(0);
      await sleep(700);
      setStage(1);
      const raw = tab === "file" ? await extractText(file!) : text;
      await sleep(600);
      if (raw.replace(/\s/g, "").length < MIN_TEXT * 0.6) throw new Error("We could not find readable text in this file. It may be a scanned image. Try a DOCX, or paste the text instead.");
      setStage(2);
      const { content, order } = parseResumeText(raw);
      await sleep(700);
      setStage(3);
      const id = createResume({
        name: name.trim() || content.contact.fullName || "Uploaded resume",
        targetRole: role.trim() || content.contact.title,
        content,
        sectionOrder: order.length ? order : undefined,
        source: tab === "file" ? "upload" : "paste",
        fileName: file?.name,
      });
      runAnalysis(id);
      await sleep(600);
      setStage(4);
      toast.success("Analysis ready");
      router.push(`/dashboard/analyzer/${id}`);
    } catch (e) {
      setProcError(e instanceof Error ? e.message : "Something went wrong while reading the file. Try again.");
    }
  };

  if (limit.reached && stage < 0)
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Upload a resume" description="Get a scored report with specific fixes." />
        <LimitNotice limit={limit.limit} />
      </div>
    );

  if (stage >= 0)
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <ProcessingStages stages={STAGES} current={stage} title={procError ? "We could not analyze this resume" : "Analyzing your resume"} error={procError} />
        {procError && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStage(-1)}>
              Choose another file
            </Button>
            <Button
              onClick={() => {
                setStage(-1);
                setTab("paste");
              }}
            >
              Paste text instead
            </Button>
          </div>
        )}
      </div>
    );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Upload a resume" description="Get a score across seven categories and a ranked list of specific fixes." />

      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
          <TabsList>
            <TabsTrigger value="file">Upload file</TabsTrigger>
            <TabsTrigger value="paste">Paste text</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-5">
            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                  dragging ? "border-primary bg-brand-tint" : fileError ? "border-destructive/50" : "border-[#d9dee5] bg-subtle",
                )}
              >
                <UploadCloud className={cn("size-8", dragging ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
                <p className="mt-3 text-[15px] font-medium">{dragging ? "Drop to upload" : "Drag and drop your resume here"}</p>
                <p className="mt-1 text-sm text-muted-foreground">PDF or DOCX, up to 5 MB</p>
                <Button variant="outline" className="mt-5" onClick={() => input.current?.click()}>
                  Browse files
                </Button>
                <input
                  ref={input}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  aria-label="Choose a resume file"
                  onChange={(e) => {
                    void pick(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <FileText className="size-8 shrink-0 text-primary" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{progress < 100 ? `${progress}%` : fmtSize(file.size)}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#eef2f7]">
                    <div className={cn("h-full rounded-full transition-[width] duration-150", progress < 100 ? "bg-primary" : "bg-success")} style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Replace file" onClick={() => input.current?.click()}>
                  <RefreshCw className="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Remove file" onClick={() => setFile(null)}>
                  <X className="size-4" />
                </Button>
                <input
                  ref={input}
                  type="file"
                  accept=".pdf,.docx"
                  className="sr-only"
                  aria-label="Replace resume file"
                  onChange={(e) => {
                    void pick(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            )}
            {fileError && (
              <p className="mt-2 text-[13px] text-destructive" role="alert">
                {fileError}
              </p>
            )}
          </TabsContent>

          <TabsContent value="paste" className="mt-5">
            <Field
              label="Resume text"
              htmlFor="resume-text"
              error={textError}
              hint={
                <span className="flex flex-wrap justify-between gap-2">
                  <span>{text.trim().length.toLocaleString()} characters</span>
                  <button type="button" className="font-medium text-primary hover:underline" onClick={() => setText(SAMPLE_RESUME_TEXT)}>
                    Try a sample resume
                  </button>
                </span>
              }
            >
              <Textarea
                id="resume-text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (textError) setTextError("");
                }}
                aria-invalid={!!textError}
                placeholder="Paste the full text of your resume, including headings like Experience, Education and Skills."
                className="min-h-64 field-sizing-fixed font-normal"
              />
            </Field>
          </TabsContent>
        </Tabs>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-2">
          <Field label="Resume name" htmlFor="res-name" optional>
            <Input id="res-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="For example, Product Manager 2026" />
          </Field>
          <Field label="Target role" htmlFor="res-role" hint="Skills relevance is scored against this role.">
            <Input id="res-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="For example, Data Analyst" />
          </Field>
        </div>
        <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-muted-foreground">Your file is read in your browser. The score is a guide, not a prediction of any employer’s system.</p>
          <Button size="lg" onClick={run} disabled={tab === "file" && !!file && progress < 100}>
            Analyze resume
          </Button>
        </div>
      </div>
    </div>
  );
}
