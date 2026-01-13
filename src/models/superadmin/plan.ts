import { mysqlTable, int, varchar, timestamp, char, double, date } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm/sql";

export const plans = mysqlTable("plan", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  // price_semester: double("price_semester").notNull().default(0),
  // price_year: double("price_year").notNull().default(0),
  price: double("price").notNull().default(0),
  // startDate: date("start_date").notNull(), //15/7
  // endDate: date("end_date").notNull(),//14/7
  
  // هتبقي yearly plan بس مش semesterly <--

  maxBuses: int("max_buses").default(10),
  maxDrivers: int("max_drivers").default(20),
  maxStudents: int("max_students").default(100),

  minSubscriptionFeesPay: double("min_subscription_fees_pay").notNull().default(0),
  subscriptionFees: double("subscription_fees").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});