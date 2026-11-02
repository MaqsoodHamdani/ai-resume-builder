import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Source_Serif_4, EB_Garamond } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Resume typefaces, selectable in the editor.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"] });
const garamond = EB_Garamond({ variable: "--font-garamond", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Candor — Resume analysis and builder", template: "%s · Candor" },
  description:
    "Analyze your resume, uncover opportunities for improvement, and create a professional resume tailored to the jobs you want.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${sourceSerif.variable} ${garamond.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TooltipProvider delay={300}>{children}</TooltipProvider>
        <Toaster theme="light" position="bottom-right" />
      </body>
    </html>
  );
}
