// src/models/schema/admin.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  json,
  char,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { roles } from "./roles";
import { Permission } from "../../types/custom";
import { organizations } from "../superadmin/organization";

export const admins = mysqlTable("admins", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  
  // الـ Organization اللي تابع ليها
  organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id),
  
  // الـ Role (اختياري - للـ Admin العادي)
  roleId: char("role_id", { length: 36 }).references(() => roles.id),

  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  avatar: varchar("avatar", { length: 500 }),

  // النوع: organizer أو admin
  type: mysqlEnum("type", ["organizer", "admin"]).notNull().default("admin"),
  
  // صلاحيات إضافية (override)
  permissions: json("permissions").$type<Permission[]>().default([]),

  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});