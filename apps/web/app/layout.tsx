import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "@workspace/ui/globals.css";
import "streamdown/styles.css";
import { cn } from "@workspace/ui/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Motion Studio — Cinematic scenes for Remotion",
    template: "%s — Motion Studio",
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
