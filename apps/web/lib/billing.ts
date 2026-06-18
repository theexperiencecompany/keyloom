import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";

/** Plan tiers. `free` is provisioned on first sign-in; `pro` is granted by a
 *  Dodo subscription webhook. */
export const PLANS = {
  free: { plan: "free", renderQuota: 3 },
  pro: { plan: "pro", renderQuota: 500 },
} as const;

function dodoClient(): DodoPayments {
  const bearerToken = process.env.DODO_API_KEY?.trim();
  if (!bearerToken) {
    throw new Error("DODO_API_KEY is not set — billing is not configured yet.");
  }
  const environment =
    process.env.DODO_ENVIRONMENT?.trim() === "live_mode"
      ? "live_mode"
      : "test_mode";
  return new DodoPayments({ bearerToken, environment });
}

/**
 * Creates a Dodo checkout session for the Pro subscription and returns the
 * hosted checkout URL to redirect the user to. The keyloom user id is stashed
 * in `metadata` so the webhook can map the resulting subscription back to them.
 */
export async function createProCheckout(opts: {
  userId: string;
  email: string;
  name?: string;
  returnUrl: string;
}): Promise<string> {
  const productId = process.env.DODO_PRODUCT_ID?.trim();
  if (!productId) {
    throw new Error(
      "DODO_PRODUCT_ID is not set — create the product in Dodo first.",
    );
  }
  const client = dodoClient();
  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: { email: opts.email, name: opts.name ?? opts.email },
    metadata: { keyloom_user_id: opts.userId },
    return_url: opts.returnUrl,
  });
  if (!session.checkout_url) {
    throw new Error("Dodo did not return a checkout URL.");
  }
  return session.checkout_url;
}

export type DodoEvent = {
  type: string;
  data: Record<string, unknown>;
};

/**
 * Verifies a Dodo webhook (Standard Webhooks spec) and returns the parsed
 * event. Throws if the signature is invalid or the secret is unset.
 */
export function verifyDodoWebhook(
  rawBody: string,
  headers: { id: string; signature: string; timestamp: string },
): DodoEvent {
  const secret = process.env.DODO_WEBHOOK_KEY?.trim();
  if (!secret) {
    throw new Error("DODO_WEBHOOK_KEY is not set.");
  }
  const wh = new Webhook(secret);
  wh.verify(rawBody, {
    "webhook-id": headers.id,
    "webhook-signature": headers.signature,
    "webhook-timestamp": headers.timestamp,
  });
  return JSON.parse(rawBody) as DodoEvent;
}
