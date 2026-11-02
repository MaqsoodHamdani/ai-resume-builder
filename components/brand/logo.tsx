import Link from "next/link";
import { cn } from "@/lib/utils";

/** A page with a folded corner, holding a "C". */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <path d="M5.5 2h9.2L21 8.3V20a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#2563eb" />
      <path d="M14.7 2v4.3a2 2 0 0 0 2 2H21z" fill="#1e40af" />
      <path d="M14.5 12.1a3.7 3.7 0 1 0 0 4.3" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 rounded-md text-[17px] font-semibold tracking-[-0.02em] text-foreground", className)}>
      <LogoMark />
      Candor
    </Link>
  );
}
