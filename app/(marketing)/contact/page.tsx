"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Field } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sleep } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  message: z.string().trim().min(20, "Tell us a little more (at least 20 characters)."),
});
type Values = z.infer<typeof schema>;

export default function ContactPage() {
  const [sent, setSent] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", message: "" } });
  const { errors, isSubmitting } = formState;

  return (
    <section className="mx-auto grid grid-cols-1 max-w-[1200px] gap-12 px-4 pt-16 pb-24 sm:px-6 md:grid-cols-[1fr_1.1fr] lg:px-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.03em]">Contact us</h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-2">Questions about Candor, billing, partnerships or press. We reply within one business day.</p>
        <dl className="mt-10 flex flex-col gap-5 text-[15px]">
          <div>
            <dt className="font-semibold">Support</dt>
            <dd className="text-ink-2 select-all">support@candor.app</dd>
          </div>
          <div>
            <dt className="font-semibold">Hours</dt>
            <dd className="text-ink-2">Monday to Friday, 9am to 6pm Central Time</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-2xl border bg-card p-6 sm:p-8">
        {sent ? (
          <div className="flex flex-col items-start" role="status">
            <CheckCircle2 className="size-7 text-success" strokeWidth={1.75} />
            <h2 className="mt-4 text-xl font-semibold">Message sent</h2>
            <p className="mt-2 text-ink-2">Thanks. We will reply to {sent} within one business day.</p>
            <Button variant="outline" className="mt-6" onClick={() => setSent(null)}>
              Send another message
            </Button>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={handleSubmit(async (v) => {
              await sleep(700);
              setSent(v.email);
            })}
            className="flex flex-col gap-4"
          >
            <Field label="Name" htmlFor="ct-name" error={errors.name?.message}>
              <Input id="ct-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
            </Field>
            <Field label="Email" htmlFor="ct-email" error={errors.email?.message}>
              <Input id="ct-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
            </Field>
            <Field label="Message" htmlFor="ct-msg" error={errors.message?.message}>
              <Textarea id="ct-msg" rows={6} aria-invalid={!!errors.message} {...register("message")} className="min-h-32" />
            </Field>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Send message
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
