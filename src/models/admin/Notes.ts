// src/models/schema/note.ts

import { mysqlTable, char, varchar, text, date, mysqlEnum, timestamp, boolean, uniqueIndex } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const notes = mysqlTable("notes", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: char("organization_id", { length: 36 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  type: mysqlEnum("type", ["holiday", "event", "other"]).default("holiday"),
  cancelRides: boolean("cancel_rides").default(true),
  status: mysqlEnum("status", ["active", "cancelled"]).default("active"),
  createdBy: char("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  uniqueOrgDateType: uniqueIndex("unique_org_date_type").on(table.organizationId, table.date, table.type),
}));
