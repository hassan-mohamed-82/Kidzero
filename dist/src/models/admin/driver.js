"use strict";
// src/models/schema/driver.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.drivers = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.drivers = (0, mysql_core_1.mysqlTable)("drivers", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull(),
    fcmTokens: (0, mysql_core_1.text)("fcm_tokens"), // JSON array of FCM tokens
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }).notNull().unique(), // للـ Login
    password: (0, mysql_core_1.varchar)("password", { length: 255 }).notNull(),
    avatar: (0, mysql_core_1.varchar)("avatar", { length: 500 }),
    // بيانات الرخصة
    licenseExpiry: (0, mysql_core_1.timestamp)("license_expiry"),
    licenseImage: (0, mysql_core_1.varchar)("license_image", { length: 500 }), // صورة الرخصة
    // بيانات البطاقة
    nationalId: (0, mysql_core_1.varchar)("national_id", { length: 20 }),
    nationalIdImage: (0, mysql_core_1.varchar)("national_id_image", { length: 500 }), // صورة البطاقة
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive"]).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
