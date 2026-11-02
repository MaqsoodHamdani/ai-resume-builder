"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Laptop, Loader2, LogOut, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Field, NativeSelect, Panel } from "@/components/app/ui";
import { PasswordInput, StrengthMeter } from "@/components/auth/password-input";
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
import { Switch } from "@/components/ui/switch";
import { TEMPLATES } from "@/lib/config";
import { useStore } from "@/lib/store";
import { sleep } from "@/lib/utils";

const pwSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Passwords do not match." })
  .refine((d) => d.next !== d.current, { path: ["next"], message: "Choose a password different from your current one." });

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-t py-3.5 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[13px] text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}

export default function GeneralSettings() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const logout = useStore((s) => s.logout);
  const [twoStep, setTwoStep] = useState(false);
  const [otherSessions, setOtherSessions] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const form = useForm<z.infer<typeof pwSchema>>({ resolver: zodResolver(pwSchema), defaultValues: { current: "", next: "", confirm: "" } });
  const prefs = user.preferences;
  const setPrefs = (p: Partial<typeof prefs>, msg = "Preferences saved") => {
    updateUser({ preferences: { ...prefs, ...p } });
    toast.success(msg);
  };
  const notif = (k: keyof typeof prefs.notifications, v: boolean) => setPrefs({ notifications: { ...prefs.notifications, [k]: v } }, v ? "Notifications on" : "Notifications off");

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Change password">
        <form
          noValidate
          onSubmit={form.handleSubmit(async () => {
            await sleep(700);
            form.reset();
            toast.success("Password updated", { description: "Use it the next time you log in." });
          })}
          className="grid gap-4 sm:max-w-md"
        >
          <Field label="Current password" htmlFor="pw-cur" error={form.formState.errors.current?.message}>
            <PasswordInput id="pw-cur" autoComplete="current-password" {...form.register("current")} />
          </Field>
          <Field label="New password" htmlFor="pw-new" error={form.formState.errors.next?.message}>
            <PasswordInput id="pw-new" autoComplete="new-password" {...form.register("next")} />
            <StrengthMeter password={form.watch("next")} />
          </Field>
          <Field label="Confirm new password" htmlFor="pw-conf" error={form.formState.errors.confirm?.message}>
            <PasswordInput id="pw-conf" autoComplete="new-password" {...form.register("confirm")} />
          </Field>
          <div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
              Update password
            </Button>
          </div>
        </form>
      </Panel>

      <Panel title="Security">
        <Row title="Two-step verification" desc="Ask for a code from an authenticator app when you log in on a new device.">
          <Switch
            checked={twoStep}
            onCheckedChange={(v) => {
              setTwoStep(v);
              toast.success(v ? "Two-step verification turned on" : "Two-step verification turned off");
            }}
            aria-label="Two-step verification"
          />
        </Row>
        <div className="border-t pt-3.5">
          <div className="text-sm font-medium">Active sessions</div>
          <ul className="mt-2">
            <li className="flex items-center gap-3 py-2 text-sm">
              <Laptop className="size-4 text-muted-foreground" />
              <span className="flex-1">Chrome on Windows · Austin, TX</span>
              <span className="text-xs font-medium text-success">This device</span>
            </li>
            {otherSessions && (
              <li className="flex items-center gap-3 py-2 text-sm">
                <Smartphone className="size-4 text-muted-foreground" />
                <span className="flex-1">Safari on iPhone · Austin, TX</span>
                <span className="text-xs text-muted-foreground">2 days ago</span>
              </li>
            )}
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={!otherSessions}
            onClick={() => {
              setOtherSessions(false);
              toast.success("Signed out of other sessions");
            }}
          >
            Sign out other sessions
          </Button>
        </div>
      </Panel>

      <Panel title="Preferences">
        <Row title="Default template" desc="Used when you start a new resume.">
          <NativeSelect aria-label="Default template" value={prefs.defaultTemplate} onChange={(e) => setPrefs({ defaultTemplate: e.target.value })} className="w-44">
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </NativeSelect>
        </Row>
        <Row title="Analysis results" desc="Email me when an analysis or job match finishes.">
          <Switch checked={prefs.notifications.analysis} onCheckedChange={(v) => notif("analysis", v)} aria-label="Analysis results emails" />
        </Row>
        <Row title="Writing tips" desc="Occasional advice tied to your latest report.">
          <Switch checked={prefs.notifications.tips} onCheckedChange={(v) => notif("tips", v)} aria-label="Writing tips emails" />
        </Row>
        <Row title="Weekly summary" desc="A Monday email with your progress across resumes.">
          <Switch checked={prefs.notifications.weekly} onCheckedChange={(v) => notif("weekly", v)} aria-label="Weekly summary emails" />
        </Row>
        <Row title="Product updates" desc="New templates and features, at most once a month.">
          <Switch checked={prefs.notifications.product} onCheckedChange={(v) => notif("product", v)} aria-label="Product update emails" />
        </Row>
        <Row title="Compact tables" desc="Show more rows on screen in lists and tables.">
          <Switch checked={prefs.compactTables} onCheckedChange={(v) => setPrefs({ compactTables: v }, "Display preference saved")} aria-label="Compact tables" />
        </Row>
      </Panel>

      <Panel title="Account">
        <Row title="Sign out" desc={`Signed in as ${user.email}`}>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <LogOut /> Sign out
          </Button>
        </Row>
        <Row title="Delete account" desc="Permanently delete your account, resumes, reports and job matches.">
          <Button variant="destructive" onClick={() => setDeleting(true)}>
            Delete account
          </Button>
        </Row>
      </Panel>

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>All resumes, versions, reports and job matches will be removed. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                try {
                  localStorage.removeItem("candor-v1");
                } catch {}
                window.location.href = "/";
              }}
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
