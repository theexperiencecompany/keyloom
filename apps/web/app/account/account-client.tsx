"use client";

import {
  Copy01Icon,
  Delete02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import { useActionState, useState } from "react";
import { createKeyAction, revokeKeyAction } from "./actions";

type KeyRow = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
};

type Props = {
  email: string;
  mcpUrl: string;
  subscription: {
    plan: string;
    status: string;
    rendersUsed: number;
    renderQuota: number;
  } | null;
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
      <HugeiconsIcon icon={Copy01Icon} size={14} />
      {copied ? "Copied" : label}
    </Button>
  );
}

export function AccountClient({ email, mcpUrl, subscription, keys }: Props) {
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-xl font-semibold">Your keyloom MCP</h1>
        <p className="text-sm text-muted-foreground">{email}</p>
      </header>

      {/* Plan / usage */}
      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-2 text-sm font-medium">Plan</h2>
        {subscription ? (
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium capitalize">
                {subscription.plan}
              </span>{" "}
              <span className="text-muted-foreground">
                ({subscription.status})
              </span>
            </div>
            <div className="text-muted-foreground">
              {subscription.rendersUsed}/{subscription.renderQuota} renders used
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No subscription yet.</p>
        )}
      </section>

      {/* Connect */}
      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-2 text-sm font-medium">Connect in Claude / Cursor</h2>
        <p className="mb-2 text-xs text-muted-foreground">
          Add this remote MCP server, using one of your API keys as the bearer
          token.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-md bg-muted px-2 py-1 text-xs">
            {mcpUrl}
          </code>
          <CopyButton value={mcpUrl} label="Copy URL" />
        </div>
        <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-[11px] leading-relaxed">
          {connectorSnippet}
        </pre>
      </section>

      {/* API keys */}
      <section className="rounded-xl border border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">API keys</h2>
          <form action={formAction}>
            <Button type="submit" size="sm" disabled={pending}>
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
              {pending ? "Creating…" : "New key"}
            </Button>
          </form>
        </div>

        {state.error ? (
          <p className="mb-3 text-xs text-destructive">{state.error}</p>
        ) : null}

        {state.fullKey ? (
          <div className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="mb-1 text-xs font-medium">
              Copy this key now — it won't be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-background px-2 py-1 text-xs">
                {state.fullKey}
              </code>
              <CopyButton value={state.fullKey} />
            </div>
          </div>
        ) : null}

        {keys.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No keys yet. Create one to connect.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <div>
                  <code className="text-xs">{k.prefix}…</code>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <form action={revokeKeyAction}>
                  <input type="hidden" name="keyId" value={k.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                    Revoke
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
