import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import { MotionConfig } from "motion/react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import "@workspace/ui/globals.css";
import "streamdown/styles.css";
import { Toaster } from "@workspace/ui/components/sonner";
import { cn } from "@workspace/ui/lib/utils";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Keyloom — Cinematic scenes for Remotion",
    template: "%s — Keyloom",
  },
  description:
    "A library of cinematic scenes for Remotion. No After Effects, no animation team — drop in, render, ship.",
};

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
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
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <ThemeProvider>
          {/* Honor the OS "reduce motion" setting for every motion-library
              animation (WCAG 2.3.3). `user` reduces transform/layout
              animations to instant transitions when the preference is on. */}
          <MotionConfig reducedMotion="user">
            {/* Provides client-side auth state (useAuth) app-wide so the navbar
                can reflect sign-in status. */}
            <AuthKitProvider>
              <QueryProvider>{children}</QueryProvider>
            </AuthKitProvider>
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
