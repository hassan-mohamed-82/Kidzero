import { boolean, char, double, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { organizations } from "../superadmin/organization";
import { sql } from "drizzle-orm";
export const organizationServices = mysqlTable("organization_services", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id),
    serviceName: varchar("service_name", { length: 255 }).notNull(),
    serviceDescription: varchar("service_description", { length: 255 }).notNull(),
    useZonePricing: boolean("use_zone_pricing").notNull().default(true),
    servicePrice: double("service_price").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
