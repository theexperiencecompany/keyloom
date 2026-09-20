import type { Metadata } from "next";
import { BrowseShell } from "@/components/browse-shell";

export const metadata: Metadata = {
  title: "Explore scenes",
  description: "Find a scene, make it yours, and use it in your next video.",
};

export default function ComponentsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <BrowseShell>{children}</BrowseShell>;
}
