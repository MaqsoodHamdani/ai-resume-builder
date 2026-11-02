"use client";

import { useState } from "react";
import { Check, CreditCard, Download } from "lucide-react";
import { toast } from "sonner";
import { Bar, Panel, Pill } from "@/components/app/ui";
import { Segmented } from "@/components/editor/design-controls";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS, PLANS } from "@/lib/config";
import { useStore } from "@/lib/store";
import type { Plan } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export default function BillingPage() {
  const user = useStore((s) => s.user);
  const resumes = useStore((s) => s.resumes);
  const matches = useStore((s) => s.matches);
  const updateUser = useStore((s) => s.updateUser);
  const [cycle, setCycle] = useState(user.billingCycle);
  const [pending, setPending] = useState<Plan | null>(null);
  const [now] = useState(() => Date.now());

  const current = PLANS.find((p) => p.id === user.plan)!;
  const price = (p: (typeof PLANS)[number], c = cycle) => (c === "yearly" ? p.yearly : p.monthly);
  const limits = PLAN_LIMITS[user.plan];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const monthMatches = matches.filter((m) => m.createdAt >= monthStart).length;
  const versions = resumes.reduce((n, r) => n + r.versions.length, 0);
  const renews = new Date(now + 23 * 86_400_000).toISOString();

  // Invoice history derived from the plan; a free plan has none.
  const invoices =
    user.plan === "free"
      ? []
      : Array.from({ length: user.billingCycle === "yearly" ? 1 : 4 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (user.billingCycle === "yearly" ? 1 : i + 1), 9);
          return { id: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${String(4182 + i)}`, date: d.toISOString(), amount: price(current, user.billingCycle) };
        });

  const download = (inv: (typeof invoices)[number]) => {
    const html = `<!doctype html><meta charset="utf-8"><title>${inv.id}</title><body style="font:14px system-ui;max-width:560px;margin:48px auto;color:#111827"><h1 style="font-size:20px">Candor invoice ${inv.id}</h1><p>Billed to ${user.name} (${user.email})</p><p>Date: ${formatDate(inv.date)}</p><table style="width:100%;border-collapse:collapse;margin-top:24px"><tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${current.name} plan, ${user.billingCycle}</td><td style="text-align:right;border-bottom:1px solid #e5e7eb">$${inv.amount.toFixed(2)}</td></tr><tr><td style="padding:8px 0;font-weight:600">Total paid</td><td style="text-align:right;font-weight:600">$${inv.amount.toFixed(2)}</td></tr></table></body>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${inv.id}.html` });
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded");
  };

  const target = PLANS.find((p) => p.id === pending);
  const rank = { free: 0, pro: 1, premium: 2 };

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Current plan">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold">{current.name}</span>
              {user.plan !== "free" && <Pill tone="primary">{user.billingCycle === "yearly" ? "Billed yearly" : "Billed monthly"}</Pill>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.plan === "free" ? "Free forever. Upgrade any time." : `$${price(current, user.billingCycle)} per ${user.billingCycle === "yearly" ? "year" : "month"} · Renews ${formatDate(renews)}`}
            </p>
          </div>
          {user.plan !== "free" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="size-4" /> Visa ending 4242
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Usage" description="This billing period">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            { label: "Active resumes", used: resumes.length, limit: limits.resumes },
            { label: "Job matches this month", used: monthMatches, limit: limits.matches },
            { label: "Saved versions", used: versions, limit: user.plan === "free" ? 3 : user.plan === "pro" ? 20 : Infinity },
          ].map((u) => (
            <div key={u.label}>
              <div className="text-[13px] text-muted-foreground">{u.label}</div>
              <div className="tabular mt-1 text-lg font-semibold">
                {u.used}
                <span className="text-sm font-normal text-muted-foreground"> / {u.limit === Infinity ? "Unlimited" : u.limit}</span>
              </div>
              <Bar value={u.limit === Infinity ? 4 : (u.used / u.limit) * 100} color={u.limit !== Infinity && u.used >= u.limit ? "var(--warning)" : "var(--primary)"} className="mt-2 h-1.5" />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Plans" actions={<Segmented label="Billing cycle" value={cycle} onChange={setCycle} options={[{ id: "monthly", label: "Monthly" }, { id: "yearly", label: "Yearly" }]} />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = p.id === user.plan && (p.id === "free" || cycle === user.billingCycle);
            return (
              <div key={p.id} className={cn("flex flex-col rounded-lg border p-4", isCurrent && "border-primary ring-3 ring-primary/10")}>
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="mt-1">
                  <span className="tabular text-2xl font-semibold">${price(p)}</span>
                  <span className="text-sm text-muted-foreground">{p.monthly ? (cycle === "yearly" ? " / year" : " / month") : ""}</span>
                </div>
                <ul className="mt-3 flex flex-1 flex-col gap-1.5 text-[13px]">
                  {p.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-4 w-full" variant={isCurrent ? "outline" : rank[p.id] > rank[user.plan] ? "default" : "outline"} disabled={isCurrent} onClick={() => setPending(p.id)}>
                  {isCurrent ? "Current plan" : rank[p.id] > rank[user.plan] ? `Upgrade to ${p.name}` : p.id === user.plan ? `Switch to ${cycle}` : `Switch to ${p.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Billing history" bodyClassName="px-0 pb-2">
        {invoices.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-normal">Invoice</th>
                  <th className="px-3 py-2 font-normal">Date</th>
                  <th className="px-3 py-2 text-right font-normal">Amount</th>
                  <th className="px-3 py-2 font-normal">Status</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="px-5 py-2.5 font-medium">{inv.id}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{formatDate(inv.date)}</td>
                    <td className="tabular px-3 py-2.5 text-right">${inv.amount.toFixed(2)}</td>
                    <td className="px-3 py-2.5">
                      <Pill tone="success">Paid</Pill>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => download(inv)}>
                        <Download /> Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 pb-3 text-sm text-muted-foreground">No invoices yet. Invoices appear here after your first payment.</p>
        )}
      </Panel>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          {target && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{target.id === "free" ? "Switch to the Free plan?" : `Switch to ${target.name}, billed ${cycle}?`}</AlertDialogTitle>
                <AlertDialogDescription>
                  {target.id === "free"
                    ? `You keep your data, but only ${PLAN_LIMITS.free.resumes} resume stays editable and Pro templates lock. The change applies at the end of this period.`
                    : `$${price(target)} per ${cycle === "yearly" ? "year" : "month"}, charged to Visa ending 4242. The difference for this period is prorated.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    updateUser({ plan: target.id, billingCycle: target.id === "free" ? user.billingCycle : cycle });
                    setPending(null);
                    toast.success(`You are now on ${target.name}`);
                  }}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
