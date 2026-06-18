"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { revalidatePath } from "next/cache";
import { createApiKey, ensureAccount, revokeApiKey } from "@/lib/account";

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
