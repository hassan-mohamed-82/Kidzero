"use strict";
// src/models/schema/pickupPoint.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickupPoints = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.pickupPoints = (0, mysql_core_1.mysqlTable)("pickup_points", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    address: (0, mysql_core_1.text)("address"),
    lat: (0, mysql_core_1.decimal)("lat", { precision: 10, scale: 8 }).notNull(),
    lng: (0, mysql_core_1.decimal)("lng", { precision: 11, scale: 8 }).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive"]).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
