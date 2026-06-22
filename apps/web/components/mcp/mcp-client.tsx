"use client";

import {
  Copy01Icon,
  Delete02Icon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useActionState, useState } from "react";
import { createKeyAction, revokeKeyAction } from "@/app/account/actions";

type KeyRow = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
};

type Props = {
  mcpUrl: string;
  isPro: boolean;
  keys: KeyRow[];
};

function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={14} />
      {copied ? "Copied" : label}
    </Button>
  );
}

export function McpClient({ mcpUrl, isPro, keys }: Props) {
  const [state, formAction, pending] = useActionState(createKeyAction, {});

  const connectorSnippet = JSON.stringify(
    {
      mcpServers: {
        "keyloom-video": {
          url: mcpUrl,
          headers: { Authorization: "Bearer kl_live_…" },
        },
      },
    },
    null,
    2,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">MCP</h1>
        <p className="text-sm text-muted-foreground">
          Drive Keyloom from Claude Code, Cursor, or any MCP client — list,
          fork, edit, and render components from your editor.
        </p>
      </header>

      {!isPro ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle>MCP is a Pro feature</CardTitle>
            <CardDescription>
              Editing components on the website is free. Using them over MCP
              (Claude Code / Cursor) needs Pro — tool calls return an upgrade
              notice until you’re on a paid plan.
            </CardDescription>
            <CardAction>
              <Button asChild size="sm">
                <a href="/account">Upgrade to Pro</a>
              </Button>
            </CardAction>
          </CardHeader>
        </Card>
      ) : null}

      {/* Connect */}
      <Card>
        <CardHeader>
          <CardTitle>Connect in Claude / Cursor</CardTitle>
          <CardDescription>
            Add this remote MCP server, using one of your API keys as the bearer
            token.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 font-mono text-xs">
              {mcpUrl}
            </code>
            <CopyButton value={mcpUrl} label="Copy URL" />
          </div>
          <pre className="overflow-x-auto rounded-md border border-border bg-muted/50 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {connectorSnippet}
          </pre>
        </CardContent>
      </Card>

      {/* API keys */}
      <Card>
        <CardHeader>
          <CardTitle>API keys</CardTitle>
          <CardDescription>
            Use a key as the bearer token when connecting the MCP server.
          </CardDescription>
          <CardAction>
            <form action={formAction}>
              <Button type="submit" size="sm" disabled={pending}>
                <HugeiconsIcon icon={PlusSignIcon} size={14} />
                {pending ? "Creating…" : "New key"}
              </Button>
            </form>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {state.error ? (
            <p className="text-xs text-destructive">{state.error}</p>
          ) : null}

          {state.fullKey ? (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
              <p className="mb-2 text-xs font-medium">
                Copy this key now — it won't be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-background px-2 py-1 font-mono text-xs">
                  {state.fullKey}
                </code>
                <CopyButton value={state.fullKey} />
              </div>
            </div>
          ) : null}

          {keys.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
              No keys yet. Create one to connect.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {keys.map((k) => (
                <li
                  key={k.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <code className="font-mono text-xs">{k.prefix}…</code>
                    <span className="text-xs text-muted-foreground">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <form action={revokeKeyAction}>
                    <input type="hidden" name="keyId" value={k.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
                      Revoke
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
