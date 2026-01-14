// src/models/schema/rideOccurrence.ts
import {
  mysqlTable,
  timestamp,
  mysqlEnum,
  decimal,
  date,
  char,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { rides } from "./Ride";

export const rideOccurrences = mysqlTable("ride_occurrences", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  rideId: char("ride_id", { length: 36 }).notNull().references(() => rides.id, { onDelete: "cascade" }),
  
  occurDate: date("occur_date").notNull(),
  
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  currentLat: decimal("current_lat", { precision: 10, scale: 8 }),
  currentLng: decimal("current_lng", { precision: 11, scale: 8 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  rideIdIdx: index("ride_id_idx").on(table.rideId),
  occurDateIdx: index("occur_date_idx").on(table.occurDate),
  statusIdx: index("status_idx").on(table.status),
}));