// src/models/schema/ride.ts

import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  mysqlEnum,
  decimal,
  date,
  char,
} from "drizzle-orm/mysql-core";
import { buses } from "./Bus";
import { drivers } from "./driver";
import { codrivers } from "./codriver";
import { Rout } from "./Rout";
import { sql } from "drizzle-orm";
import { organizations } from "../schema";

export const rides = mysqlTable("rides", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id ,{ onDelete: "cascade" }), //cascade delete added when deleting organization
  busId:    char("bus_id").notNull().references(() => buses.id),
  driverId: char("driver_id", { length: 36 }).notNull().references(() => drivers.id),
  codriverId: char("codriver_id", { length: 36 }).references(() => codrivers.id),
  routeId:  char("route_id").references(() => Rout.id),

  name: varchar("name", { length: 255 }),
  rideDate: date("ride_date").notNull(),
  rideType: mysqlEnum("ride_type", ["morning", "afternoon"]).notNull(),

  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),

  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),

  currentLat: decimal("current_lat", { precision: 10, scale: 8 }),
  currentLng: decimal("current_lng", { precision: 11, scale: 8 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
