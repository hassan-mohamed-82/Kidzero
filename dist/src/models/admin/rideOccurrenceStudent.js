"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rideOccurrenceStudents = void 0;
// src/models/schema/rideOccurrenceStudent.ts
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const rideOccurrence_1 = require("./rideOccurrence");
const student_1 = require("./student");
const pickuppoints_1 = require("./pickuppoints");
exports.rideOccurrenceStudents = (0, mysql_core_1.mysqlTable)("ride_occurrence_students", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    occurrenceId: (0, mysql_core_1.char)("occurrence_id", { length: 36 }).notNull().references(() => rideOccurrence_1.rideOccurrences.id, { onDelete: "cascade" }),
    studentId: (0, mysql_core_1.char)("student_id", { length: 36 }).notNull().references(() => student_1.students.id),
    pickupPointId: (0, mysql_core_1.char)("pickup_point_id", { length: 36 }).notNull().references(() => pickuppoints_1.pickupPoints.id),
    pickupTime: (0, mysql_core_1.time)("pickup_time"),
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "picked_up", "dropped_off", "absent", "excused"]).default("pending"),
    excuseReason: (0, mysql_core_1.text)("excuse_reason"),
    pickedUpAt: (0, mysql_core_1.timestamp)("picked_up_at"),
    droppedOffAt: (0, mysql_core_1.timestamp)("dropped_off_at"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
}, (table) => ({
    occurrenceIdIdx: (0, mysql_core_1.index)("occurrence_id_idx").on(table.occurrenceId),
    studentIdIdx: (0, mysql_core_1.index)("student_id_idx").on(table.studentId),
    statusIdx: (0, mysql_core_1.index)("status_idx").on(table.status),
}));
