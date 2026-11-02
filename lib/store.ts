"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_ORDER, designFor } from "./config";
import { createSeed } from "./data/seed";
import { analyzeResume } from "./services/analyzer";
import type { Activity, ActivityKind, AnalysisReport, JobMatch, Resume, ResumeContent, SectionKey, User } from "./types";
import { uid } from "./utils";

interface State {
  session: { loggedIn: boolean };
  user: User;
  resumes: Resume[];
  reports: AnalysisReport[];
  matches: JobMatch[];
  activity: Activity[];
  notificationsReadAt: string;

  login: (email: string) => void;
  logout: () => void;
  signup: (name: string, email: string) => void;
  updateUser: (patch: Partial<User>) => void;
  createResume: (input: {
    name: string;
    targetRole: string;
    content: ResumeContent;
    sectionOrder?: SectionKey[];
    templateId?: string;
    source: Resume["source"];
    fileName?: string;
  }) => string;
  updateResume: (id: string, patch: Partial<Resume> | ((r: Resume) => Partial<Resume>), activity?: string) => void;
  saveVersion: (id: string, label: string) => void;
  restoreVersion: (id: string, versionId: string) => void;
  duplicateResume: (id: string) => string | undefined;
  deleteResume: (id: string) => void;
  runAnalysis: (id: string) => AnalysisReport | undefined;
  addMatch: (m: JobMatch) => void;
  updateMatch: (id: string, patch: Partial<JobMatch>) => void;
  deleteMatch: (id: string) => void;
  log: (kind: ActivityKind, text: string, resumeId?: string) => void;
  markNotificationsRead: () => void;
  resetWorkspace: () => void;
}

const emptyUser = (name: string, email: string): User => ({
  name,
  email,
  careerStage: "mid",
  industry: "",
  targetRole: "",
  plan: "free",
  billingCycle: "monthly",
  onboarded: false,
  preferences: {
    defaultTemplate: "meridian",
    notifications: { analysis: true, tips: true, weekly: true, product: false },
    compactTables: false,
  },
});

const now = () => new Date().toISOString();

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const seed = createSeed();
      return {
        session: { loggedIn: false },
        ...seed,
        notificationsReadAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),

        login: (email) =>
          set((s) => ({ session: { loggedIn: true }, user: { ...s.user, email: email || s.user.email } })),
        logout: () => set({ session: { loggedIn: false } }),
        signup: (name, email) =>
          set({
            session: { loggedIn: true },
            user: emptyUser(name, email),
            resumes: [],
            reports: [],
            matches: [],
            activity: [],
            notificationsReadAt: now(),
          }),
        updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),

        createResume: ({ name, targetRole, content, sectionOrder, templateId, source, fileName }) => {
          const id = uid("res");
          const t = now();
          const resume: Resume = {
            id,
            name,
            targetRole,
            content,
            sectionOrder: sectionOrder?.length ? sectionOrder : DEFAULT_ORDER,
            design: designFor(templateId ?? get().user.preferences.defaultTemplate),
            source,
            fileName,
            createdAt: t,
            updatedAt: t,
            versions: [{ id: uid("v"), label: source === "upload" ? "Original upload" : "First draft", createdAt: t, content }],
          };
          set((s) => ({ resumes: [resume, ...s.resumes] }));
          get().log(source === "upload" ? "upload" : "create", source === "upload" ? `Uploaded ${fileName ?? name}` : `Created ${name}`, id);
          return id;
        },

        updateResume: (id, patch, activity) => {
          set((s) => ({
            resumes: s.resumes.map((r) =>
              r.id === id ? { ...r, ...(typeof patch === "function" ? patch(r) : patch), updatedAt: now() } : r,
            ),
          }));
          if (activity) get().log("update", activity, id);
        },

        saveVersion: (id, label) => {
          const r = get().resumes.find((x) => x.id === id);
          if (!r) return;
          const score = get().reports.find((x) => x.resumeId === id)?.score;
          const v = { id: uid("v"), label, createdAt: now(), score, content: JSON.parse(JSON.stringify(r.content)) };
          set((s) => ({ resumes: s.resumes.map((x) => (x.id === id ? { ...x, versions: [...x.versions, v] } : x)) }));
          get().log("version", `New version saved: ${label}`, id);
        },

        restoreVersion: (id, versionId) => {
          const r = get().resumes.find((x) => x.id === id);
          const v = r?.versions.find((x) => x.id === versionId);
          if (!r || !v) return;
          get().updateResume(id, { content: JSON.parse(JSON.stringify(v.content)) }, `Restored “${v.label}” in ${r.name}`);
        },

        duplicateResume: (id) => {
          const r = get().resumes.find((x) => x.id === id);
          if (!r) return;
          const copy: Resume = {
            ...JSON.parse(JSON.stringify(r)),
            id: uid("res"),
            name: `${r.name} (copy)`,
            source: "duplicate",
            createdAt: now(),
            updatedAt: now(),
            versions: [],
          };
          set((s) => ({ resumes: [copy, ...s.resumes] }));
          get().log("duplicate", `Created ${copy.name} from ${r.name}`, copy.id);
          return copy.id;
        },

        deleteResume: (id) => {
          const r = get().resumes.find((x) => x.id === id);
          set((s) => ({
            resumes: s.resumes.filter((x) => x.id !== id),
            reports: s.reports.filter((x) => x.resumeId !== id),
            matches: s.matches.filter((x) => x.resumeId !== id),
            activity: s.activity.filter((x) => x.resumeId !== id),
          }));
          if (r) get().log("delete", `Deleted ${r.name}`);
        },

        runAnalysis: (id) => {
          const r = get().resumes.find((x) => x.id === id);
          if (!r) return;
          const prev = get().reports.find((x) => x.resumeId === id);
          const report = analyzeResume(r, prev);
          set((s) => ({ reports: [report, ...s.reports.filter((x) => x.resumeId !== id)] }));
          get().log("analysis", `Analysis completed for ${r.name} (${report.score}/100)`, id);
          return report;
        },

        addMatch: (m) => {
          set((s) => ({ matches: [m, ...s.matches] }));
          const r = get().resumes.find((x) => x.id === m.resumeId);
          get().log("match", `Matched ${r?.name ?? "resume"} to ${m.company || m.jobTitle} (${m.score}%)`, m.resumeId);
        },
        updateMatch: (id, patch) => set((s) => ({ matches: s.matches.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
        deleteMatch: (id) => set((s) => ({ matches: s.matches.filter((m) => m.id !== id) })),

        log: (kind, text, resumeId) =>
          set((s) => ({ activity: [{ id: uid("act"), kind, text, resumeId, at: now() }, ...s.activity].slice(0, 60) })),
        markNotificationsRead: () => set({ notificationsReadAt: now() }),
        resetWorkspace: () => set({ ...createSeed(), session: { loggedIn: true } }),
      };
    },
    {
      name: "candor-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        session: s.session,
        user: s.user,
        resumes: s.resumes,
        reports: s.reports,
        matches: s.matches,
        activity: s.activity,
        notificationsReadAt: s.notificationsReadAt,
      }),
    },
  ),
);

let started = false;
/** Rehydrate from localStorage once on the client; returns true when the store is ready. */
export function useHydrated() {
  const [ready, setReady] = useState(() => !!useStore.persist?.hasHydrated());
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setReady(true));
    if (!started) {
      started = true;
      void useStore.persist.rehydrate();
    }
    queueMicrotask(() => useStore.persist?.hasHydrated() && setReady(true));
    return unsub;
  }, []);
  return ready;
}

export function useResume(id: string | undefined) {
  return useStore((s) => s.resumes.find((r) => r.id === id));
}

export function useLatestReport(resumeId: string | undefined) {
  return useStore((s) => s.reports.find((r) => r.resumeId === resumeId));
}
