// src/models/schema/role.ts
import { mysqlTable, varchar, int, timestamp, mysqlEnum, json, } from "drizzle-orm/mysql-core";
import { organizations } from "../user/orgnization";
export const roles = mysqlTable("roles", {
    id: int("id").primaryKey().autoincrement(),
    organizationId: int("organization_id").notNull().references(() => organizations.id),
    name: varchar("name", { length: 100 }).notNull(),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    permissions: json("permissions").$type().default([]),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
//# sourceMappingURL=roles.js.map