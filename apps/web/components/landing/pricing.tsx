import { ArrowRight02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { upgradeAction } from "@/app/account/actions";

const FREE_FEATURES = [
  "The full Studio editor and agent",
  "All 70+ cinematic scenes",
  "Unlimited in-browser MP4 export",
  "3 cloud renders to start",
  "Open source — self-host anytime",
];

const PRO_FEATURES = [
  "Everything in Free",
  "500 cloud renders every month",
  "Priority, higher-resolution cloud rendering",
  "Drive the agent from Claude & Cursor (MCP)",
  "Priority support",
];

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[14px] text-foreground/90">
      <HugeiconsIcon
        icon={Tick02Icon}
        className="mt-0.5 size-4 shrink-0 text-primary"
      />
      {children}
    </li>
  );
}

export function Pricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-16 border-b border-dashed border-border px-6 py-20 sm:px-10 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium uppercase tracking-wider text-primary">
            Pricing
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Start free. Upgrade when you ship.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Everything you need to make videos is free and open source. Go Pro
            when you want serious cloud rendering and the agent in your editor.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-border bg-background p-7">
            <h3 className="text-lg font-semibold text-foreground">Free</h3>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tracking-tight text-foreground">
                $0
              </span>
              <span className="text-sm text-muted-foreground">forever</span>
            </div>
            <p className="mt-2 text-[14px] text-muted-foreground">
              For trying it out and self-hosting.
            </p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <Check key={f}>{f}</Check>
              ))}
            </ul>
            <Button asChild variant="outline" size="lg" className="mt-7 w-full">
              <Link href="/studio">
                Open the Studio
                <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
              </Link>
            </Button>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-background p-7">
            <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-[12px] font-semibold text-primary-foreground">
              Most popular
            </span>
            <h3 className="text-lg font-semibold text-foreground">Pro</h3>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tracking-tight text-foreground">
                $10
              </span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <p className="mt-2 text-[14px] text-muted-foreground">
              For teams shipping videos every week.
            </p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {PRO_FEATURES.map((f) => (
                <Check key={f}>{f}</Check>
              ))}
            </ul>
            <form action={upgradeAction} className="mt-7">
              <Button type="submit" size="lg" className="w-full">
                Upgrade to Pro
                <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
              </Button>
            </form>
            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              Secure checkout · cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
