// src/models/schema/busType.ts
import { mysqlTable, int, varchar, timestamp, mysqlEnum, char, } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
export const busTypes = mysqlTable("bus_types", {
    id: char("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    // organizationId: char("organization_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    capacity: int("capacity").notNull(),
    description: varchar("description", { length: 255 }),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
//# sourceMappingURL=Bustype.js.map