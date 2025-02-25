import { pgTable, text, serial, integer, decimal, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: decimal("price").notNull(),
  frequency: text("frequency").notNull(),
  nextPayment: date("next_payment").notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  isPaused: boolean("is_paused").default(false)
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions)
  .omit({ id: true, userId: true })
  .extend({
    price: z.string().min(1),
    nextPayment: z.string().min(1),
    category: z.enum(['Entertainment', 'News', 'Food', 'Health', 'Software', 'Other']),
    frequency: z.enum(['Weekly', 'Monthly', 'Quarterly', 'Yearly'])
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
