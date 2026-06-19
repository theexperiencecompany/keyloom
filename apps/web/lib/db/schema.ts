import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

const id = (prefix: string) =>
  text("id")
    .primaryKey()
    .$defaultFn(() => `${prefix}_${nanoid(24)}`);

/** A keyloom user. `id` is the WorkOS user id (auth is delegated to WorkOS). */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // WorkOS user id
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * One subscription row per user. Created as a free tier on first sign-in;
 * Dodo webhooks later flip `status`/`plan`/`renderQuota` and extend `periodEnd`.
 * `rendersUsed` is the count within the current period; reset on renewal.
 */
export const subscriptions = pgTable("subscriptions", {
  id: id("sub"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["active", "trialing", "past_due", "canceled", "none"],
  })
    .notNull()
    .default("none"),
  plan: text("plan").notNull().default("free"),
  renderQuota: integer("render_quota").notNull().default(5),
  rendersUsed: integer("renders_used").notNull().default(0),
  periodEnd: timestamp("period_end", { withTimezone: true }),
  dodoCustomerId: text("dodo_customer_id"),
  dodoSubscriptionId: text("dodo_subscription_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * MCP API keys. The full secret (`kl_live_…`) is shown to the user ONCE at
 * creation; we persist only its SHA-256 hash plus a display `prefix`.
 */
export const apiKeys = pgTable("api_keys", {
  id: id("key"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("default"),
  prefix: text("prefix").notNull(), // e.g. "kl_live_AbC1…" — safe to display
  keyHash: text("key_hash").notNull().unique(), // sha256(fullKey)
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
