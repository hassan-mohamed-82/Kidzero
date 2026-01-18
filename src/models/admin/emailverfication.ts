import {
  mysqlTable,
  varchar,
  timestamp,

} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";


export const emailVerifications = mysqlTable("email_verifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  parentId: varchar("parent_id", { length: 36 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});