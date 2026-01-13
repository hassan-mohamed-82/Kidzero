
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
 import {cities} from "../schema";

 export const zones = mysqlTable("zones", {
   id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
   name: varchar("name", { length: 100 }).notNull(),
   cityId: char("city_id", { length: 36 }).notNull().references(() => cities.id),
   cost: int("cost").notNull(),
   createdAt: timestamp("created_at").defaultNow(),
 });

