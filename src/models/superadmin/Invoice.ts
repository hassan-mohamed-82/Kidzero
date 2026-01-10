import { varchar , mysqlTable ,char , double, timestamp } from "drizzle-orm/mysql-core";
import { plans, subscriptions , organizations } from "../schema";
import { mysqlEnum } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm/sql";

export const invoice = mysqlTable("invoices", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id),
    subscriptionId: char("subscription_id", { length: 36 }).notNull().references(() => subscriptions.id),
    amount: double("amount", { precision: 10, scale: 2 }).notNull(),
    planId: char("plan_id", { length: 36 }).notNull().references(() => plans.id),
    issuedAt: timestamp("issued_at").defaultNow(),
    dueAt: timestamp("due_at").notNull(),
    paidAt: timestamp("paid_at"),
    status: mysqlEnum("status", ["pending", "paid", "overdue"]).notNull().default("pending"),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});