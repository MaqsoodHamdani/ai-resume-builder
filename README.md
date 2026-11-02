# Candor

Resume analyzer and builder: analyze, improve, build and tailor resumes in one workspace. Next.js 16 (App Router), TypeScript, Tailwind 4, shadcn/ui on Base UI, Zustand, React Hook Form + Zod, Motion, Sonner.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npx tsx scripts/check-services.ts   # self-check for the analysis services
```

Log in with any valid email and an 8+ character password to open the sample workspace (Alex Morgan, four resumes). Sign up instead to start with an empty workspace and the onboarding flow.

## How it fits together

- `lib/services/`: local "AI". `parser.ts` (PDF via pdf.js, DOCX via mammoth, then sectioning), `analyzer.ts` (seven weighted categories, findings), `matcher.ts` (job description matching), `writer.ts` (rewrites, summaries, bullets). Pure and deterministic, so any of them can be swapped for an API call without touching the UI.
- `lib/store.ts`: one Zustand store persisted to localStorage (`candor-v1`), seeded from `lib/data/seed.ts`. Resumes, versions, reports, job matches, activity and settings all live here.
- `components/resume/document.tsx`: the eight templates. The same component renders the editor preview, gallery thumbnails and the PDF export (`lib/print.tsx`, via the browser's print dialog).
- `components/editor/`: section editors shared by the editor and the 9-step builder.
- `lib/config.ts`: templates, pricing, plan limits, section metadata.

## Not real yet

Authentication, payments, email and storage are simulated in the browser. AI output is rule-based. See `PRODUCT.md` for product rules (no invented skills or results, suggestions never overwrite silently).
