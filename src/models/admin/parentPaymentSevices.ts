import { mysqlTable, char, double, varchar, mysqlEnum, timestamp, text } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { parents } from "../admin/parent";
import { organizationServices } from "./organizationServices";
import { paymentMethod } from "../superadmin/paymentMethod";

export const parentPaymentOrgServices = mysqlTable("parent_payment_org_services", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    parentId: char("parent_id", { length: 36 }).notNull().references(() => parents.id),
    ServiceId: char("service_id", { length: 36 }).notNull().references(() => organizationServices.id),
    paymentMethodId: char("payment_method_id", { length: 36 }).notNull().references(() => paymentMethod.id),
    amount: double("amount").notNull(),

    receiptImage: varchar("receipt_image", { length: 500 }).notNull(),

    status: mysqlEnum("status", ["pending", "completed", "rejected"]).notNull().default("pending"),
    rejectedReason: varchar("rejected_reason", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});