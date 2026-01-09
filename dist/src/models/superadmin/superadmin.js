"use strict";
// src/models/schema/superAdmin.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdmins = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const superAdminRole_1 = require("./superAdminRole");
exports.superAdmins = (0, mysql_core_1.mysqlTable)("super_admins", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    passwordHashed: (0, mysql_core_1.varchar)("password_hashed", { length: 255 }).notNull(),
    // ✅ النوع: superadmin أو subadmin
    role: (0, mysql_core_1.mysqlEnum)("role", ["superadmin", "subadmin"]).notNull().default("subadmin"),
    // ✅ الـ Role ID (للـ subadmin فقط)
    roleId: (0, mysql_core_1.char)("role_id", { length: 36 }).references(() => superAdminRole_1.superAdminRoles.id),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive"]).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
