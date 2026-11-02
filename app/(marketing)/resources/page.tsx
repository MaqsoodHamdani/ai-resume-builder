import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "Resources" };

export default function ResourcesPage() {
  return (
    <ProsePage title="Resume writing guides" intro="Short, practical guides to the parts of a resume that matter most. Each one matches a category in your Candor report.">
      <nav aria-label="Guides" className="rounded-xl bg-subtle p-5 text-[15px]">
        <ul>
          <li>
            <a href="#bullets" className="font-medium text-primary hover:underline">
              Writing achievement bullets
            </a>
          </li>
          <li>
            <a href="#ats" className="font-medium text-primary hover:underline">
              How applicant tracking systems read your resume
            </a>
          </li>
          <li>
            <a href="#tailoring" className="font-medium text-primary hover:underline">
              Tailoring a resume to a job description
            </a>
          </li>
        </ul>
      </nav>

      <h2 id="bullets" className="scroll-mt-24">
        Writing achievement bullets
      </h2>
      <p>A strong bullet answers three questions in one line: what you did, how big it was, and what changed because of it. Start with a specific past-tense verb, name the scope, and finish with the result.</p>
      <ul>
        <li>
          <strong>Weak:</strong> Responsible for the checkout page.
        </li>
        <li>
          <strong>Better:</strong> Rebuilt the checkout flow in React, cutting abandoned carts by 18% in the first quarter.
        </li>
      </ul>
      <p>If you do not know the exact number, estimate honestly and be ready to explain it, or describe the result in other terms: time saved, people affected, errors removed. Never invent a figure.</p>

      <h2 id="ats" className="scroll-mt-24">
        How applicant tracking systems read your resume
      </h2>
      <p>Most large employers use an applicant tracking system to store applications. Before a person reads your resume, the system extracts your contact details, job titles, dates and skills into a record. Recruiters then search those records by keyword.</p>
      <ul>
        <li>Use standard headings such as Experience, Education and Skills.</li>
        <li>Keep text in a single column for strict portals, and avoid putting key details in headers, tables or images.</li>
        <li>Write dates the same way throughout, such as Mar 2022 – Present.</li>
        <li>Name the skills you have in plain words, the way a job posting would.</li>
      </ul>
      <p>Systems differ from one employer to the next, so no tool can promise how a specific one will rank you. Candor’s ATS checks cover the common basics.</p>

      <h2 id="tailoring" className="scroll-mt-24">
        Tailoring a resume to a job description
      </h2>
      <p>Tailoring means making your relevant experience easy to find for a specific role, not rewriting your history. Read the posting’s requirements, then:</p>
      <ul>
        <li>Rewrite your summary to name the role and lead with the skills the posting emphasizes.</li>
        <li>Move your most relevant bullets to the top of each role.</li>
        <li>Put matching skills first in your skills list.</li>
        <li>Leave out any skill you have not actually used, even if the posting asks for it.</li>
      </ul>
      <p>
        The <Link href="/features#matcher" className="font-medium text-primary hover:underline">Job Matcher</Link> shows which requirements your resume already covers, and creates a tailored copy so your original stays intact.
      </p>
    </ProsePage>
  );
}
