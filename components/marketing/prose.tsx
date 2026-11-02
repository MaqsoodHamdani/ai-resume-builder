import type { ReactNode } from "react";

export function ProsePage({ title, intro, children, updated }: { title: string; intro?: string; children: ReactNode; updated?: string }) {
  return (
    <article className="mx-auto max-w-[720px] px-4 pt-16 pb-24 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-[-0.03em]">{title}</h1>
      {updated && <p className="mt-3 text-sm text-muted-foreground">Last updated {updated}</p>}
      {intro && <p className="mt-5 text-lg leading-relaxed text-ink-2">{intro}</p>}
      <div className="mt-10 flex flex-col gap-5 text-[16px] leading-[1.7] text-ink-2 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.015em] [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
        {children}
      </div>
    </article>
  );
}
