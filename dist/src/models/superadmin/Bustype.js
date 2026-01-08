"use strict";
// src/models/schema/busType.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.busTypes = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.busTypes = (0, mysql_core_1.mysqlTable)("bus_types", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    // organizationId: char("organization_id", { length: 36 }).notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    capacity: (0, mysql_core_1.int)("capacity").notNull(),
    description: (0, mysql_core_1.varchar)("description", { length: 255 }),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive"]).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
