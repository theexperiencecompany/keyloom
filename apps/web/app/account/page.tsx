import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import {
  ensureAccount,
  getSubscription,
  reconcileProFromDodo,
} from "@/lib/account";
import { AccountClient } from "./account-client";

// Always fresh — keys/usage change per request.
export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>;
}) {
  // No `ensureSignedIn` here — that redirects during render and tries to set the
  // PKCE cookie (forbidden in render). Instead send signed-out users to the
  // sign-in route handler, which can set it.
  const { user } = await withAuth();
  if (!user) redirect("/api/auth/signin");
  await ensureAccount(user.id, user.email);
  // Verify-on-return: ONLY when the user is returning from a successful Dodo
  // checkout (`?upgrade=success`). Running this on every load made unrelated
  // accounts resolve to an active Dodo subscription and get flipped to Pro.
  // Routine logins must never reconcile — the webhook keeps state in sync.
  const { upgrade } = await searchParams;
  if (upgrade === "success") {
    await reconcileProFromDodo(user.id, user.email);
  }

  const subscription = await getSubscription(user.id);

  const name = user.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : "";

  return (
    <AccountClient
      email={user.email}
      name={name}
      avatarUrl={user.profilePictureUrl}
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
    />
  );
}
