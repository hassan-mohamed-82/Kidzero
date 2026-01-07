// src/models/schema/bus.ts

import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  mysqlEnum,
  char,
  date,
} from "drizzle-orm/mysql-core";
import { busTypes } from "../superadmin/Bustype";
import { sql } from "drizzle-orm";

export const buses = mysqlTable("buses", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: char("organization_id", { length: 36 }).notNull(),
  busTypeId: char("bus_types_id", { length: 36 }).notNull().references(() => busTypes.id),

  // Plate number - رقم اللوحة
  plateNumber: varchar("plate_number", { length: 20 }).notNull(),

  // Bus number - رقم الباص
  busNumber: varchar("bus_number", { length: 50 }).notNull(),

  // Max number of seats - عدد المقاعد
  maxSeats: int("max_seats").notNull(),

  // License number - رقم الرخصة
  licenseNumber: varchar("license_number", { length: 50 }),

  // License end date - تاريخ انتهاء الرخصة
  licenseExpiryDate: date("license_expiry_date"),

  // Upload license photo - صورة الرخصة
  licenseImage: varchar("license_image", { length: 500 }),

  // Upload Bus photo - صورة الباص
  busImage: varchar("bus_image", { length: 500 }),

  status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
