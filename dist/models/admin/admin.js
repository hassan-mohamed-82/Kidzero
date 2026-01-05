// src/models/schema/admin.ts
import { mysqlTable, varchar, timestamp, mysqlEnum, json, char, primaryKey, } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { roles } from "./roles";
import { organizations } from "../superadmin/organization";
export const admins = mysqlTable("admins", {
    id: char("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    organizationId: char("organization_id", { length: 36 }).notNull(),
    roleId: char("role_id", { length: 36 }).references(() => roles.id), // 👈 char مش int
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    avatar: varchar("avatar", { length: 500 }),
    permissions: json("permissions").$type().default([]),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export const organizationAdmins = mysqlTable("organization_admins", {
    organizationId: char("organization_id", { length: 36 })
        .notNull()
        .references(() => organizations.id),
    adminId: char("admin_id", { length: 36 })
        .notNull()
        .references(() => admins.id),
    type: mysqlEnum("type", ["organizer", "admin"]).notNull().default("admin"),
    roleId: char("role_id", { length: 36 }).references(() => roles.id), // 👈 char مش int
    permissions: json("permissions").$type().default([]),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.organizationId, table.adminId] }),
}));
//# sourceMappingURL=admin.js.map