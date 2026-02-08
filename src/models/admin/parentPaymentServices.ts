import { mysqlTable, char, double, varchar, mysqlEnum, timestamp, int, text } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { parents } from "./parent";
import { organizationServices } from "./organizationServices";
import { paymentMethod } from "../superadmin/paymentMethod";
import { organizations } from "../superadmin/organization";
import { students } from "../schema";
export const parentPaymentOrgServices = mysqlTable("parent_payment_org_services", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    parentId: char("parent_id", { length: 36 }).notNull().references(() => parents.id),
    serviceId: char("service_id", { length: 36 }).notNull().references(() => organizationServices.id),
    studentId: char("student_id", { length: 36 }).notNull().references(() => students.id),
    paymentMethodId: char("payment_method_id", { length: 36 }).notNull().references(() => paymentMethod.id),
    organizationId: char("organization_id", { length: 36 }).notNull().references(() => organizations.id),

    amount: double("amount").notNull(),

    receiptImage: varchar("receipt_image", { length: 500 }).notNull(),

    type: mysqlEnum("type", ["onetime", "installment"]).notNull().default("onetime"), // New
    requestedInstallments: int("requested_installments").notNull().default(0), // New

    status: mysqlEnum("status", ["pending", "completed", "rejected"]).notNull().default("pending"),
    rejectedReason: varchar("rejected_reason", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});