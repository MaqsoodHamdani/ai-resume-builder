"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Field } from "@/components/app/ui";
import { PasswordInput, StrengthMeter } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useHydrated, useStore } from "@/lib/store";
import { sleep } from "@/lib/utils";

const schema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name."),
    email: z.string().trim().email("Enter a valid email address, like name@example.com."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string(),
    terms: z.boolean().refine((v) => v, "Accept the terms to create an account."),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match." });

type Values = z.infer<typeof schema>;

function SignupForm() {
  useHydrated();
  const router = useRouter();
  const params = useSearchParams();
  const signup = useStore((s) => s.signup);
  const { register, handleSubmit, control, watch, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirm: "", terms: false },
  });
  const { errors, isSubmitting } = formState;

  const onSubmit = async (v: Values) => {
    await sleep(700);
    signup(v.name.trim(), v.email.trim());
    const intent = params.get("intent");
    router.push(`/onboarding${intent ? `?intent=${intent}` : ""}`);
  };

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Create your account</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">Start with a free analysis of your resume.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-4 rounded-xl border bg-card p-6">
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Email address" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
          <StrengthMeter password={watch("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
          <PasswordInput id="confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register("confirm")} />
        </Field>
        <div>
          <Controller
            control={control}
            name="terms"
            render={({ field }) => (
              <label className="flex items-start gap-2.5 text-[13px] leading-snug text-ink-2">
                <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(!!c)} aria-invalid={!!errors.terms} className="mt-0.5" />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="font-medium text-foreground underline underline-offset-2">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            )}
          />
          {errors.terms && <p className="mt-1.5 text-[13px] text-destructive">{errors.terms.message}</p>}
        </div>
        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? "Creating account" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
