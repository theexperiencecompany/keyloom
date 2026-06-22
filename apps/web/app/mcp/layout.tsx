import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "MCP",
  description: "Connect Keyloom to Claude Code, Cursor, and other MCP clients.",
};

export default function McpLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
