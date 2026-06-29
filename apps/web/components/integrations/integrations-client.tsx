"use client";

import {
  InstagramIcon,
  Tick02Icon,
  TiktokIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useState } from "react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: InstagramIcon },
  { id: "tiktok", label: "TikTok", icon: TiktokIcon },
] as const;

export function IntegrationsClient({
  connected,
}: {
  connected: Record<string, boolean>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/social/connect", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start connection");
      }
      // upload-post's hosted page handles the actual OAuth for each platform.
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect your social accounts to publish and schedule memes straight to
          Instagram and TikTok.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Social accounts</CardTitle>
          <CardDescription>
            You'll be sent to a secure page to authorize each account. We never
            see your social passwords.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {PLATFORMS.map((p) => {
              const isConnected = !!connected[p.id];
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <HugeiconsIcon icon={p.icon} size={18} />
                    </div>
                    <span className="text-sm font-medium">{p.label}</span>
                  </div>
                  {isConnected ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                      <HugeiconsIcon icon={Tick02Icon} size={14} />
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Not connected
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <div>
            <Button onClick={connect} disabled={loading}>
              {loading ? "Opening…" : "Connect accounts"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
