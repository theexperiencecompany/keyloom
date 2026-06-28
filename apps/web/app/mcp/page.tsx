import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { McpClient } from "@/components/mcp/mcp-client";
import { ensureAccount, getSubscription, listApiKeys } from "@/lib/account";

// Always fresh — keys change per request.
export const dynamic = "force-dynamic";

export default async function McpPage() {
  const { user } = await withAuth();
  if (!user) redirect("/api/auth/signin");
  await ensureAccount(user.id, user.email);

  const [subscription, keys] = await Promise.all([
    getSubscription(user.id),
    listApiKeys(user.id),
  ]);

  const isPro =
    !!subscription &&
    subscription.plan !== "free" &&
    (subscription.status === "active" || subscription.status === "trialing");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.keyloom.app";

  return (
    <McpClient
      mcpUrl={`${appUrl}/api/mcp`}
      isPro={isPro}
      keys={keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        createdAt: k.createdAt.toISOString(),
      }))}
    />
  );
}
