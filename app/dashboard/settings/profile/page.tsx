"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field, NativeSelect, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAREER_STAGES, INDUSTRIES } from "@/lib/config";
import { useStore } from "@/lib/store";
import type { CareerStage } from "@/lib/types";
import { initials, sleep } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  careerStage: z.string(),
  industry: z.string(),
  targetRole: z.string().trim().max(80, "Keep it under 80 characters."),
});
type Values = z.infer<typeof schema>;

export default function ProfileSettings() {
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const file = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, reset, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, email: user.email, careerStage: user.careerStage, industry: user.industry, targetRole: user.targetRole },
  });
  const { errors, isDirty, isSubmitting } = formState;

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const onAvatar = (f: File | undefined) => {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return toast.error("Use a PNG, JPG or WebP image.");
    if (f.size > 2 * 1024 * 1024) return toast.error("Images must be 2 MB or smaller.");
    const reader = new FileReader();
    reader.onload = () => {
      updateUser({ avatar: String(reader.result) });
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(f);
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (v) => {
        await sleep(500);
        updateUser({ ...v, careerStage: v.careerStage as CareerStage });
        reset(v);
        toast.success("Profile saved");
      })}
      className="flex flex-col gap-6"
    >
      <Panel title="Profile photo">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" className="size-16 rounded-full object-cover" />
          ) : (
            <span className="grid size-16 place-items-center rounded-full bg-[#e8eefc] text-lg font-semibold text-[#1e40af]">{initials(user.name)}</span>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => file.current?.click()}>
              Upload photo
            </Button>
            {user.avatar && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateUser({ avatar: undefined });
                  toast.success("Photo removed");
                }}
              >
                Remove
              </Button>
            )}
            <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Upload profile photo" onChange={(e) => onAvatar(e.target.files?.[0])} />
            <p className="w-full text-xs text-muted-foreground">PNG, JPG or WebP, up to 2 MB.</p>
          </div>
        </div>
      </Panel>

      <Panel title="Personal details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="p-name" error={errors.name?.message}>
            <Input id="p-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field label="Email" htmlFor="p-email" error={errors.email?.message}>
            <Input id="p-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
        </div>
      </Panel>

      <Panel title="Career" description="Used to tailor analysis to your goals.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Career stage" htmlFor="p-stage">
            <NativeSelect id="p-stage" {...register("careerStage")}>
              {CAREER_STAGES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Industry" htmlFor="p-ind">
            <NativeSelect id="p-ind" {...register("industry")}>
              <option value="">Not set</option>
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Target role" htmlFor="p-role" error={errors.targetRole?.message} className="sm:col-span-2" hint="New resumes and analyses use this role by default.">
            <Input id="p-role" {...register("targetRole")} />
          </Field>
        </div>
      </Panel>

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)]">
        <span className="mr-auto text-[13px] text-muted-foreground">{isDirty ? "You have unsaved changes" : "All changes saved"}</span>
        <Button type="button" variant="ghost" disabled={!isDirty} onClick={() => reset()}>
          Discard
        </Button>
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
