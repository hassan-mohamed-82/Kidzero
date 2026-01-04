// src/models/schema/parent.ts
import { mysqlTable, varchar, int, timestamp, mysqlEnum, boolean, } from "drizzle-orm/mysql-core";
import { organizations } from "./orgnization";
export const parents = mysqlTable("parents", {
    id: int("id").primaryKey().autoincrement(),
    organizationId: int("organization_id").notNull().references(() => organizations.id),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    avatar: varchar("avatar", { length: 500 }),
    address: varchar("address", { length: 500 }),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export const children = mysqlTable("children", {
    id: int("id").primaryKey().autoincrement(),
    organizationId: int("organization_id").notNull().references(() => organizations.id),
    parentId: int("parent_id").notNull().references(() => parents.id),
    name: varchar("name", { length: 255 }).notNull(),
    grade: varchar("grade", { length: 50 }),
    photo: varchar("photo", { length: 500 }),
    dateOfBirth: timestamp("date_of_birth"),
    schoolName: varchar("school_name", { length: 255 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
//# sourceMappingURL=parent.js.map