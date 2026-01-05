import {
    mysqlTable,
    char, varchar, timestamp, mysqlEnum
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const admins = mysqlTable("admins", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    // role: mysqlEnum("role", ["superadmin", "admin"]).notNull().default("admin"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});