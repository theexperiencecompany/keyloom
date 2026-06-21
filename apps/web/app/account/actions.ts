"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createApiKey,
  ensureAccount,
  reconcileProFromDodo,
  revokeApiKey,
} from "@/lib/account";
import { createProCheckout } from "@/lib/billing";

export type CreateKeyState = {
  fullKey?: string;
  error?: string;
};

/** Mints a new MCP API key for the signed-in user and returns the full secret
 *  once (it's only ever shown here — we store just its hash). */
export async function createKeyAction(
  _prev: CreateKeyState,
  _formData: FormData,
): Promise<CreateKeyState> {
  try {
    const { user } = await withAuth({ ensureSignedIn: true });
    await ensureAccount(user.id, user.email);
    const { fullKey } = await createApiKey(user.id);
    revalidatePath("/account");
    return { fullKey };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not create key.",
    };
  }
}

export async function revokeKeyAction(formData: FormData): Promise<void> {
  const { user } = await withAuth({ ensureSignedIn: true });
  const keyId = String(formData.get("keyId") ?? "");
  if (keyId) await revokeApiKey(user.id, keyId);
  revalidatePath("/account");
}

/**
 * Self-service recovery: re-checks Dodo for an active subscription and upgrades
 * the account if one is found. For users whose payment went through but whose
 * account is still on Free (e.g. the activation webhook never reached prod, or
 * Dodo didn't propagate the checkout metadata). Safe to click anytime — it
 * never downgrades and no-ops when already Pro.
 */
export async function refreshBillingAction(_formData: FormData): Promise<void> {
  const { user } = await withAuth({ ensureSignedIn: true });
  await ensureAccount(user.id, user.email);
  await reconcileProFromDodo(user.id, user.email);
  revalidatePath("/account");
}

/** Starts a Dodo checkout for the Pro plan and redirects the user to it. */
export async function upgradeAction(_formData: FormData): Promise<void> {
  const { user } = await withAuth({ ensureSignedIn: true });
  await ensureAccount(user.id, user.email);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const checkoutUrl = await createProCheckout({
    userId: user.id,
    email: user.email,
    name: name || undefined,
    returnUrl: `${appUrl}/account?upgrade=success`,
  });
  // redirect() throws NEXT_REDIRECT — must be outside any try/catch.
  redirect(checkoutUrl);
}
