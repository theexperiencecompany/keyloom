import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import {
  ensureAccount,
  getSubscription,
  listApiKeys,
  reconcileProFromDodo,
} from "@/lib/account";
import { AccountClient } from "./account-client";

// Always fresh — keys/usage change per request.
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  // No `ensureSignedIn` here — that redirects during render and tries to set the
  // PKCE cookie (forbidden in render). Instead send signed-out users to the
  // sign-in route handler, which can set it.
  const { user } = await withAuth();
  if (!user) redirect("/api/auth/signin");
  await ensureAccount(user.id, user.email);
  // Verify-on-return: ask Dodo if they've subscribed and flip to Pro right away,
  // so a successful payment shows up without waiting on a webhook.
  await reconcileProFromDodo(user.id, user.email);

  const [subscription, keys] = await Promise.all([
    getSubscription(user.id),
    listApiKeys(user.id),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://keyloom.app";

  return (
    <AccountClient
      email={user.email}
      mcpUrl={`${appUrl}/api/mcp`}
      subscription={
        subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              rendersUsed: subscription.rendersUsed,
              renderQuota: subscription.renderQuota,
            }
          : null
      }
      keys={keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        createdAt: k.createdAt.toISOString(),
      }))}
    />
  );
}
