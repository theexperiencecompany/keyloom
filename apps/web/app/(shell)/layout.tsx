import { AppSidebar } from "@/components/app-sidebar";
import { DocsHeader } from "@/components/docs-header";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto max-w-[1600px] border-x border-dashed border-white/10 min-h-screen">
      <DocsHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 min-w-0 lg:border-l lg:border-dashed lg:border-white/10">
          {children}
        </main>
      </div>
    </div>
  );
}
