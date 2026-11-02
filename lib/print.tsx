"use client";

import { createRoot } from "react-dom/client";
import { ResumeDocument } from "@/components/resume/document";
import { MARGINS } from "./config";
import type { Resume } from "./types";

/**
 * Export via the browser's print dialog ("Save as PDF"). The printed page is the same
 * component as the preview, so the PDF always matches what the user sees.
 */
export function printResume(resume: Resume) {
  const host = document.createElement("div");
  host.className = "print-root";
  document.body.appendChild(host);
  const root = createRoot(host);
  const m = MARGINS[resume.design.margins];
  root.render(
    <>
      <style>{`@page { size: letter; margin: ${m}px 0; }`}</style>
      <ResumeDocument content={resume.content} order={resume.sectionOrder} design={resume.design} />
    </>,
  );
  const title = document.title;
  document.title = resume.name.replace(/[\\/:*?"<>|]/g, "");
  const cleanup = () => {
    document.title = title;
    root.unmount();
    host.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  // Let React commit and fonts settle before opening the dialog.
  void document.fonts.ready.then(() => requestAnimationFrame(() => window.print()));
}
