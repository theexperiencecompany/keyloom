"use client";

import {
  Copy01Icon,
  Delete02Icon,
  EyeIcon,
  FolderLibraryIcon,
  Menu01Icon,
  PencilEdit02Icon,
  PlayCircleIcon,
  PlusSignIcon,
  RefreshIcon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
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

// Mirrors the tools registered in app/api/[transport]/route.ts.
type Tool = {
  name: string;
  title: string;
  description: string;
  icon: IconSvgElement;
  args: string[];
};

const TOOL_GROUPS: { label: string; blurb: string; tools: Tool[] }[] = [
  {
    label: "Discover & render",
    blurb: "Browse the built-in library and turn a component into an MP4.",
    tools: [
      {
        name: "list_components",
        title: "List video components",
        description:
          "Lists every component you can fill and render — id, title, description, category, and brand-lock status. Call this first to discover ids.",
        icon: Menu01Icon,
        args: [],
      },
      {
        name: "get_component_schema",
        title: "Get a component's field schema",
        description:
          "Returns one component's editing contract: fields, default props, agent notes, and natural dimensions (fps / width / height / duration).",
        icon: Search01Icon,
        args: ["componentId"],
      },
      {
        name: "render_component",
        title: "Render a component to video",
        description:
          "Starts an MP4 render with your props (merged over defaults). Returns a renderId + bucketName to poll. Counts one render against your plan quota.",
        icon: PlayCircleIcon,
        args: ["componentId", "props?", "fps?", "durationInFrames?", "scale?"],
      },
      {
        name: "get_render_status",
        title: "Check a render's status",
        description:
          "Polls a render you started. Returns { done, progress }, plus a downloadable url + filename once it's finished.",
        icon: RefreshIcon,
        args: ["renderId", "bucketName"],
      },
    ],
  },
  {
    label: "Fork & edit",
    blurb: "Copy a built-in into your own editable version and rewrite it.",
    tools: [
      {
        name: "copy_component",
        title: "Copy a component to make your own",
        description:
          "Forks a built-in into your own editable version. Returns the new component's id + current code — then change it with edit_component.",
        icon: Copy01Icon,
        args: ["componentId", "name?"],
      },
      {
        name: "list_my_components",
        title: "List your components",
        description:
          "Lists the components you've made — id, name, what they were copied from, and last edit time.",
        icon: FolderLibraryIcon,
        args: [],
      },
      {
        name: "view_component",
        title: "View a component's source",
        description:
          "Gets the full source of any component — one of your copies or a built-in — so you can read it before editing.",
        icon: EyeIcon,
        args: ["id"],
      },
      {
        name: "edit_component",
        title: "Edit one of your components",
        description:
          "Replaces the full source of one of your copies. It's validated before saving, so a bad edit comes back with the error to fix and retry.",
        icon: PencilEdit02Icon,
        args: ["id", "code"],
      },
    ],
  },
];

const TOOL_COUNT = TOOL_GROUPS.reduce((n, g) => n + g.tools.length, 0);

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

      {/* Available tools */}
      <Card>
        <CardHeader>
          <CardTitle>Available tools</CardTitle>
          <CardDescription>
            What your MCP client can call once connected.
          </CardDescription>
          <CardAction>
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {TOOL_COUNT} tools
            </span>
          </CardAction>
        </CardHeader>
        <CardContent className="flex max-h-80 flex-col gap-6 overflow-y-auto pr-1">
          {TOOL_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h3>
                <p className="text-xs text-muted-foreground/70">
                  {group.blurb}
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {group.tools.map((tool) => (
                  <li
                    key={tool.name}
                    className="group flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <HugeiconsIcon icon={tool.icon} size={18} />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {tool.name}
                        </code>
                        <span className="text-sm font-medium">
                          {tool.title}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {tool.description}
                      </p>
                      {tool.args.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          {tool.args.map((arg) => (
                            <code
                              key={arg}
                              className="rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                            >
                              {arg}
                            </code>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60">
                          No arguments
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
