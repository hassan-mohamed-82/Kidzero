import { char } from "drizzle-orm/mysql-core";
import { mysqlTable, varchar, mysqlEnum, boolean } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { double } from "drizzle-orm/mysql-core";

export const paymentMethod = mysqlTable("payment_methods", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 255 }),
    logo: varchar("logo", { length: 500 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    feeStatus: boolean("fee_status").notNull().default(true),
    feeAmount: double("fee_amount").notNull().default(0),
});