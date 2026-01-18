"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rideOccurrences = void 0;
// src/models/schema/rideOccurrence.ts
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const Ride_1 = require("./Ride");
exports.rideOccurrences = (0, mysql_core_1.mysqlTable)("ride_occurrences", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    rideId: (0, mysql_core_1.char)("ride_id", { length: 36 }).notNull().references(() => Ride_1.rides.id, { onDelete: "cascade" }),
    occurDate: (0, mysql_core_1.date)("occur_date").notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
    startedAt: (0, mysql_core_1.timestamp)("started_at"),
    completedAt: (0, mysql_core_1.timestamp)("completed_at"),
    currentLat: (0, mysql_core_1.decimal)("current_lat", { precision: 10, scale: 8 }),
    currentLng: (0, mysql_core_1.decimal)("current_lng", { precision: 11, scale: 8 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
    rideIdIdx: (0, mysql_core_1.index)("ride_id_idx").on(table.rideId),
    occurDateIdx: (0, mysql_core_1.index)("occur_date_idx").on(table.occurDate),
    statusIdx: (0, mysql_core_1.index)("status_idx").on(table.status),
}));
