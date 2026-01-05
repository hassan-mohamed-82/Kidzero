// src/models/schema/pickupPoint.ts

import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  mysqlEnum,
  text,
  decimal,
  char,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const pickupPoints = mysqlTable("pickup_points", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: char("organization_id", { length: 36 }).notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),

  lat: decimal("lat", { precision: 10, scale: 8 }).notNull(),
  lng: decimal("lng", { precision: 11, scale: 8 }).notNull(),

  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
