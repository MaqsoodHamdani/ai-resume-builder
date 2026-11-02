"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/app/ui";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/settings", label: "General" },
  { href: "/dashboard/settings/profile", label: "Profile" },
  { href: "/dashboard/settings/billing", label: "Billing" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Manage your profile, account, preferences and plan." />
      <nav aria-label="Settings" className="-mt-1 flex gap-5 overflow-x-auto border-b">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative shrink-0 pb-2.5 text-sm transition-colors",
                active ? "font-medium text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div className="max-w-3xl">{children}</div>
    </div>
  );
}
