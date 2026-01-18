// src/models/schema/parent.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  char,
  boolean,
  text,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const parents = mysqlTable("parents", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  
  // ❌ شيلنا organizationId - Parent مش مرتبط بـ Organization
  // الربط بيكون من خلال الـ Students

  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 500 }),
  
  fcmToken: text("fcm_token"),
  isVerified: boolean("is_verified").default(false),

  address: varchar("address", { length: 500 }),
  nationalId: varchar("national_id", { length: 20 }),

  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
