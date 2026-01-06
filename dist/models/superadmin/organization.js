// src/models/schema/organization/organization.ts
import { mysqlTable, varchar, timestamp, boolean, text, char } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { subscriptions } from "./subscription";
export const organizationTypes = mysqlTable("organization_types", {
    id: char("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    name: varchar("name", { length: 100 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export const organizations = mysqlTable("organizations", {
    id: char("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    organizationTypeId: char("organization_type_id", { length: 36 }).notNull().references(() => organizationTypes.id),
    subscriptionId: char("subscription_id").references(() => subscriptions.id),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address"),
    logo: varchar("logo", { length: 500 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
//# sourceMappingURL=organization.js.map