export { cn } from "cn";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2023-04" -> "Apr 2023"; passes through anything it cannot read. */
export function formatMonth(value: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return value;
  return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export function formatRange(start: string, end: string, current?: boolean) {
  const a = formatMonth(start);
  const b = current ? "Present" : formatMonth(end);
  if (!a && !b) return "";
  if (!a) return b;
  if (!b) return a;
  return `${a} – ${b}`;
}

export function formatDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
) {
  return new Date(iso).toLocaleDateString("en-US", opts);
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return formatDate(iso, { month: "short", day: "numeric" });
}

export function scoreBand(score: number) {
  if (score >= 85) return { label: "Excellent", tone: "success" as const };
  if (score >= 70) return { label: "Good foundation", tone: "primary" as const };
  if (score >= 55) return { label: "Needs work", tone: "warning" as const };
  return { label: "Major gaps", tone: "destructive" as const };
}

export function scoreColor(score: number) {
  if (score >= 85) return "var(--success)";
  if (score >= 70) return "var(--primary)";
  if (score >= 55) return "var(--warning)";
  return "var(--destructive)";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function pluralize(n: number, word: string, plural = `${word}s`) {
  return `${n} ${n === 1 ? word : plural}`;
}
