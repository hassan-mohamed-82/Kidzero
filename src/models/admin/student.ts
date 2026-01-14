// src/models/schema/student.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  char,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { parents } from "./parent";
import { organizations ,zones} from "../schema";

export const students = mysqlTable("students", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id),
  parentId: char("parent_id", { length: 36 }).notNull().references(() => parents.id),

  name: varchar("name", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 500 }),
  grade: varchar("grade", { length: 50 }),
  classroom: varchar("classroom", { length: 50 }),
  zoneId: char("zone_id", { length: 36 }).notNull().references(() => zones.id),
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});