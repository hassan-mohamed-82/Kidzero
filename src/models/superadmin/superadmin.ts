// src/models/schema/superAdmin.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  char,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { superAdminRoles } from "./superAdminRole";

export const superAdmins = mysqlTable("super_admins", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHashed: varchar("password_hashed", { length: 255 }).notNull(),

  // ✅ النوع: superadmin أو subadmin
  role: mysqlEnum("role", ["superadmin", "subadmin"]).notNull().default("subadmin"),
  
  // ✅ الـ Role ID (للـ subadmin فقط)
  roleId: char("role_id", { length: 36 }).references(() => superAdminRoles.id),

  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
