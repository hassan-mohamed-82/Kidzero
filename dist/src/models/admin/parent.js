"use strict";
// src/models/schema/parent.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.parents = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.parents = (0, mysql_core_1.mysqlTable)("parents", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    // ❌ شيلنا organizationId - Parent مش مرتبط بـ Organization
    // الربط بيكون من خلال الـ Students
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }).notNull().unique(),
    password: (0, mysql_core_1.varchar)("password", { length: 255 }).notNull(),
    avatar: (0, mysql_core_1.varchar)("avatar", { length: 500 }),
    fcmToken: (0, mysql_core_1.text)("fcm_token"),
    isVerified: (0, mysql_core_1.boolean)("is_verified").default(false),
    address: (0, mysql_core_1.varchar)("address", { length: 500 }),
    nationalId: (0, mysql_core_1.varchar)("national_id", { length: 20 }),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive"]).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
