"use strict";
// src/models/schema/admin.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.admins = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const roles_1 = require("./roles");
const organization_1 = require("../superadmin/organization");
exports.admins = (0, mysql_core_1.mysqlTable)("admins", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    // الـ Organization اللي تابع ليها
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull().references(() => organization_1.organizations.id, { onDelete: "cascade" }), //cascade delete added when deleting organization
    // الـ Role (اختياري - للـ Admin العادي)
    roleId: (0, mysql_core_1.char)("role_id", { length: 36 }).references(() => roles_1.roles.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    password: (0, mysql_core_1.varchar)("password", { length: 255 }).notNull(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }),
    avatar: (0, mysql_core_1.varchar)("avatar", { length: 500 }),
    // النوع: organizer أو admin
    type: (0, mysql_core_1.mysqlEnum)("type", ["organizer", "admin"]).notNull().default("admin"),
    // صلاحيات إضافية (override)
    permissions: (0, mysql_core_1.json)("permissions").$type().default([]),
    fcm_tokens: (0, mysql_core_1.json)("fcm_tokens").$type().default([]),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive"]).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
