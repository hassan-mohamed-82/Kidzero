import { mysqlTable, int, varchar, timestamp, char, double } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm/sql";

export const plans = mysqlTable("plan", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  price_semester: double("price_semester").notNull().default(0),
  price_year: double("price_year").notNull().default(0),

  maxBuses: int("max_buses").default(10),
  maxDrivers: int("max_drivers").default(20),
  maxStudents: int("max_students").default(100),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});