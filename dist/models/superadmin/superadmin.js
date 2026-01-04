// src/models/schema.ts
import { mysqlTable, varchar, int, boolean, timestamp, mysqlEnum, text, json, } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
// ==================== SUPER ADMIN ====================
export const superAdmins = mysqlTable("super_admins", {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
// ==================== ORGANIZATIONS (Admin) ====================
export const organizations = mysqlTable("organizations", {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    organizationName: varchar("organization_name", { length: 255 }).notNull(),
    address: text("address"),
    logo: varchar("logo", { length: 500 }),
    subscriptionPlan: mysqlEnum("subscription_plan", ["basic", "premium", "enterprise"]).default("basic"),
    subscriptionStart: timestamp("subscription_start"),
    subscriptionEnd: timestamp("subscription_end"),
    maxBuses: int("max_buses").default(10),
    maxDrivers: int("max_drivers").default(20),
    maxStudents: int("max_students").default(100),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
// ==================== ROLES ====================
export const roles = mysqlTable("roles", {
    id: int("id").primaryKey().autoincrement(),
    organizationId: int("organization_id").notNull().references(() => organizations.id),
    name: varchar("name", { length: 100 }).notNull(),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    // الصلاحيات كـ JSON
    // [{ module: "students", actions: ["view", "add", "edit"] }]
    permissions: json("permissions").$type().default([]),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
// ==================== USERS ====================
export const users = mysqlTable("users", {
    id: int("id").primaryKey().autoincrement(),
    organizationId: int("organization_id").notNull().references(() => organizations.id),
    roleId: int("role_id").references(() => roles.id),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    avatar: varchar("avatar", { length: 500 }),
    userType: mysqlEnum("user_type", ["staff", "driver", "codriver", "parent"]).notNull(),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    // صلاحيات إضافية خاصة باليوزر (override)
    permissions: json("permissions").$type().default([]),
    // للسائقين
    licenseNumber: varchar("license_number", { length: 50 }),
    licenseExpiry: timestamp("license_expiry"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
// ==================== RELATIONS ====================
export const rolesRelations = relations(roles, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [roles.organizationId],
        references: [organizations.id],
    }),
    users: many(users),
}));
export const usersRelations = relations(users, ({ one }) => ({
    organization: one(organizations, {
        fields: [users.organizationId],
        references: [organizations.id],
    }),
    role: one(roles, {
        fields: [users.roleId],
        references: [roles.id],
    }),
}));
//# sourceMappingURL=superadmin.js.map