import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";

/** Plan tiers. `free` is provisioned on first sign-in; `pro` is granted by a
 *  Dodo subscription webhook. */
export const PLANS = {
  free: { plan: "free", renderQuota: 3 },
  pro: { plan: "pro", renderQuota: 500 },
} as const;

function dodoClient(): DodoPayments {
  // DODO_PAYMENTS_API_KEY is the SDK's conventional env name; DODO_API_KEY kept
  // as a fallback.
  const bearerToken = (
    process.env.DODO_PAYMENTS_API_KEY ?? process.env.DODO_API_KEY
  )?.trim();
  if (!bearerToken) {
    throw new Error(
      "DODO_PAYMENTS_API_KEY is not set — billing is not configured yet.",
    );
  }
  // Prefer an explicit base URL (e.g. https://test.dodopayments.com) when set;
  // otherwise pick the environment from DODO_ENVIRONMENT.
  const baseURL = process.env.DODO_BASE_URL?.trim();
  if (baseURL) {
    return new DodoPayments({ bearerToken, baseURL });
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

type DodoSubscription = {
  subscription_id?: string;
  id?: string;
  status?: string;
  customer?: { email?: string; customer_id?: string };
  metadata?: Record<string, string>;
  next_billing_date?: string;
  current_period_end?: string;
};

export type ActiveDodoSubscription = {
  subscriptionId: string;
  customerId?: string;
  status: string;
  periodEnd?: Date;
};

/**
 * Asks Dodo directly whether this user currently has an active/trialing
 * subscription. Used to reconcile account state on page load WITHOUT waiting for
 * a webhook (verify-on-return). Matches by the keyloom_user_id we stamp into
 * checkout metadata, falling back to the customer email.
 */
export async function findActiveDodoSubscription(opts: {
  userId: string;
  email: string;
}): Promise<ActiveDodoSubscription | null> {
  const client = dodoClient();
  const res = (await client.subscriptions.list({
    page_size: 100,
  })) as unknown as {
    items?: DodoSubscription[];
    data?: DodoSubscription[];
  };
  const items = res.items ?? res.data ?? [];
  const email = opts.email.toLowerCase();
  const mine = items.filter(
    (s) =>
      s.metadata?.keyloom_user_id === opts.userId ||
      s.customer?.email?.toLowerCase() === email,
  );
  const active = mine.find(
    (s) => s.status === "active" || s.status === "trialing",
  );
  if (!active) return null;

  const rawEnd = active.next_billing_date ?? active.current_period_end;
  const end = rawEnd ? new Date(rawEnd) : undefined;
  return {
    subscriptionId: active.subscription_id ?? active.id ?? "",
    customerId: active.customer?.customer_id,
    status: active.status ?? "active",
    periodEnd: end && !Number.isNaN(end.getTime()) ? end : undefined,
  };
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
  const secret = (
    process.env.DODO_WEBHOOK_PAYMENTS_SECRET ?? process.env.DODO_WEBHOOK_KEY
  )?.trim();
  if (!secret) {
    throw new Error("DODO_WEBHOOK_PAYMENTS_SECRET is not set.");
  }
  const wh = new Webhook(secret);
  wh.verify(rawBody, {
    "webhook-id": headers.id,
    "webhook-signature": headers.signature,
    "webhook-timestamp": headers.timestamp,
  });
  return JSON.parse(rawBody) as DodoEvent;
}
