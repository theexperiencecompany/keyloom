import { withAuth } from "@workos-inc/authkit-nextjs";
import { ensureAccount, getSubscription, listApiKeys } from "@/lib/account";
import { AccountClient } from "./account-client";

// Always fresh — keys/usage change per request.
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  await ensureAccount(user.id, user.email);

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
