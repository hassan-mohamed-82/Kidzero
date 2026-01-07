// src/models/schema/organization/organization.ts

import { mysqlTable, int, varchar, timestamp, boolean, text, char, mysqlEnum, primaryKey, json } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { subscriptions } from "./subscription";
import { roles } from "../admin/roles";
import { Permission } from "../../types/custom";
import { admins } from "../admin/admin";

export const organizationTypes = mysqlTable("organization_types", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const organizations = mysqlTable("organizations", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationTypeId: char("organization_type_id", { length: 36 }).notNull().references(() => organizationTypes.id),
  subscriptionId: char("subscription_id", { length: 36 }).references(() => subscriptions.id),
  status: mysqlEnum("status", ["active", "blocked", "subscribed"]).default("active"),

  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  logo: varchar("logo", { length: 500 }).notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});


