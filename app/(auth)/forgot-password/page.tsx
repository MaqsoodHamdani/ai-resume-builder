"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sleep } from "@/lib/utils";

const schema = z.object({ email: z.string().trim().email("Enter the email address you signed up with.") });

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const { register, handleSubmit, formState } = useForm<{ email: string }>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  if (sentTo)
    return (
      <div className="w-full max-w-[400px]">
        <div className="rounded-xl border bg-card p-6">
          <MailCheck className="size-6 text-primary" strokeWidth={1.75} />
          <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em]">Check your email</h1>
          <p className="mt-2 text-[15px] text-ink-2">
            If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, a reset link is on its way. It expires in 30 minutes.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-lg bg-primary text-[15px] font-medium text-white hover:bg-[#1d4ed8]">
              Back to log in
            </Link>
            <Button
              variant="ghost"
              disabled={resending}
              onClick={async () => {
                setResending(true);
                await sleep(800);
                setResending(false);
                toast.success("Reset link sent again");
              }}
            >
              {resending ? "Sending" : "Resend link"}
            </Button>
          </div>
          <p className="mt-4 text-[13px] text-muted-foreground">Nothing after a few minutes? Check spam, or try a different address.</p>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Reset your password</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">Enter your email and we will send you a link to choose a new password.</p>
      <form
        noValidate
        onSubmit={handleSubmit(async (v) => {
          await sleep(800);
          setSentTo(v.email.trim());
        })}
        className="mt-8 flex flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <Field label="Email" htmlFor="email" error={formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" autoFocus aria-invalid={!!formState.errors.email} {...register("email")} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Loader2 className="animate-spin" />}
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
