import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Browse components, fork them, and manage your projects.",
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
