"use strict";
// src/models/schema/note.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.notes = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const admin_1 = require("./admin");
const Ride_1 = require("./Ride");
const sql_1 = require("drizzle-orm/sql");
exports.notes = (0, mysql_core_1.mysqlTable)("notes", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, sql_1.sql) `(UUID())`),
    organizationId: (0, mysql_core_1.char)("organization_id", { length: 36 }).notNull(),
    createdById: (0, mysql_core_1.char)("created_by_id", { length: 36 }).notNull().references(() => admin_1.admins.id),
    rideId: (0, mysql_core_1.char)("ride_id").references(() => Ride_1.rides.id),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    content: (0, mysql_core_1.text)("content").notNull(),
    priority: (0, mysql_core_1.mysqlEnum)("priority", ["low", "medium", "high"]).default("medium"),
    type: (0, mysql_core_1.mysqlEnum)("type", ["general", "incident", "reminder", "complaint"]).default("general"),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "archived"]).default("active"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
