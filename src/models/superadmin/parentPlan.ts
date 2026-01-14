import { mysqlTable, int, varchar, timestamp, char, double, date } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm/sql";





export const parentPlans = mysqlTable("parent_plan", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),

  price: double("price").notNull().default(0),


  minSubscriptionFeesPay: double("min_subscription_fees_pay").notNull().default(0),
  subscriptionFees: double("subscription_fees").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),

});