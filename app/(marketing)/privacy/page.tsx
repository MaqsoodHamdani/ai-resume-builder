import type { Metadata } from "next";
import { ProsePage } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy Policy" updated="November 2, 2026" intro="Your resume contains personal information. This policy explains what Candor collects, why, and the choices you have.">
      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, email address and password (stored as a hash).</li>
        <li>Resume content you upload, paste or write, and the reports generated from it.</li>
        <li>Job descriptions you paste into the Job Matcher.</li>
        <li>Basic usage data, such as which features you use, to improve the product.</li>
      </ul>
      <h2>How we use it</h2>
      <p>We use your information only to provide Candor: to analyze and store your resumes, generate suggestions, and keep your account secure. We do not sell your data, and we do not share your resume with employers or recruiters.</p>
      <h2>How long we keep it</h2>
      <p>Your content stays in your account until you delete it. Deleting a resume removes it and its reports. Deleting your account removes all of your data within 30 days.</p>
      <h2>Your choices</h2>
      <ul>
        <li>Download any resume as a PDF at any time.</li>
        <li>Turn email notifications on or off in Settings.</li>
        <li>Delete your account from Settings, or ask us to by contacting support.</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions about privacy: privacy@candor.app.</p>
    </ProsePage>
  );
}
