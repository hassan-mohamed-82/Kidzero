import { boolean, date, int, mysqlTable, timestamp, varchar, char, double } from "drizzle-orm/mysql-core";
import { parentPlans } from "./parentPlan";
import { parents } from "../admin/parent";
import { parentPayment } from "./parentpayment";
import { sql } from "drizzle-orm";

export const parentSubscriptions = mysqlTable("parent_subscriptions", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    parentId: varchar("parent_id", { length: 255 }).notNull().references(() => parents.id),
    parentPlanId: varchar("parent_plan_id", { length: 255 }).notNull().references(() => parentPlans.id),
    parentPaymentId: varchar("parent_payment_id", { length: 255 }).notNull().references(() => parentPayment.id),
    isActive: boolean("is_active").notNull().default(true),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});