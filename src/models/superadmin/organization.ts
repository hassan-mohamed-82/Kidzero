import { mysqlTable, int, varchar, timestamp , boolean, text ,char, mysqlEnum} from "drizzle-orm/mysql-core";
import { ref } from "process";
import { subscriptions } from "./subscription";
import { sql } from "drizzle-orm";
import { admins } from "../admin/admin";
import { primaryKey } from "drizzle-orm/mysql-core";

export const organizationTypes = mysqlTable("organization_types", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const organizations = mysqlTable("organizations", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  // adminsId: char("admin_id", { length: 36 }).notNull().references(() => admins.id),
  organizationTypeId: int("organization_type_id").references(() => organizationTypes.id),
  address: text("address"),
  logo: varchar("logo", { length: 500 }),

  subscriptionId: int("subscription_id").references(() => subscriptions.id),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Junction table for many-to-many relationship
export const organizationAdmins = mysqlTable("organization_admins", {
  organizationId: char("organization_id", { length: 36 })
    .notNull()
    .references(() => organizations.id),
  adminId: char("admin_id", { length: 36 })
    .notNull()
    .references(() => admins.id),
  role: varchar("role", { length: 50 }).default("admin"), // Optional: admin, owner, etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.organizationId, table.adminId] }),
}));