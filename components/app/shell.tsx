"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ChevronsUpDown,
  CreditCard,
  Feather,
  FileText,
  Gauge,
  LayoutGrid,
  LayoutTemplate,
  LifeBuoy,
  LogOut,
  Menu,
  PenLine,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated, useStore } from "@/lib/store";
import { cn, initials, timeAgo } from "@/lib/utils";

const NAV = [
  {
    group: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true },
      { href: "/dashboard/resumes", label: "My Resumes", icon: FileText },
      { href: "/dashboard/analyzer", label: "Resume Analyzer", icon: Gauge },
      { href: "/dashboard/builder", label: "Resume Builder", icon: PenLine },
      { href: "/dashboard/job-matcher", label: "Job Matcher", icon: BriefcaseBusiness },
    ],
  },
  {
    group: "Tools",
    items: [
      { href: "/dashboard/ai-assistant", label: "AI Writing Assistant", icon: Feather },
      { href: "/dashboard/templates", label: "Resume Templates", icon: LayoutTemplate },
    ],
  },
  {
    group: "Account",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings, exclude: "/dashboard/settings/billing" },
      { href: "/dashboard/settings/billing", label: "Billing", icon: CreditCard },
      { href: "/dashboard/help", label: "Help & Support", icon: LifeBuoy },
    ],
  },
];

const TITLES: [RegExp, string[]][] = [
  [/^\/dashboard$/, ["Dashboard"]],
  [/^\/dashboard\/resumes$/, ["My Resumes"]],
  [/^\/dashboard\/resumes\/[^/]+\/edit$/, ["My Resumes", "Editor"]],
  [/^\/dashboard\/resumes\/[^/]+$/, ["My Resumes", "Resume"]],
  [/^\/dashboard\/analyzer\/upload$/, ["Resume Analyzer", "Upload"]],
  [/^\/dashboard\/analyzer\/[^/]+$/, ["Resume Analyzer", "Report"]],
  [/^\/dashboard\/analyzer$/, ["Resume Analyzer"]],
  [/^\/dashboard\/builder/, ["Resume Builder"]],
  [/^\/dashboard\/job-matcher/, ["Job Matcher"]],
  [/^\/dashboard\/ai-assistant/, ["AI Writing Assistant"]],
  [/^\/dashboard\/templates/, ["Resume Templates"]],
  [/^\/dashboard\/settings\/billing/, ["Settings", "Billing"]],
  [/^\/dashboard\/settings\/profile/, ["Settings", "Profile"]],
  [/^\/dashboard\/settings/, ["Settings"]],
  [/^\/dashboard\/help/, ["Help & Support"]],
];

function isActive(pathname: string, item: { href: string; exact?: boolean; exclude?: string }) {
  if (item.exclude && pathname.startsWith(item.exclude)) return false;
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-5 px-3" aria-label="Main">
      {NAV.map((g) => (
        <div key={g.group}>
          <div className="px-2.5 pb-1.5 text-xs font-medium text-muted-foreground">{g.group}</div>
          <ul className="flex flex-col gap-0.5">
            {g.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                      active ? "bg-secondary font-medium text-foreground" : "text-ink-2 hover:bg-subtle hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")} strokeWidth={1.75} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserMenu({ compact = false }: { compact?: boolean }) {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2.5 rounded-md text-left outline-none transition-colors hover:bg-subtle focus-visible:ring-3 focus-visible:ring-ring/50",
          compact ? "p-1" : "w-full p-2",
        )}
        aria-label="Account menu"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="size-8 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e8eefc] text-xs font-semibold text-[#1e40af]">{initials(user.name || "You")}</span>
        )}
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground capitalize">{user.plan} plan</span>
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side={compact ? "bottom" : "top"} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="truncate text-sm font-medium text-foreground">{user.name}</div>
            <div className="truncate text-xs font-normal">{user.email}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings/profile")}>
          <UserRound /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings/billing")}>
          <CreditCard /> Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const plan = useStore((s) => s.user.plan);
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-5">
        <Logo href="/dashboard" />
      </div>
      <div className="scroll-quiet flex-1 overflow-y-auto py-3">
        <NavList pathname={pathname} onNavigate={onNavigate} />
      </div>
      <div className="flex flex-col gap-2 border-t p-3">
        {plan === "free" && (
          <div className="rounded-lg border bg-subtle p-3">
            <p className="text-[13px] font-medium">You are on the Free plan</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Pro adds job matching, all templates and PDF downloads.</p>
            <Link href="/dashboard/settings/billing" onClick={onNavigate} className={cn(buttonVariants({ size: "sm" }), "mt-2.5 w-full")}>
              Upgrade plan
            </Link>
          </div>
        )}
        <UserMenu />
      </div>
    </div>
  );
}

function GlobalSearch() {
  const resumes = useStore((s) => s.resumes);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return resumes.slice(0, 5);
    return resumes.filter((r) => `${r.name} ${r.targetRole} ${r.content.contact.fullName}`.toLowerCase().includes(t)).slice(0, 6);
  }, [q, resumes]);

  const go = (id: string) => {
    setOpen(false);
    setQ("");
    input.current?.blur();
    router.push(`/dashboard/resumes/${id}`);
  };

  return (
    <div className="relative hidden w-full max-w-sm md:block">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={input}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) go(results[0].id);
          if (e.key === "Escape") input.current?.blur();
        }}
        placeholder="Search resumes"
        aria-label="Search resumes"
        className="h-9 w-full rounded-lg border border-input bg-subtle pr-12 pl-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/40"
      />
      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border bg-background px-1.5 text-[11px] text-muted-foreground">Ctrl K</span>
      {open && (
        <div className="absolute top-11 left-0 z-50 w-full overflow-hidden rounded-lg border bg-popover p-1 shadow-lg">
          {results.length ? (
            results.map((r) => (
              <button
                key={r.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r.id)}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-subtle"
              >
                <FileText className="size-4 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className="truncate text-xs text-muted-foreground">{r.targetRole}</span>
              </button>
            ))
          ) : (
            <p className="px-2.5 py-3 text-sm text-muted-foreground">No resumes match “{q}”.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const activity = useStore((s) => s.activity);
  const readAt = useStore((s) => s.notificationsReadAt);
  const markRead = useStore((s) => s.markNotificationsRead);
  const unread = activity.filter((a) => a.at > readAt).length;
  return (
    <Popover onOpenChange={(o) => !o && unread && markRead()}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative" />}>
        <Bell className="size-[18px]" strokeWidth={1.75} />
        {unread > 0 && <span className="absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-background" />}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button onClick={markRead} className="text-xs font-medium text-primary hover:underline">
              Mark all as read
            </button>
          )}
        </div>
        <ul className="scroll-quiet max-h-80 overflow-y-auto py-1">
          {activity.slice(0, 8).map((a) => (
            <li key={a.id} className="flex gap-3 px-4 py-2.5">
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", a.at > readAt ? "bg-primary" : "bg-transparent")} />
              <div className="min-w-0">
                <p className="text-[13px] leading-snug">{a.text}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(a.at)}</p>
              </div>
            </li>
          ))}
          {!activity.length && <li className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet.</li>}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function ShellSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="mt-2 h-4 w-80" />
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="mt-4 h-72" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const loggedIn = useStore((s) => s.session.loggedIn);
  const compact = useStore((s) => s.user.preferences.compactTables);
  const [drawer, setDrawer] = useState(false);
  const crumbs = TITLES.find(([re]) => re.test(pathname))?.[1] ?? ["Dashboard"];
  const fullBleed = /\/edit$/.test(pathname);

  useEffect(() => {
    if (hydrated && !loggedIn) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, loggedIn, pathname, router]);

  return (
    <div className="min-h-dvh bg-subtle">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-background lg:block">
        <Sidebar pathname={pathname} />
      </aside>
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar pathname={pathname} onNavigate={() => setDrawer(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
          <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open navigation" onClick={() => setDrawer(true)}>
            <Menu className="size-5" />
          </Button>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 truncate text-sm">
              {crumbs.map((c, i) => (
                <li key={c} className={cn("flex items-center gap-1.5", i === crumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {i > 0 && <span className="text-[#cbd5e1]">/</span>}
                  {c}
                </li>
              ))}
            </ol>
          </nav>
          {hydrated && loggedIn && (
            <>
              <GlobalSearch />
              <Notifications />
              <div className="lg:hidden">
                <UserMenu compact />
              </div>
            </>
          )}
        </header>
        <main data-density={compact ? "compact" : undefined} className={cn(!fullBleed && "mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8")}>
          {hydrated && loggedIn ? children : <ShellSkeleton />}
        </main>
      </div>
    </div>
  );
}
