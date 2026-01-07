import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  char,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const parents = mysqlTable("parents", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: char("organization_id", { length: 36 }).notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 500 }),

  address: varchar("address", { length: 500 }),
  nationalId: varchar("national_id", { length: 20 }),

  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});