"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/features#analyzer", label: "Resume Analyzer" },
  { href: "/features#builder", label: "Resume Builder" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors hover:text-foreground",
                pathname === l.href ? "font-medium text-foreground" : "text-ink-2",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}>
            Log in
          </Link>
          <Link href="/signup" className={buttonVariants()}>
            Get started
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-80 px-5 pt-14">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <nav className="flex flex-col" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b py-3 text-[15px] font-medium">
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="border-b py-3 text-[15px] font-medium">
              Log in
            </Link>
          </nav>
          <Link href="/signup" onClick={() => setOpen(false)} className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full")}>
            Get started free
          </Link>
        </SheetContent>
      </Sheet>
    </header>
  );
}
