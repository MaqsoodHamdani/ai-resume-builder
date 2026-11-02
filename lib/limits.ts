"use client";

import { PLAN_LIMITS } from "./config";
import { useStore } from "./store";

/** Whether the current plan allows another active resume. */
export function useResumeLimit() {
  const plan = useStore((s) => s.user.plan);
  const count = useStore((s) => s.resumes.length);
  const limit = PLAN_LIMITS[plan].resumes;
  return { reached: count >= limit, limit, count, plan };
}
