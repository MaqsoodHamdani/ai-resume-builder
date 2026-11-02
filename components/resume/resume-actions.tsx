"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Download, ExternalLink, Gauge, MoreHorizontal, Pencil, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useResumeLimit } from "@/lib/limits";
import { printResume } from "@/lib/print";
import { useStore } from "@/lib/store";
import type { AnalysisReport, Resume } from "@/lib/types";

export function resumeStatus(r: Resume, report?: AnalysisReport): { label: string; tone: "success" | "warning" | "neutral" | "primary" } {
  if (!report) return { label: "Not analyzed", tone: "neutral" };
  if (new Date(r.updatedAt).getTime() > new Date(report.createdAt).getTime() + 60_000) return { label: "Edited since analysis", tone: "warning" };
  if (report.score >= 85) return { label: "Ready to send", tone: "success" };
  return { label: "Analyzed", tone: "primary" };
}

export function ResumeActions({ resume, align = "end" }: { resume: Resume; align?: "start" | "end" }) {
  const router = useRouter();
  const duplicate = useStore((s) => s.duplicateResume);
  const remove = useStore((s) => s.deleteResume);
  const update = useStore((s) => s.updateResume);
  const limit = useResumeLimit();
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState(resume.name);

  const saveName = () => {
    const n = name.trim();
    if (!n) return;
    update(resume.id, { name: n }, `Renamed ${resume.name} to ${n}`);
    setRenaming(false);
    toast.success("Resume renamed");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${resume.name}`} />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-48">
          <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}`)}>
            <ExternalLink /> Open
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/resumes/${resume.id}/edit`)}>
            <PenLine /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/analyzer/${resume.id}?run=1`)}>
            <Gauge /> Analyze
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              if (limit.reached) {
                toast.error(`Your plan includes ${limit.limit} active ${limit.limit === 1 ? "resume" : "resumes"}`, { description: "Upgrade in Billing to keep more copies." });
                return;
              }
              const id = duplicate(resume.id);
              if (id) toast.success("Duplicated", { description: `${resume.name} (copy) is in My Resumes.` });
            }}
          >
            <Copy /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setName(resume.name);
              setRenaming(true);
            }}
          >
            <Pencil /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => printResume(resume)}>
            <Download /> Download PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename resume</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
          >
            <label htmlFor={`rename-${resume.id}`} className="sr-only">
              Resume name
            </label>
            <Input id={`rename-${resume.id}`} value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={80} aria-invalid={!name.trim()} />
            {!name.trim() && <p className="mt-1.5 text-[13px] text-destructive">Enter a name.</p>}
            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={() => setRenaming(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{resume.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the resume, its {resume.versions.length || "saved"} {resume.versions.length === 1 ? "version" : "versions"}, analysis reports and job matches. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                remove(resume.id);
                setDeleting(false);
                toast.success("Resume deleted");
              }}
            >
              Delete resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
