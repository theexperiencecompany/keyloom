import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

const id = (prefix: string) =>
  text("id")
    .primaryKey()
    .$defaultFn(() => `${prefix}_${nanoid(24)}`);

/**
 * A keyloom user. `id` is the local user id (see lib/auth.ts). Exists only as
 * the FK target for `user_components`.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // local user id (lib/auth.ts)
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * A user-forked composition: editable TSX copied from a base composition and
 * tweaked (by the agent or by hand). `id` (e.g. "cmp_…") is also the
 * clip.compositionId that references it inside a project's `customComponents`.
 */
export const userComponents = pgTable("user_components", {
  id: id("cmp"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  baseId: text("base_id").notNull(),
  code: text("code").notNull(),
  exportName: text("export_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type UserComponentRow = typeof userComponents.$inferSelect;
