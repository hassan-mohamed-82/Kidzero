// src/models/schema/notification.ts
import {
  mysqlTable,
  timestamp,
  mysqlEnum,
  char,
  varchar,
  text,
  boolean,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const notifications = mysqlTable("notifications", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: char("user_id", { length: 36 }).notNull(),
  userType: mysqlEnum("user_type", ["parent", "driver", "admin"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  data: text("data"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  userTypeIdx: index("user_type_idx").on(table.userType),
  isReadIdx: index("is_read_idx").on(table.isRead),
}));
