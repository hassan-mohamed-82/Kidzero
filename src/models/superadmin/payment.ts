import { mysqlTable, char, int , double, varchar, mysqlEnum} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { organizations } from "./organization";
import { plans } from "./plan";
export const payment = mysqlTable("payments", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    planId: char("plan_id", { length: 36 }).notNull().references(() => plans.id),
    amount: double("amount").notNull(),
    rejectedReason: varchar("rejected_reason", { length: 255  }),
    status: mysqlEnum("status", ["pending", "completed", "rejected"]).notNull().default("pending"),
});