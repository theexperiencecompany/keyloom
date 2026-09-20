import { MotionConfig } from "motion/react";
import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  JetBrains_Mono,
} from "next/font/google";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "@workspace/ui/globals.css";
import "streamdown/styles.css";
import { Toaster } from "@workspace/ui/components/sonner";
import { cn } from "@workspace/ui/lib/utils";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Keyloom — Create with cinematic scenes",
    template: "%s — Keyloom",
  },
  description:
    "Pick a scene, make it yours, and create your next video right in your browser.",
};

const fontSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased font-sans",
        fontSans.variable,
        fontDisplay.variable,
        fontMono.variable,
      )}
    >
      <body className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            <NuqsAdapter>
              <QueryProvider>{children}</QueryProvider>
            </NuqsAdapter>
            <Toaster position="bottom-right" richColors />
          </MotionConfig>
        </ThemeProvider>
        <Script
          src="https://as.heygaia.io/api/script.js"
          data-site-id="a9885789f7dd"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
