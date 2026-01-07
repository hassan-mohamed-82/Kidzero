"use strict";
// src/models/schema/route.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.routePickupPoints = exports.Rout = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const pickuppoints_1 = require("./pickuppoints");
const schema_1 = require("../schema");
// ✅ Schema للـ SELECT فقط (كل الـ columns)
exports.Rout = (0, mysql_core_1.mysqlTable)("routes", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().notNull(),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 })
        .notNull()
        .references(() => schema_1.organizations.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive"]),
    createdAt: (0, mysql_core_1.timestamp)("created_at"),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at"),
});
exports.routePickupPoints = (0, mysql_core_1.mysqlTable)("route_pickup_points", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().notNull(),
    routeId: (0, mysql_core_1.char)("route_id", { length: 36 })
        .notNull()
        .references(() => exports.Rout.id),
    pickupPointId: (0, mysql_core_1.char)("pickup_point_id", { length: 36 })
        .notNull()
        .references(() => pickuppoints_1.pickupPoints.id),
    stopOrder: (0, mysql_core_1.int)("stop_order").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at"),
});
