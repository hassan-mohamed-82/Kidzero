import { mysqlTable, varchar, int, timestamp, mysqlEnum, json } from "drizzle-orm/mysql-core";
import { organizations } from "./orgnization";
import { roles } from "../admin/roles";
export const codrivers = mysqlTable("codrivers", {
    id: int("id").primaryKey().autoincrement(),
    organizationId: int("organization_id").notNull().references(() => organizations.id),
    roleId: int("role_id").references(() => roles.id),
    //   busId: int("bus_id").references(() => buses.id),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    avatar: varchar("avatar", { length: 500 }),
    nationalId: varchar("national_id", { length: 20 }),
    // صلاحيات إضافية (override)
    permissions: json("permissions").$type().default([]),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
//# sourceMappingURL=codrivers.js.map