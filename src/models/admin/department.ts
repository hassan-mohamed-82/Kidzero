// src/models/schema/driver.ts

import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  mysqlEnum,
  char,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const departments = mysqlTable("departments", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: char("organization_id", { length: 36 }).notNull(),

  name: varchar("name", { length: 255 }).notNull(),
});