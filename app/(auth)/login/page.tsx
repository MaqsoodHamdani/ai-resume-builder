"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Field } from "@/components/app/ui";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useHydrated, useStore } from "@/lib/store";
import { sleep } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Passwords are at least 8 characters."),
  remember: z.boolean(),
});
type Values = z.infer<typeof schema>;

function LoginForm() {
  useHydrated();
  const router = useRouter();
  const params = useSearchParams();
  const login = useStore((s) => s.login);
  const { register, handleSubmit, control, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });
  const { errors, isSubmitting } = formState;

  const onSubmit = async (v: Values) => {
    await sleep(600);
    login(v.email.trim());
    const next = params.get("next");
    const onboarded = useStore.getState().user.onboarded;
    router.push(!onboarded ? "/onboarding" : next && next.startsWith("/dashboard") ? next : "/dashboard");
  };

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Log in to Candor</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">Welcome back. Pick up where you left off.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-4 rounded-xl border bg-card p-6">
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
        </Field>
        <div className="flex items-center justify-between">
          <Controller
            control={control}
            name="remember"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-[13px] text-ink-2">
                <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(!!c)} />
                Remember me
              </label>
            )}
          />
          <Link href="/forgot-password" className="text-[13px] font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? "Logging in" : "Log in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Candor?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
