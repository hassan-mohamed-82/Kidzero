// src/models/schema/codriver.ts
import { mysqlTable, int, varchar, timestamp, mysqlEnum, char, } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { buses } from "./Bus";
export const codrivers = mysqlTable("codrivers", {
    id: char("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    organizationId: char("organization_id", { length: 36 }).notNull(),
    busId: int("bus_id").references(() => buses.id),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    avatar: varchar("avatar", { length: 500 }),
    nationalId: varchar("national_id", { length: 20 }),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
//# sourceMappingURL=codriver.js.map