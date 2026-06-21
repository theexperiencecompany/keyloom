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
 * Asks Dodo directly whether this user currently has an active subscription.
 * Used to reconcile account state on checkout return WITHOUT waiting for a
 * webhook (verify-on-return).
 *
 * Matching is two-tier:
 *   1. STRICT — the `keyloom_user_id` we stamp into checkout metadata. This is
 *      the secure path, but Dodo does NOT reliably copy checkout-session
 *      metadata onto the resulting *subscription* object (the checkout
 *      `metadata` field is documented as payment-level, and `subscription_data`
 *      has no metadata field), so the id is frequently absent here.
 *   2. EMAIL FALLBACK — match the customer email, but ONLY for subscriptions
 *      that are NOT tagged for some *other* keyloom user. Without this a real
 *      payment leaves the account on Free whenever Dodo drops the metadata.
 *
 * The email fallback is safe because `reconcileProFromDodo` only runs when the
 * user is returning from their OWN checkout (`?upgrade=success`) — never on
 * routine loads — so it can't sweep an unrelated subscription onto a stranger.
 * Dodo's status enum is pending | active | on_hold | cancelled | failed |
 * expired (there is no "trialing"; trials report as active).
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
  const active = items.filter((s) => s.status === "active");

  const wantEmail = opts.email.trim().toLowerCase();
  // 1) Strict identity: the id we control, when Dodo propagated it.
  let match = active.find(
    (s) => !!opts.userId && s.metadata?.keyloom_user_id === opts.userId,
  );
  // 2) Email fallback — only untagged subscriptions, so we never hijack one
  //    Dodo explicitly tagged for a different keyloom account.
  if (!match && wantEmail) {
    match = active.find(
      (s) =>
        !s.metadata?.keyloom_user_id &&
        s.customer?.email?.trim().toLowerCase() === wantEmail,
    );
  }

  if (process.env.NODE_ENV !== "production" || process.env.DODO_DEBUG) {
    console.warn(
      `[billing] findActiveDodoSubscription: ${items.length} total, ${active.length} active, matched=${match ? (match.metadata?.keyloom_user_id ? "by-id" : "by-email") : "none"}`,
    );
  }

  if (!match) return null;

  const rawEnd = match.next_billing_date ?? match.current_period_end;
  const end = rawEnd ? new Date(rawEnd) : undefined;
  return {
    subscriptionId: match.subscription_id ?? match.id ?? "",
    customerId: match.customer?.customer_id,
    status: match.status ?? "active",
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
