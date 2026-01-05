import { mysqlTable, char, double, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { organizations } from "./organization";
import { sql } from "drizzle-orm";  

export const organizationPayment = mysqlTable("organization_payments", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id),
    paymentId: char("payment_id", { length: 36 }).notNull().references(() => organizations.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});