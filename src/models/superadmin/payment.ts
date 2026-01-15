// src/models/schema/payment.ts

import { mysqlTable, char, double, varchar, mysqlEnum, timestamp, text } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { organizations } from "./organization";
import { plans } from "./plan";
import { promocode } from "./promocodes";
import { paymentMethod } from "./paymentMethod";

export const payment = mysqlTable("payments", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id),
  planId: char("plan_id", { length: 36 }).notNull().references(() => plans.id),
  paymentMethodId: char("payment_method_id", { length: 36 }).notNull().references(() => paymentMethod.id),
  amount: double("amount").notNull(),

  // ✅ صورة الإيصال
  receiptImage: varchar("receipt_image", { length: 500 }).notNull(),

  promocodeId: char("promocode_id", { length: 36 }).references(() => promocode.id),
  status: mysqlEnum("status", ["pending", "completed", "rejected"]).notNull().default("pending"),
  paymentType: mysqlEnum("payment_type", ["subscription", "renewal", "plan_price"]).notNull().default("subscription"),
  rejectedReason: varchar("rejected_reason", { length: 255 }),

  // RequestedSubscriptionType: mysqlEnum("requested_subscription_type", ["yearly", "semester"]).notNull().default("semester"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
