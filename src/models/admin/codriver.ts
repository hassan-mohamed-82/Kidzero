// src/models/schema/codriver.ts

import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  mysqlEnum,
  char,
  json,
  text,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { buses } from "./Bus";

export const codrivers = mysqlTable("codrivers", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: char("organization_id", { length: 36 }).notNull(),
  fcmTokens: text("fcm_tokens"), // JSON array of FCM tokens
  email: varchar("email", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  avatar: varchar("avatar", { length: 500 }),

  nationalId: varchar("national_id", { length: 20 }),
  nationalIdImage: varchar("national_id_image", { length: 500 }), // صورة البطاقة
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
