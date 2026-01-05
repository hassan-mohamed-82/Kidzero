import { boolean, mysqlTable, timestamp, char } from "drizzle-orm/mysql-core";
import { plans } from "./plan";
import { sql } from "drizzle-orm";
import { payment } from "./payment";
export const subscriptions = mysqlTable("subscriptions", {
    id: char("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    planId: char("plan_id", { length: 36 }).notNull().references(() => plans.id),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    paymentId: char("payment_id", { length: 36 }).notNull().references(() => payment.id),
    isActive: boolean("is_active").notNull().default(true),
});
//# sourceMappingURL=subscription.js.map