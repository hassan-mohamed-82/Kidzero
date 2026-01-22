import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  char,
  text,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const drivers = mysqlTable("drivers", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: char("organization_id", { length: 36 }).notNull(),
  fcmTokens: text("fcm_tokens"), // ✅ بدون default
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 500 }),
  licenseExpiry: timestamp("license_expiry"),
  licenseImage: varchar("license_image", { length: 500 }),
  nationalId: varchar("national_id", { length: 20 }),
  nationalIdImage: varchar("national_id_image", { length: 500 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
