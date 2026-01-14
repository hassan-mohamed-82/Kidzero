import { boolean, date, int, mysqlTable, timestamp, varchar, char } from "drizzle-orm/mysql-core";
import { plans } from "./plan";
import { organizations } from "./organization";
import { sql } from "drizzle-orm";
import { payment } from "./payment";
import { mysqlEnum } from "drizzle-orm/mysql-core";
export const subscriptions = mysqlTable("subscriptions", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    planId: char("plan_id", { length: 36 }).notNull().references(() => plans.id),
    organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    paymentId: char("payment_id", { length: 36 }).notNull().references(() => payment.id),
    isActive: boolean("is_active").notNull().default(true),

    // subscriptionType: mysqlEnum("subscription_type", ["yearly", "semester"]).notNull().default("semester"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});