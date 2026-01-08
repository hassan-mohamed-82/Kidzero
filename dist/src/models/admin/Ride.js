"use strict";
// src/models/schema/ride.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.rides = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const organization_1 = require("../superadmin/organization");
const Bus_1 = require("./Bus");
const driver_1 = require("./driver");
const codriver_1 = require("./codriver");
const Rout_1 = require("./Rout");
exports.rides = (0, mysql_core_1.mysqlTable)("rides", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull().references(() => organization_1.organizations.id),
    busId: (0, mysql_core_1.char)("bus_id", { length: 36 }).notNull().references(() => Bus_1.buses.id),
    driverId: (0, mysql_core_1.char)("driver_id", { length: 36 }).notNull().references(() => driver_1.drivers.id),
    codriverId: (0, mysql_core_1.char)("codriver_id", { length: 36 }).references(() => codriver_1.codrivers.id),
    routeId: (0, mysql_core_1.char)("route_id", { length: 36 }).notNull().references(() => Rout_1.Rout.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }),
    rideType: (0, mysql_core_1.mysqlEnum)("ride_type", ["morning", "afternoon"]).notNull(),
    frequency: (0, mysql_core_1.mysqlEnum)("frequency", ["once", "repeat"]).notNull(),
    repeatType: (0, mysql_core_1.mysqlEnum)("repeat_type", ["limited", "unlimited"]),
    startDate: (0, mysql_core_1.date)("start_date").notNull(),
    endDate: (0, mysql_core_1.date)("end_date"),
    isActive: (0, mysql_core_1.mysqlEnum)("is_active", ["on", "off"]).default("on"),
    status: (0, mysql_core_1.mysqlEnum)("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
    startedAt: (0, mysql_core_1.timestamp)("started_at"),
    completedAt: (0, mysql_core_1.timestamp)("completed_at"),
    currentLat: (0, mysql_core_1.decimal)("current_lat", { precision: 10, scale: 8 }),
    currentLng: (0, mysql_core_1.decimal)("current_lng", { precision: 11, scale: 8 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
