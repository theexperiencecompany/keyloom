"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { refreshBillingAction, upgradeAction } from "./actions";

type Props = {
  email: string;
  name: string;
  avatarUrl?: string | null;
  subscription: {
    plan: string;
    status: string;
    rendersUsed: number;
    renderQuota: number;
  } | null;
};

function ProfileAvatar({
  src,
  fallback,
}: {
  src?: string | null;
  fallback: string;
}) {
  if (src) {
    // External WorkOS avatar — plain <img> avoids next/image remote config.
    return (
      <img
        src={src}
        alt=""
        className="size-14 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
      {fallback}
    </div>
  );
}

export function AccountClient({ email, name, avatarUrl, subscription }: Props) {
  const isPro = subscription && subscription.plan !== "free";
  const usagePct = subscription
    ? Math.min(
        100,
        Math.round(
          (subscription.rendersUsed / Math.max(1, subscription.renderQuota)) *
            100,
        ),
      )
    : 0;
  const initial = (name || email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center gap-4">
        <ProfileAvatar src={avatarUrl} fallback={initial} />
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {name || email}
          </h1>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
      </header>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{name || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{email}</span>
          </div>
        </CardContent>
      </Card>

      {/* Plan / usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Plan
            {subscription ? (
              <Badge variant={isPro ? "default" : "secondary"}>
                {isPro ? "Pro" : "Free"}
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            {subscription
              ? `Status: ${subscription.status}`
              : "No subscription yet."}
          </CardDescription>
          {subscription?.plan === "free" ? (
            <CardAction className="flex flex-wrap items-center gap-2">
              <form action={upgradeAction}>
                <Button type="submit" size="sm">
                  Upgrade to Pro
                </Button>
              </form>
              <form action={refreshBillingAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  Already paid? Refresh
                </Button>
              </form>
            </CardAction>
          ) : null}
        </CardHeader>
        {subscription ? (
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Renders used</span>
              <span className="font-medium tabular-nums">
                {subscription.rendersUsed} / {subscription.renderQuota}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
