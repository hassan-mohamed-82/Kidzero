// src/models/schema/route.ts

import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  mysqlEnum,
  text,
  char,
} from "drizzle-orm/mysql-core";
import { pickupPoints } from "./pickuppoints";
import { organizations } from "../schema";

// ✅ Schema للـ SELECT فقط (كل الـ columns)
export const Rout = mysqlTable("routes", {
  id: char("id", { length: 36 }).primaryKey().notNull(),
  organizationId: char("organization_id", { length: 36 })
    .notNull()
    .references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "inactive"]),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const routePickupPoints = mysqlTable("route_pickup_points", {
  id: char("id", { length: 36 }).primaryKey().notNull(),
  routeId: char("route_id", { length: 36 })
    .notNull()
    .references(() => Rout.id),
  pickupPointId: char("pickup_point_id", { length: 36 })
    .notNull()
    .references(() => pickupPoints.id),
  stopOrder: int("stop_order").notNull(),
  createdAt: timestamp("created_at"),
});
