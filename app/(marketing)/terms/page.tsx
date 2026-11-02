import type { Metadata } from "next";
import { ProsePage } from "@/components/marketing/prose";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <ProsePage title="Terms of Service" updated="November 2, 2026" intro="These terms govern your use of Candor. By creating an account you agree to them.">
      <h2>Your account</h2>
      <p>You are responsible for keeping your login details secure and for the activity on your account. You must be at least 16 years old to use Candor.</p>
      <h2>Your content</h2>
      <p>You own the resumes and text you create. You give Candor permission to store and process that content only to provide the service to you. You are responsible for making sure your resume is accurate.</p>
      <h2>Scores and suggestions</h2>
      <p>Scores, findings and writing suggestions are guidance. They are not a guarantee of interviews, job offers or how any employer’s systems will treat your application.</p>
      <h2>Plans and billing</h2>
      <ul>
        <li>Paid plans renew automatically until cancelled.</li>
        <li>Upgrades are prorated. Downgrades and cancellations take effect at the end of the billing period.</li>
        <li>We will give at least 30 days’ notice of price changes.</li>
      </ul>
      <h2>Acceptable use</h2>
      <p>Do not use Candor to create misleading documents, to impersonate others, or to interfere with the service.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: legal@candor.app.</p>
    </ProsePage>
  );
}
