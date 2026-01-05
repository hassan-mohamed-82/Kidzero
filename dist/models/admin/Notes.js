// src/models/schema/note.ts
import { mysqlTable, int, varchar, timestamp, mysqlEnum, text, char, } from "drizzle-orm/mysql-core";
import { admins } from "./admin";
import { rides } from "./Ride";
import { sql } from "drizzle-orm/sql";
export const notes = mysqlTable("notes", {
    id: char("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    organizationId: char("organization_id", { length: 36 }).notNull(),
    createdById: char("created_by_id", { length: 36 }).notNull().references(() => admins.id),
    rideId: int("ride_id").references(() => rides.id),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
    type: mysqlEnum("type", ["general", "incident", "reminder", "complaint"]).default("general"),
    status: mysqlEnum("status", ["active", "archived"]).default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
//# sourceMappingURL=Notes.js.map