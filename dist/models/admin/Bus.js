// src/models/schema/bus.ts
import { mysqlTable, int, varchar, timestamp, mysqlEnum, char, } from "drizzle-orm/mysql-core";
import { busTypes } from "../superadmin/Bustype";
import { sql } from "drizzle-orm";
export const buses = mysqlTable("buses", {
    id: char("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    organizationId: char("organization_id", { length: 36 }).notNull(),
    busTypeId: char("bus_types_id").notNull().references(() => busTypes.id),
    busNumber: varchar("bus_number", { length: 50 }).notNull(),
    plateNumber: varchar("plate_number", { length: 20 }).notNull(),
    model: varchar("model", { length: 100 }),
    color: varchar("color", { length: 50 }),
    year: int("year"),
    status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
//# sourceMappingURL=Bus.js.map