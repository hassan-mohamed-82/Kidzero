"use strict";
// src/models/schema/bus.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.buses = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const Bustype_1 = require("../superadmin/Bustype");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../schema");
exports.buses = (0, mysql_core_1.mysqlTable)("buses", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull().references(() => schema_1.organizations.id, { onDelete: "cascade" }), //cascade delete added when deleting organization
    busTypeId: (0, mysql_core_1.char)("bus_types_id", { length: 36 }).notNull().references(() => Bustype_1.busTypes.id),
    // Plate number - رقم اللوحة
    plateNumber: (0, mysql_core_1.varchar)("plate_number", { length: 20 }).notNull(),
    // Bus number - رقم الباص
    busNumber: (0, mysql_core_1.varchar)("bus_number", { length: 50 }).notNull(),
    // Max number of seats - عدد المقاعد
    maxSeats: (0, mysql_core_1.int)("max_seats").notNull(),
    // License number - رقم الرخصة
    licenseNumber: (0, mysql_core_1.varchar)("license_number", { length: 50 }),
    // License end date - تاريخ انتهاء الرخصة
    licenseExpiryDate: (0, mysql_core_1.date)("license_expiry_date"),
    // Upload license photo - صورة الرخصة
    licenseImage: (0, mysql_core_1.varchar)("license_image", { length: 500 }),
    // Upload Bus photo - صورة الباص
    busImage: (0, mysql_core_1.varchar)("bus_image", { length: 500 }),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive", "maintenance"]).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
