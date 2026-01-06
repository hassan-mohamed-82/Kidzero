"use strict";
// src/models/schema/ride.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.rides = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const Bus_1 = require("./Bus");
const driver_1 = require("./driver");
const codriver_1 = require("./codriver");
const Rout_1 = require("./Rout");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../schema");
exports.rides = (0, mysql_core_1.mysqlTable)("rides", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull().references(() => schema_1.organizations.id),
    busId: (0, mysql_core_1.char)("bus_id").notNull().references(() => Bus_1.buses.id),
    driverId: (0, mysql_core_1.char)("driver_id", { length: 36 }).notNull().references(() => driver_1.drivers.id),
    codriverId: (0, mysql_core_1.char)("codriver_id", { length: 36 }).references(() => codriver_1.codrivers.id),
    routeId: (0, mysql_core_1.char)("route_id").references(() => Rout_1.Rout.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }),
    rideDate: (0, mysql_core_1.date)("ride_date").notNull(),
    rideType: (0, mysql_core_1.mysqlEnum)("ride_type", ["morning", "afternoon"]).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
    startedAt: (0, mysql_core_1.timestamp)("started_at"),
    completedAt: (0, mysql_core_1.timestamp)("completed_at"),
    currentLat: (0, mysql_core_1.decimal)("current_lat", { precision: 10, scale: 8 }),
    currentLng: (0, mysql_core_1.decimal)("current_lng", { precision: 11, scale: 8 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
