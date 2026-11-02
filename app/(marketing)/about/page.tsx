import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/marketing/prose";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <ProsePage title="About Candor" intro="Candor helps people present their real experience clearly, so the right employers notice it.">
      <p>Most resume advice is generic: use action verbs, quantify results, keep it to one page. It is good advice, but it rarely tells you which line to change. Candor reads your actual resume and points at the sentences that are holding it back, with a reason and a suggested fix for each.</p>
      <h2>What we believe</h2>
      <ul>
        <li>
          <strong>Specific beats generic.</strong> Feedback should quote your words and explain why they matter.
        </li>
        <li>
          <strong>Honesty is a feature.</strong> We never suggest skills or results you do not have, and we are clear that a score is a guide, not a guarantee.
        </li>
        <li>
          <strong>You stay in control.</strong> Every suggestion is shown beside your original, and nothing changes until you accept it.
        </li>
      </ul>
      <div className="mt-4 flex gap-3">
        <Link href="/signup" className={buttonVariants({ size: "lg" })}>
          Try Candor free
        </Link>
        <Link href="/contact" className={buttonVariants({ size: "lg", variant: "outline" })}>
          Contact us
        </Link>
      </div>
    </ProsePage>
  );
}
