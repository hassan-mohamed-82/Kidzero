// src/models/schema/rideStudent.ts

import {
  mysqlTable,
  timestamp,
  mysqlEnum,
  char,
  text,
  time,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { rides } from "./Ride";
import { students } from "./student";
import { pickupPoints } from "./pickuppoints";

export const rideStudents = mysqlTable("ride_students", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  rideId: char("ride_id", { length: 36 }).notNull().references(() => rides.id),
  studentId: char("student_id", { length: 36 }).notNull().references(() => students.id),
  pickupPointId: char("pickup_point_id", { length: 36 }).notNull().references(() => pickupPoints.id),

  pickupTime: time("pickup_time"),

  status: mysqlEnum("status", ["pending", "picked_up", "dropped_off", "absent", "excused"]).default("pending"),
  excuseReason: text("excuse_reason"),
  pickedUpAt: timestamp("picked_up_at"),
  droppedOffAt: timestamp("dropped_off_at"),

  createdAt: timestamp("created_at").defaultNow(),
});