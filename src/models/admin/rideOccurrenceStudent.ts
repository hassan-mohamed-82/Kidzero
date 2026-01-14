// src/models/schema/rideOccurrenceStudent.ts
import {
  mysqlTable,
  timestamp,
  mysqlEnum,
  char,
  text,
  time,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { rideOccurrences } from "./rideOccurrence";
import { students } from "./student";
import { pickupPoints } from "./pickuppoints";

export const rideOccurrenceStudents = mysqlTable("ride_occurrence_students", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  occurrenceId: char("occurrence_id", { length: 36 }).notNull().references(() => rideOccurrences.id, { onDelete: "cascade" }),
  studentId: char("student_id", { length: 36 }).notNull().references(() => students.id),
  pickupPointId: char("pickup_point_id", { length: 36 }).notNull().references(() => pickupPoints.id),
  
  pickupTime: time("pickup_time"),
  
  status: mysqlEnum("status", ["pending", "picked_up", "dropped_off", "absent", "excused"]).default("pending"),
  excuseReason: text("excuse_reason"),
  
  pickedUpAt: timestamp("picked_up_at"),
  droppedOffAt: timestamp("dropped_off_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  occurrenceIdIdx: index("occurrence_id_idx").on(table.occurrenceId),
  studentIdIdx: index("student_id_idx").on(table.studentId),
  statusIdx: index("status_idx").on(table.status),
}));
