"use strict";
// src/models/schema/driver.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.drivers = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const Bus_1 = require("./Bus");
exports.drivers = (0, mysql_core_1.mysqlTable)("drivers", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull(),
    busId: (0, mysql_core_1.char)("bus_id").references(() => Bus_1.buses.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }).notNull(),
    password: (0, mysql_core_1.varchar)("password", { length: 255 }).notNull(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }),
    avatar: (0, mysql_core_1.varchar)("avatar", { length: 500 }),
    licenseNumber: (0, mysql_core_1.varchar)("license_number", { length: 50 }),
    licenseExpiry: (0, mysql_core_1.timestamp)("license_expiry"),
    nationalId: (0, mysql_core_1.varchar)("national_id", { length: 20 }),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive"]).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
