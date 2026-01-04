import { mysqlTable, varchar, int, boolean, timestamp, mysqlEnum, text, } from "drizzle-orm/mysql-core";
export const organizations = mysqlTable("organizations", {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    organizationName: varchar("organization_name", { length: 255 }).notNull(),
    address: text("address"),
    logo: varchar("logo", { length: 500 }),
    subscriptionPlan: mysqlEnum("subscription_plan", ["basic", "premium", "enterprise"]).default("basic"),
    subscriptionStart: timestamp("subscription_start"),
    subscriptionEnd: timestamp("subscription_end"),
    maxBuses: int("max_buses").default(10),
    maxDrivers: int("max_drivers").default(20),
    maxStudents: int("max_students").default(100),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
//# sourceMappingURL=orgnization.js.map