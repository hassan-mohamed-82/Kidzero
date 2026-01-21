
import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  mysqlEnum,
  char,
  date,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { organizations } from "../schema";

export const cities = mysqlTable("cities", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

