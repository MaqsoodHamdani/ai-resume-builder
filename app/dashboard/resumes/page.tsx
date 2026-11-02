"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilePlus2, FileUp, LayoutGrid, List, Plus, Search, SearchX } from "lucide-react";
import { EmptyState, NativeSelect, PageHeader, Pill, ScorePill } from "@/components/app/ui";
import { Segmented } from "@/components/editor/design-controls";
import { ResumeActions, resumeStatus } from "@/components/resume/resume-actions";
import { ScaledPaper } from "@/components/resume/scaled-paper";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { getTemplate } from "@/lib/config";
import { useStore } from "@/lib/store";
import { pluralize, timeAgo } from "@/lib/utils";

type Sort = "updated" | "name" | "score";
type Filter = "all" | "analyzed" | "not-analyzed" | "tailored";

export default function ResumesPage() {
  const router = useRouter();
  const resumes = useStore((s) => s.resumes);
  const reports = useStore((s) => s.reports);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<"list" | "grid">("list");

  const scoreOf = (id: string) => reports.find((r) => r.resumeId === id)?.score;
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return resumes
      .filter((r) => !t || `${r.name} ${r.targetRole} ${getTemplate(r.design.templateId).name}`.toLowerCase().includes(t))
      .filter((r) => {
        const has = reports.some((x) => x.resumeId === r.id);
        return filter === "all" || (filter === "analyzed" && has) || (filter === "not-analyzed" && !has) || (filter === "tailored" && r.source === "tailored");
      })
      .sort((a, b) =>
        sort === "name" ? a.name.localeCompare(b.name) : sort === "score" ? (scoreOf(b.id) ?? -1) - (scoreOf(a.id) ?? -1) : b.updatedAt.localeCompare(a.updatedAt),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumes, reports, q, sort, filter]);

  const create = (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button />}>
        <Plus /> New resume
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => router.push("/dashboard/builder")}>
          <FilePlus2 /> Build from scratch
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard/analyzer/upload")}>
          <FileUp /> Upload existing resume
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (!resumes.length)
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Resumes" description="Every resume and version in one place." />
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={<FilePlus2 />}
            title="Create your first resume"
            description="Upload the resume you already have for an instant analysis, or build a new one step by step."
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
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="My Resumes" description={`${pluralize(resumes.length, "resume")}, ${pluralize(resumes.reduce((n, r) => n + r.versions.length, 0), "saved version")}`} actions={create} />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="r-search" className="sr-only">
            Filter resumes
          </label>
          <input
            id="r-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, role or template"
            className="h-9 w-full rounded-lg border border-input bg-background pr-3 pl-8 text-base outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/40 md:text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <Segmented
            label="Filter"
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: "All" },
              { id: "analyzed", label: "Analyzed" },
              { id: "not-analyzed", label: "Not analyzed" },
              { id: "tailored", label: "Tailored" },
            ]}
          />
        </div>
        <div className="flex items-center gap-2 md:ml-auto">
          <label htmlFor="r-sort" className="text-[13px] whitespace-nowrap text-muted-foreground">
            Sort by
          </label>
          <NativeSelect id="r-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-40">
            <option value="updated">Last modified</option>
            <option value="name">Name</option>
            <option value="score">Score</option>
          </NativeSelect>
          <div className="flex rounded-lg border p-0.5">
            <Button variant={view === "list" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"}>
              <List className="size-4" />
            </Button>
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"}>
              <LayoutGrid className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {!rows.length ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={<SearchX />}
            title="No resumes match"
            description="Try a different search or filter."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQ("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        </div>
      ) : view === "list" ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="w-[34%] px-5 py-2.5 font-normal">Resume</th>
                <th className="px-3 py-2.5 font-normal">Template</th>
                <th className="px-3 py-2.5 font-normal">Last modified</th>
                <th className="px-3 py-2.5 text-right font-normal">Score</th>
                <th className="px-3 py-2.5 text-right font-normal">Versions</th>
                <th className="px-3 py-2.5 font-normal">Status</th>
                <th className="w-12 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const rep = reports.find((x) => x.resumeId === r.id);
                const st = resumeStatus(r, rep);
                return (
                  <tr key={r.id} className="border-t first:border-t-0 hover:bg-subtle">
                    <td className="max-w-0 px-5 py-3">
                      <Link href={`/dashboard/resumes/${r.id}`} className="block truncate font-medium hover:text-primary">
                        {r.name}
                      </Link>
                      <span className="block truncate text-xs text-muted-foreground">{r.targetRole || "No target role"}</span>
                    </td>
                    <td className="px-3 py-3 text-ink-2">{getTemplate(r.design.templateId).name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{timeAgo(r.updatedAt)}</td>
                    <td className="px-3 py-3 text-right">
                      <ScorePill score={rep?.score} />
                    </td>
                    <td className="tabular px-3 py-3 text-right text-ink-2">{r.versions.length || "—"}</td>
                    <td className="px-3 py-3">
                      <Pill tone={st.tone}>{st.label}</Pill>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ResumeActions resume={r} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const rep = reports.find((x) => x.resumeId === r.id);
            return (
              <article key={r.id} className="group overflow-hidden rounded-xl border bg-card">
                <Link href={`/dashboard/resumes/${r.id}`} className="block bg-[#eef2f7] px-8 pt-6" aria-label={`Open ${r.name}`}>
                  <div className="h-48 overflow-hidden rounded-t-[3px] shadow-[0_1px_3px_rgba(15,23,42,0.12)] transition-transform duration-300 group-hover:-translate-y-1">
                    <ScaledPaper content={r.content} order={r.sectionOrder} design={r.design} />
                  </div>
                </Link>
                <div className="flex items-start justify-between gap-2 border-t p-4">
                  <div className="min-w-0">
                    <Link href={`/dashboard/resumes/${r.id}`} className="block truncate text-sm font-medium hover:text-primary">
                      {r.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {getTemplate(r.design.templateId).name} · {timeAgo(r.updatedAt)} · {rep ? `Score ${rep.score}` : "Not analyzed"}
                    </p>
                  </div>
                  <ResumeActions resume={r} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
