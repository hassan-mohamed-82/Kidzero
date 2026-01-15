// import { char, mysqlEnum, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
// import { organizations } from "../superadmin/organization";

// export const organizationServices = mysqlTable("organization_services", {
//     id: char("id", { length: 36 }).primaryKey(),
//     organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id),
//     serviceName: varchar("service_name", { length: 255 }).notNull(),
//     serviceDescription: varchar("service_description", { length: 255 }).notNull(),
//     servicePrice: varchar("service_price", { length: 255 }).notNull(),
//     createdAt: timestamp("created_at").notNull().defaultNow(),
//     updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
// });