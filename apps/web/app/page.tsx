import { DocsHeader } from "@/components/docs-header";
import { AgentSpotlight } from "@/components/landing/agent-spotlight";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { GallerySection } from "@/components/landing/gallery-section";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SiteFooter } from "@/components/site-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <DocsHeader />

      <main className="mx-auto max-w-6xl border-x border-dashed border-border">
        <Hero />
        <AgentSpotlight />
        <Features />
        <HowItWorks />
        <GallerySection />
        <FinalCta />
      </main>

      <SiteFooter />
    </div>
  );
}
