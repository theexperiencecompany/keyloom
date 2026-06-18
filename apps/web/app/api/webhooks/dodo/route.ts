import { NextResponse } from "next/server";
import { applySubscription, getUserByEmail } from "@/lib/account";
import { type DodoEvent, PLANS, verifyDodoWebhook } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Events that grant/keep Pro access vs. those that pause it.
const ACTIVATING = new Set(["subscription.active", "subscription.renewed"]);
const DEACTIVATING = new Set([
  "subscription.cancelled",
  "subscription.canceled",
  "subscription.on_hold",
  "subscription.paused",
  "subscription.failed",
  "subscription.expired",
]);

function str(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

/** Maps a Dodo event's subscription/customer back to a keyloom user — by the
 *  metadata we set at checkout, falling back to the customer email. */
async function resolveUserId(
  data: Record<string, unknown>,
): Promise<string | null> {
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const metaId = str(metadata?.keyloom_user_id);
  if (metaId) return metaId;

  const customer = data.customer as Record<string, unknown> | undefined;
  const email = str(customer?.email);
  if (email) {
    const user = await getUserByEmail(email);
    if (user) return user.id;
  }
  return null;
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  let event: DodoEvent;
  try {
    event = verifyDodoWebhook(rawBody, {
      id: req.headers.get("webhook-id") ?? "",
      signature: req.headers.get("webhook-signature") ?? "",
      timestamp: req.headers.get("webhook-timestamp") ?? "",
    });
  } catch (err) {
    console.error("[dodo-webhook] verification failed", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    const data = (event.data ?? {}) as Record<string, unknown>;
    const userId = await resolveUserId(data);
    if (!userId) {
      // Can't map to a user (e.g. checkout outside our flow) — ack so Dodo
      // doesn't retry forever.
      return NextResponse.json({ ok: true, ignored: "no matching user" });
    }

    const customer = data.customer as Record<string, unknown> | undefined;
    const dodoCustomerId = str(customer?.customer_id);
    const dodoSubscriptionId = str(data.subscription_id);
    const periodEnd = parseDate(
      data.next_billing_date ?? data.current_period_end,
    );

    if (ACTIVATING.has(event.type)) {
      await applySubscription(userId, {
        status: "active",
        plan: PLANS.pro.plan,
        renderQuota: PLANS.pro.renderQuota,
        rendersUsed: 0, // fresh period
        ...(dodoCustomerId ? { dodoCustomerId } : {}),
        ...(dodoSubscriptionId ? { dodoSubscriptionId } : {}),
        ...(periodEnd ? { periodEnd } : {}),
      });
    } else if (DEACTIVATING.has(event.type)) {
      await applySubscription(userId, { status: "canceled" });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[dodo-webhook] handler failed", err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
}
