import { boolean, date, int, mysqlTable, timestamp } from "drizzle-orm/mysql-core";
import { plans } from "./plan";
import { organizations } from "./organization";

export const subscriptions = mysqlTable("subscriptions", {
    id: int("id").primaryKey().autoincrement(),
    planId: int("plan_id").notNull().references(() => plans.id),
    organizationId: int("organization_id").notNull().references(() => organizations.id),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    isActive: boolean("is_active").notNull().default(true),
});