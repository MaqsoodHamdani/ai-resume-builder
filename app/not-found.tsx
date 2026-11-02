import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-subtle">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24 text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em]">This page does not exist</h1>
        <p className="mt-3 max-w-sm text-ink-2">The link may be old, or the page may have moved.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/dashboard" className={buttonVariants()}>
            Go to dashboard
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}
