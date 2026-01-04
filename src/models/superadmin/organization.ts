import { mysqlTable, int, varchar, timestamp , boolean, text , mysqlEnum} from "drizzle-orm/mysql-core";
import { ref } from "process";
import { subscriptions } from "./subscription";

export const organizationTypes = mysqlTable("organization_types", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const organizations = mysqlTable("organizations", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  
  organizationTypeId: int("organization_type_id").references(() => organizationTypes.id),
  address: text("address"),
  logo: varchar("logo", { length: 500 }),
  
//   subscriptionPlan: mysqlEnum("subscription_plan", ["basic", "premium", "enterprise"]).default("basic"),
//   subscriptionStart: timestamp("subscription_start"),
//   subscriptionEnd: timestamp("subscription_end"),
  subscriptionId: int("subscription_id").references(() => subscriptions.id),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

