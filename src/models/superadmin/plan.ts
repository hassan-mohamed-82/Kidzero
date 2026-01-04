import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";

export const plans = mysqlTable("plan", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),

  maxBuses: int("max_buses").default(10),
  maxDrivers: int("max_drivers").default(20),
  
  maxStudents: int("max_students").default(100),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});