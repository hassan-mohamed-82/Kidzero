import { mysqlTable, char, double, varchar, mysqlEnum, timestamp, text } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { parents } from "../admin/parent";
import { parentPlans } from "./parentPlan";
import { paymentMethod } from "./paymentMethod";

export const parentPayment = mysqlTable("parent_payments", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    parentId: char("parent_id", { length: 36 }).notNull().references(() => parents.id),
    planId: char("plan_id", { length: 36 }).notNull().references(() => parentPlans.id),
    paymentMethodId: char("payment_method_id", { length: 36 }).notNull().references(() => paymentMethod.id),
    amount: double("amount").notNull(),

    receiptImage: varchar("receipt_image", { length: 500 }).notNull(),

    status: mysqlEnum("status", ["pending", "completed", "rejected"]).notNull().default("pending"),
    rejectedReason: varchar("rejected_reason", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});