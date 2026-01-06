"use strict";
// src/models/schema/bus.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.buses = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const Bustype_1 = require("../superadmin/Bustype");
const drizzle_orm_1 = require("drizzle-orm");
exports.buses = (0, mysql_core_1.mysqlTable)("buses", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull(),
    busTypeId: (0, mysql_core_1.char)("bus_types_id", { length: 36 }).notNull().references(() => Bustype_1.busTypes.id), // ✅ أضف { length: 36 }
    busNumber: (0, mysql_core_1.varchar)("bus_number", { length: 50 }).notNull(),
    plateNumber: (0, mysql_core_1.varchar)("plate_number", { length: 20 }).notNull(),
    model: (0, mysql_core_1.varchar)("model", { length: 100 }),
    color: (0, mysql_core_1.varchar)("color", { length: 50 }),
    year: (0, mysql_core_1.int)("year"),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive", "maintenance"]).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
