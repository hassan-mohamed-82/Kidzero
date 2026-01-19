import { mysqlTable, char, timestamp } from "drizzle-orm/mysql-core";
import { promocode, organizations } from "../schema";
import { sql } from "drizzle-orm";
export const adminUsedPromocodes = mysqlTable("admin_promocodes", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id),
    promocodeId: char("promocode_id", { length: 36 }).notNull().references(() => promocode.id),
    createdAt: timestamp("created_at").defaultNow(),
});