// src/models/schema/route.ts

import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  mysqlEnum,
  text,
  time,
  char,
} from "drizzle-orm/mysql-core";
import { pickupPoints } from "./pickuppoints";
import { sql } from "drizzle-orm";
import { organizations } from "../schema";

export const Rout = mysqlTable("routes", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: char("organization_id", { length: 36 }).notNull().references(()=> organizations.id),

  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),


  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const routePickupPoints = mysqlTable("route_pickup_points", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  
  // ✅ غيّر من int إلى char بطول 36
  routeId: char("route_id", { length: 36 }).notNull().references(() => Rout.id),
  pickupPointId: char("pickup_point_id", { length: 36 }).notNull().references(() => pickupPoints.id),

  stopOrder: int("stop_order").notNull(),
  estimatedArrival: time("estimated_arrival"),

  createdAt: timestamp("created_at").defaultNow(),
});
