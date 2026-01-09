// src/models/schema/superAdminRole.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  json,
  char,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// تعريف نوع الصلاحيات
export type SuperAdminPermission = {
  module: string;
  actions: { id?: string; action: string }[];
};

export const superAdminRoles = mysqlTable("super_admin_roles", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull().unique(),
  permissions: json("permissions").$type<SuperAdminPermission[]>().default([]),
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
