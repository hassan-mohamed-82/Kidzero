// src/models/schema/route.ts
import { mysqlTable, int, varchar, timestamp, mysqlEnum, text, time, char, } from "drizzle-orm/mysql-core";
import { pickupPoints } from "./pickuppoints";
import { sql } from "drizzle-orm";
export const routes = mysqlTable("routes", {
    id: char("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    organizationId: char("organization_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    startTime: time("start_time"),
    endTime: time("end_time"),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export const routePickupPoints = mysqlTable("route_pickup_points", {
    id: char("id", { length: 36 }).primaryKey().default(sql `(UUID())`),
    routeId: int("route_id").notNull().references(() => routes.id),
    pickupPointId: int("pickup_point_id").notNull().references(() => pickupPoints.id),
    stopOrder: int("stop_order").notNull(),
    estimatedArrival: time("estimated_arrival"),
    createdAt: timestamp("created_at").defaultNow(),
});
//# sourceMappingURL=Rout.js.map