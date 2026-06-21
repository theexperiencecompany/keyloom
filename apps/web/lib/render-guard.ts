import { withAuth } from "@workos-inc/authkit-nextjs";
import { consumeRender, ensureAccount } from "@/lib/account";

export type RenderClaim =
  | { ok: true; userId: string }
  | { ok: false; status: number; reason: string };

/**
 * Gate a web render entry point: require a signed-in WorkOS session and
 * atomically claim one render against the user's quota.
 *
 * The MCP route already enforces quota via `consumeRender`, but the studio's
 * own export endpoints (`/api/render`, `/api/render/lambda`) historically ran
 * unauthenticated — so the free/Pro distinction was trivially bypassable and an
 * anonymous caller could run up AWS Lambda / headless-Chromium cost at will.
 * Routing both through here closes that gap.
 *
 * Returns the userId on success, or `{ ok: false, status, reason }` so the
 * caller can format the error in its own response style (text vs JSON). We do
 * NOT use `ensureSignedIn: true` — that redirects, which is wrong for a fetch.
 */
export async function claimRender(): Promise<RenderClaim> {
  const { user } = await withAuth();
  if (!user) {
    return { ok: false, status: 401, reason: "Sign in to export." };
  }
  // Logged-in users who never opened /account may not have a subscription row
  // yet; provision the free tier so consumeRender has a quota to draw from.
  await ensureAccount(user.id, user.email);
  const claim = await consumeRender(user.id);
  if (!claim.ok) {
    return {
      ok: false,
      status: 402,
      reason: claim.reason ?? "Render quota reached.",
    };
  }
  return { ok: true, userId: user.id };
}
