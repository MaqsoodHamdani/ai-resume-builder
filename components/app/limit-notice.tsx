import Link from "next/link";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "./ui";

export function LimitNotice({ limit }: { limit: number }) {
  return (
    <div className="rounded-xl border bg-card">
      <EmptyState
        icon={<Lock />}
        title={`Your plan includes ${limit} active ${limit === 1 ? "resume" : "resumes"}`}
        description="Delete a resume you no longer need, or upgrade to Pro for up to 10 resumes, all templates and job matching."
        action={
          <>
            <Link href="/dashboard/settings/billing" className={buttonVariants()}>
              Upgrade plan
            </Link>
            <Link href="/dashboard/resumes" className={buttonVariants({ variant: "outline" })}>
              Manage resumes
            </Link>
          </>
        }
      />
    </div>
  );
}
