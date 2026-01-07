"use strict";
// src/models/schema/organization/organization.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizations = exports.organizationTypes = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.organizationTypes = (0, mysql_core_1.mysqlTable)("organization_types", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull().unique(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.organizations = (0, mysql_core_1.mysqlTable)("organizations", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationTypeId: (0, mysql_core_1.char)("organization_type_id", { length: 36 }).notNull().references(() => exports.organizationTypes.id),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "blocked", "subscribed"]).default("active"),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    address: (0, mysql_core_1.text)("address").notNull(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }).notNull().unique(),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    logo: (0, mysql_core_1.varchar)("logo", { length: 500 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
